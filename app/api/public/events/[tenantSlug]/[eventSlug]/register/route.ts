import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getPrisma } from '@/lib/db';
import { calculateEventPrice } from '@/lib/events';
import { getEventBySlug, getTenantBySlug } from '@/lib/events/public';
import { createCheckoutSessionForParticipant } from '@/lib/payments';
import { EVENT_VISIBILITY, PAYMENT_STATUS, PAYMENT_TYPE } from '@/lib/prisma/enums';
import { syncParticipantRegistrationDefaults } from '@/lib/tenant-settings/participant-defaults';

export const runtime = "nodejs";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  ticketCount: z.number().int().min(1)
});

type RouteParams = {
  tenantSlug: string;
  eventSlug: string;
};

export async function POST(req: Request, context: { params: Promise<RouteParams> }) {
  try {
    const prisma = getPrisma();
    const params = await context.params;
    const tenant = await getTenantBySlug(params.tenantSlug);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const eventSummary = await getEventBySlug(tenant.id, params.eventSlug);
    if (!eventSummary || eventSummary.visibility !== EVENT_VISIBILITY.PUBLISHED) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const body = await req.json();
    const input = registerSchema.parse(body);

    const event = await prisma.event.findUnique({
      where: { id: eventSummary.id },
      select: {
        id: true,
        tenantId: true,
        title: true,
        date: true,
        earlyBirdDeadline: true,
        earlyBirdPrice: true,
        priceGroup: true,
        priceSingle: true,
        maxParticipants: true
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const currentTickets = await prisma.eventParticipant.aggregate({
      where: { tenantId: tenant.id, eventId: event.id },
      _sum: { ticketCount: true }
    });

    const totalTickets = (currentTickets._sum.ticketCount ?? 0) + input.ticketCount;
    if (event.maxParticipants && totalTickets > event.maxParticipants) {
      return NextResponse.json({ error: 'Event capacity exceeded' }, { status: 409 });
    }

    const pricing = calculateEventPrice(event, input.ticketCount);

    const participant = await prisma.eventParticipant.create({
      data: {
        tenantId: tenant.id,
        eventId: event.id,
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        ticketCount: input.ticketCount,
        amountPaid: pricing.total,
        paymentStatus: PAYMENT_STATUS.PENDING,
        paymentType: PAYMENT_TYPE.ONLINE
      },
      include: {
        event: true
      }
    });

    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { currency: true }
    });

    const successPath = `/t/${params.tenantSlug}/e/${params.eventSlug}/checkout/success`;
    const cancelPath = `/t/${params.tenantSlug}/e/${params.eventSlug}/checkout/cancel`;

    const session = await createCheckoutSessionForParticipant({
      tenantId: tenant.id,
      participant,
      currency: tenantSettings?.currency ?? 'EUR',
      successPath,
      cancelPath
    });

    await prisma.eventParticipant.update({
      where: { id: participant.id },
      data: {
        stripeSessionId: session.id
      }
    });

    await syncParticipantRegistrationDefaults({
      prisma,
      tenantId: tenant.id,
      name: input.name,
      email: input.email
    });

    return NextResponse.json({ checkoutUrl: session.url }, { status: 201 });
  } catch (error) {
    console.error('Public registration failed', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return NextResponse.json({ error: 'Unable to start registration' }, { status: 500 });
  }
}

