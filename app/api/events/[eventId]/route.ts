import { NextResponse } from 'next/server';
import { z } from 'zod';

import { EventVisibility } from '@prisma/client';

import { prisma } from '@/lib/db';
import { withTenantRoute, BadRequestError, NotFoundError } from '@/lib/tenants';
import { ensureEventBusinessRules } from '@/lib/events';

const updateEventSchema = z
  .object({
    title: z.string().min(2).optional(),
    description: z.string().max(5000).optional(),
    eventTypeId: z.string().cuid().optional(),
    date: z.string().datetime().optional(),
    time: z.string().optional(),
    maxParticipants: z.number().int().positive().optional(),
    priceSingle: z.number().nonnegative().optional(),
    priceGroup: z.number().nonnegative().optional(),
    earlyBirdPrice: z.number().nonnegative().optional(),
    earlyBirdDeadline: z.string().datetime().optional(),
    location: z.string().optional(),
    guideName: z.string().optional(),
    visibility: z.nativeEnum(EventVisibility).optional()
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'Provide at least one field to update'
  );

export const PATCH = withTenantRoute(
  async ({ tenant, params, req }) => {
    if (!params?.eventId) {
      throw new BadRequestError('Event id is required');
    }

    const input = updateEventSchema.parse(await req.json());

    const event = await prisma.event.findFirst({
      where: { id: params.eventId, tenantId: tenant.tenantId }
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (input.eventTypeId) {
      const eventType = await prisma.eventType.findFirst({
        where: { id: input.eventTypeId, tenantId: tenant.tenantId },
        select: { id: true }
      });

      if (!eventType) {
        throw new BadRequestError('Invalid event type');
      }
    }

    const nextDate = input.date ? new Date(input.date) : event.date;
    const nextEarlyBirdDeadline = input.earlyBirdDeadline ? new Date(input.earlyBirdDeadline) : event.earlyBirdDeadline;
    const nextMaxParticipants = input.maxParticipants ?? event.maxParticipants ?? null;
    const nextPriceGroup =
      input.priceGroup !== undefined ? input.priceGroup : event.priceGroup ? Number(event.priceGroup) : null;

    ensureEventBusinessRules({
      date: nextDate,
      earlyBirdDeadline: nextEarlyBirdDeadline,
      priceGroup: nextPriceGroup,
      maxParticipants: nextMaxParticipants
    });

    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        title: input.title ?? event.title,
        description: input.description ?? event.description,
        eventTypeId: input.eventTypeId ?? event.eventTypeId,
        date: nextDate,
        time: input.time ?? event.time,
        maxParticipants: nextMaxParticipants ?? null,
        priceSingle: input.priceSingle ?? event.priceSingle,
        priceGroup: input.priceGroup ?? event.priceGroup,
        earlyBirdPrice: input.earlyBirdPrice ?? event.earlyBirdPrice,
        earlyBirdDeadline: nextEarlyBirdDeadline,
        location: input.location ?? event.location,
        guideName: input.guideName ?? event.guideName,
        visibility: input.visibility ?? event.visibility
      }
    });

    return NextResponse.json({ event: updated });
  },
  { onError: 'Unable to update event' }
);


