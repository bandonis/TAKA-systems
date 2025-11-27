import { NextResponse } from 'next/server';
import { z } from 'zod';

import { PaymentStatus } from '@prisma/client';

import { prisma } from '@/lib/db';
import { calculateEventPrice } from '@/lib/events';
import { withTenantRoute, BadRequestError, ConflictError, NotFoundError } from '@/lib/tenants';
import { getStripeClient, getPublicUrl } from '@/lib/payments';

const requestSchema = z
  .object({
    successPath: z.string().optional(),
    cancelPath: z.string().optional()
  })
  .optional();

export const POST = withTenantRoute(
  async ({ tenant, params, req }) => {
    if (!params?.eventId || !params.participantId) {
      throw new BadRequestError('Event and participant ids are required');
    }

    const payload = await req.json().catch(() => ({}));
    const input = requestSchema.parse(payload ?? {});

    const participant = await prisma.eventParticipant.findFirst({
      where: {
        id: params.participantId,
        tenantId: tenant.tenantId,
        eventId: params.eventId
      },
      include: {
        event: true
      }
    });

    if (!participant) {
      throw new NotFoundError('Participant not found');
    }

    if (participant.paymentStatus === PaymentStatus.PAID) {
      throw new ConflictError('Participant already paid');
    }

    const event = participant.event;
    if (!event) {
      throw new BadRequestError('Participant event is missing');
    }

    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.tenantId },
      select: { currency: true }
    });

    const currency = (tenantSettings?.currency ?? 'EUR').toLowerCase();

    let amount = participant.amountPaid;
    if (!amount) {
      const pricing = calculateEventPrice(event, participant.ticketCount);
      amount = pricing.total;
    }

    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      throw new BadRequestError('Invalid registration amount');
    }

    const stripe = getStripeClient();
    const publicUrl = getPublicUrl();
    const successUrl = input?.successPath ? `${publicUrl}${input.successPath}` : `${publicUrl}/payments/success`;
    const cancelUrl = input?.cancelPath ? `${publicUrl}${input.cancelPath}` : `${publicUrl}/payments/cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: participant.email,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        tenantId: tenant.tenantId,
        participantId: participant.id,
        eventId: participant.eventId
      },
      line_items: [
        {
          quantity: participant.ticketCount,
          price_data: {
            currency,
            product_data: {
              name: event.title,
              description: `Registration for ${event.title}`
            },
            unit_amount: Math.round((amountNumber / participant.ticketCount) * 100)
          }
        }
      ]
    });

    await prisma.eventParticipant.update({
      where: { id: participant.id },
      data: {
        stripeSessionId: session.id
      }
    });

    return NextResponse.json({ checkoutUrl: session.url }, { status: 201 });
  },
  { onError: 'Unable to start payment' }
);

