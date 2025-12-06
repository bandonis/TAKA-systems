import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getPrisma } from '@/lib/db';
import { calculateEventPrice } from '@/lib/events';
import { getLandingContactContext } from '@/lib/contact/server';

const autosaveSchema = z.object({
  landingId: z.string().cuid(),
  eventId: z.string().cuid(),
  participantId: z.string().cuid().optional(),
  name: z.string().trim().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  ticketCount: z.number().int().min(1).max(500).optional(),
  message: z.string().max(1000).optional(),
  marketingConsent: z.boolean().optional()
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const prisma = getPrisma();
    const body = await req.json();
    const input = autosaveSchema.parse(body);

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
        title: true,
        earlyBirdDeadline: true,
        earlyBirdPrice: true,
        priceGroup: true,
        priceSingle: true
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const ticketCount = input.ticketCount ?? 1;
    const pricing = calculateEventPrice(event, ticketCount);
    const marketingConsent = input.marketingConsent ?? true;

    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: { currency: true }
    });
    const currency = tenantSettings?.currency ?? 'EUR';

    let participantId = input.participantId;

    if (participantId) {
      await prisma.eventParticipant.update({
        where: { id: participantId, tenantId },
        data: {
          eventId: event.id,
          name: input.name ?? '',
          email: input.email,
          phone: input.phone ?? null,
          ticketCount,
          priceAtTheMoment: pricing.total,
          marketingConsent,
          comment: input.message ?? null,
          registeredFromLandingId: context.landingId,
          registrationStatus: 'DRAFT'
        }
      });
    } else {
      const created = await prisma.eventParticipant.create({
        data: {
          tenantId,
          eventId: event.id,
          name: input.name ?? '',
          email: input.email,
          phone: input.phone ?? null,
          ticketCount,
          priceAtTheMoment: pricing.total,
          marketingConsent,
          comment: input.message ?? null,
          registrationStatus: 'DRAFT',
          registeredFromLandingId: context.landingId
        },
        select: { id: true }
      });
      participantId = created.id;
    }

    return NextResponse.json({
      participantId,
      ticketCount,
      price: pricing.total.toNumber(),
      currency
    });
  } catch (error) {
    console.error('B2C autosave failed', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return NextResponse.json({ error: 'Unable to autosave registration' }, { status: 500 });
  }
}
