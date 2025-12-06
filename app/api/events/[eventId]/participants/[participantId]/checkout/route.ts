import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getPrisma } from '@/lib/db';
import { withTenantRoute, BadRequestError, ConflictError, NotFoundError } from '@/lib/tenants';
import { createCheckoutSessionForParticipant } from '@/lib/payments';
import { PAYMENT_STATUS } from '@/lib/prisma/enums';
import { normalizeParam } from '@/lib/utils/params';

export const runtime = "nodejs";

const requestSchema = z
  .object({
    successPath: z.string().optional(),
    cancelPath: z.string().optional()
  })
  .optional();

export const POST = withTenantRoute(
  async ({ tenant, params, req }) => {
    const prisma = getPrisma();
    const eventId = normalizeParam(params?.eventId);
    const participantId = normalizeParam(params?.participantId);

    if (!eventId || !participantId) {
      throw new BadRequestError('Event and participant ids are required');
    }

    const payload = await req.json().catch(() => ({}));
    const input = requestSchema.parse(payload ?? {});

    const participant = await prisma.eventParticipant.findFirst({
      where: {
        id: participantId,
        tenantId: tenant.tenantId,
        eventId: eventId
      },
      include: {
        event: true
      }
    });

    if (!participant) {
      throw new NotFoundError('Participant not found');
    }

    if (participant.paymentStatus === PAYMENT_STATUS.PAID) {
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

    const currency = tenantSettings?.currency ?? 'EUR';

    if (participant.ticketCount == null || participant.ticketCount < 1) {
      throw new BadRequestError('Invalid ticket count for checkout');
    }

    const participantForCheckout = {
      id: participant.id,
      tenantId: participant.tenantId,
      eventId: participant.eventId,
      email: participant.email,
      ticketCount: participant.ticketCount,
      amountPaid: participant.amountPaid,
      event: {
        title: event.title,
        earlyBirdDeadline: event.earlyBirdDeadline,
        earlyBirdPrice: event.earlyBirdPrice,
        priceGroup: event.priceGroup,
        priceSingle: event.priceSingle
      }
    };

    const session = await createCheckoutSessionForParticipant({
      tenantId: tenant.tenantId,
      participant: participantForCheckout,
      currency,
      successPath: input?.successPath,
      cancelPath: input?.cancelPath
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

