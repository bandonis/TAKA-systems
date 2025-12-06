import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getPrisma } from '@/lib/db';
import { calculateEventPrice } from '@/lib/events';
import { getLandingContactContext } from '@/lib/contact/server';
import { createCheckoutSessionForParticipant } from '@/lib/payments';
import { syncParticipantRegistrationDefaults } from '@/lib/tenant-settings/participant-defaults';
import { recordMarketingConsent } from '@/lib/contact/consent';

const submitSchema = z.object({
  landingId: z.string().cuid(),
  participantId: z.string().cuid(),
  eventId: z.string().cuid(),
  tenantSlug: z.string().min(1),
  landingSlug: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  ticketCount: z.number().int().min(1).max(500),
  message: z.string().max(1000).optional(),
  marketingConsent: z.boolean().optional()
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const prisma = getPrisma();
    const body = await req.json();
    const input = submitSchema.parse(body);

    const context = await getLandingContactContext(prisma, input.landingId);
    if (!context) {
      return NextResponse.json({ error: 'Landing contact form not found' }, { status: 404 });
    }

    const { tenantId, config } = context;

    if (config.mode !== 'b2c') {
      return NextResponse.json({ error: 'Contact form is not in B2C mode' }, { status: 400 });
    }

    if (!config.allowedEventIds.includes(input.eventId)) {
      return NextResponse.json({ error: 'Event is not allowed for this landing' }, { status: 400 });
    }

    const event = await prisma.event.findFirst({
      where: { id: input.eventId, tenantId },
      select: {
        id: true,
        tenantId: true,
        earlyBirdDeadline: true,
        earlyBirdPrice: true,
        priceGroup: true,
        priceSingle: true
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const participant = await prisma.eventParticipant.findFirst({
      where: { id: input.participantId, tenantId },
      select: {
        id: true,
        stripeSessionId: true,
        registrationStatus: true
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const ticketCount = input.ticketCount;
    const pricing = calculateEventPrice(event, ticketCount);
    const marketingConsent = input.marketingConsent ?? true;

    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: { currency: true, paymentMode: true }
    });

    const currency = tenantSettings?.currency ?? 'EUR';
    const paymentMode = tenantSettings?.paymentMode ?? 'STRIPE';

    await prisma.eventParticipant.update({
      where: { id: participant.id },
      data: {
        eventId: event.id,
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        ticketCount,
        priceAtTheMoment: pricing.total,
        marketingConsent,
        hasConsent: marketingConsent,
        comment: input.message ?? null,
        registeredFromLandingId: context.landingId,
        registrationStatus: paymentMode === 'STRIPE' ? 'PENDING_PAYMENT' : 'SUBMITTED'
      }
    });

    await syncParticipantRegistrationDefaults({
      prisma,
      tenantId,
      name: input.name,
      email: input.email
    });

    if (marketingConsent) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
      const userAgent = req.headers.get('user-agent') ?? null;
      await recordMarketingConsent({
        prisma,
        tenantId,
        email: input.email,
        eventId: event.id,
        landingId: context.landingId,
        ip,
        userAgent
      });
    }

  if (paymentMode === 'MANUAL') {
    return NextResponse.json({ status: 'submitted' });
  }

  const successPath = `/t/${input.tenantSlug}/e/${event.id}/checkout/success`;
  const cancelPath = `/t/${input.tenantSlug}/e/${event.id}/checkout/cancel`;

  const participantForCheckout = await prisma.eventParticipant.findFirst({
    where: { id: participant.id, tenantId },
    select: {
      id: true,
      tenantId: true,
      eventId: true,
      email: true,
      ticketCount: true,
      amountPaid: true,
      event: {
        select: {
          title: true,
          earlyBirdDeadline: true,
          earlyBirdPrice: true,
          priceGroup: true,
          priceSingle: true
        }
      }
    }
  });

  if (!participantForCheckout || !participantForCheckout.event) {
    return NextResponse.json({ error: 'Unable to start checkout for this participant' }, { status: 400 });
  }

  const session = await createCheckoutSessionForParticipant({
    tenantId,
    participant: participantForCheckout,
    currency,
    successPath,
    cancelPath
  });

  await prisma.eventParticipant.update({
    where: { id: participant.id },
    data: {
      stripeSessionId: session.id
    }
  });

  return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('B2C submit failed', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return NextResponse.json({ error: 'Unable to submit contact form' }, { status: 500 });
  }
}
