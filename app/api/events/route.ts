import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getPrisma } from '@/lib/db';
import { withTenantRoute, BadRequestError } from '@/lib/tenants';
import { ensureEventBusinessRules } from '@/lib/events';
import { EVENT_VISIBILITY, EVENT_VISIBILITY_VALUES, type EventVisibility } from '@/lib/prisma/enums';

export const runtime = "nodejs";

const eventBaseSchema = z.object({
  title: z.string().min(2),
  description: z.string().max(5000).optional(),
  eventTypeId: z.string().cuid().optional(),
  date: z.string().datetime(),
  time: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
  priceSingle: z.number().nonnegative().optional(),
  priceGroup: z.number().nonnegative().optional(),
  earlyBirdPrice: z.number().nonnegative().optional(),
  earlyBirdDeadline: z.string().datetime().optional(),
  location: z.string().optional(),
  guideName: z.string().optional(),
  visibility: z.enum(EVENT_VISIBILITY_VALUES).optional()
});

const createEventSchema = eventBaseSchema.refine(
  (data) => data.priceSingle !== undefined || data.priceGroup !== undefined || data.earlyBirdPrice !== undefined,
  'At least one pricing option must be provided'
);

export const GET = withTenantRoute(
  async ({ tenant, req }) => {
    const prisma = getPrisma();
    const url = new URL(req.url);
    const visibilityParam = url.searchParams.get('visibility');
    const visibility = EVENT_VISIBILITY_VALUES.includes(visibilityParam as EventVisibility)
      ? (visibilityParam as EventVisibility)
      : null;

    const events = await prisma.event.findMany({
      where: {
        tenantId: tenant.tenantId,
        ...(visibility ? { visibility } : {})
      },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json({ events });
  },
  { onError: 'Unable to load events' }
);

export const POST = withTenantRoute(
  async ({ tenant, req }) => {
    const prisma = getPrisma();
    const data = await req.json();
    const input = createEventSchema.parse(data);

    const eventDate = new Date(input.date);
    const earlyBirdDeadline = input.earlyBirdDeadline ? new Date(input.earlyBirdDeadline) : null;

    ensureEventBusinessRules({
      date: eventDate,
      earlyBirdDeadline,
      priceGroup: input.priceGroup ?? null,
      maxParticipants: input.maxParticipants ?? null
    });

    if (input.eventTypeId) {
      const eventType = await prisma.eventType.findFirst({
        where: { id: input.eventTypeId, tenantId: tenant.tenantId },
        select: { id: true }
      });

      if (!eventType) {
        throw new BadRequestError('Invalid event type');
      }
    }

    const event = await prisma.event.create({
      data: {
        tenantId: tenant.tenantId,
        title: input.title,
        description: input.description,
        eventTypeId: input.eventTypeId,
        date: eventDate,
        time: input.time,
        maxParticipants: input.maxParticipants,
        priceSingle: input.priceSingle,
        priceGroup: input.priceGroup,
        earlyBirdPrice: input.earlyBirdPrice,
        earlyBirdDeadline,
        location: input.location,
        guideName: input.guideName,
        visibility: input.visibility ?? EVENT_VISIBILITY.DRAFT
      }
    });

    return NextResponse.json({ event }, { status: 201 });
  },
  { onError: 'Unable to create event' }
);


