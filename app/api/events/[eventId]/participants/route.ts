import { NextResponse } from 'next/server';
import { z } from 'zod';

import { PaymentStatus, PaymentType, Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { calculateEventPrice } from '@/lib/events';
import { withTenantRoute, BadRequestError, NotFoundError, ConflictError } from '@/lib/tenants';

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  ticketCount: z.number().int().min(1).max(50).default(1),
  registeredFromLandingId: z.string().cuid().optional()
});

export const GET = withTenantRoute(
  async ({ tenant, params }) => {
    if (!params?.eventId) {
      throw new BadRequestError('Event id is required');
    }

    const event = await prisma.event.findFirst({
      where: { id: params.eventId, tenantId: tenant.tenantId },
      select: { id: true }
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const participants = await prisma.eventParticipant.findMany({
      where: { tenantId: tenant.tenantId, eventId: event.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ participants });
  },
  { onError: 'Unable to load participants' }
);

export const POST = withTenantRoute(
  async ({ tenant, params, req }) => {
    if (!params?.eventId) {
      throw new BadRequestError('Event id is required');
    }

    const input = registerSchema.parse(await req.json());

    let landingId: string | null = null;
    if (input.registeredFromLandingId) {
      const landing = await prisma.landingPage.findFirst({
        where: { id: input.registeredFromLandingId, tenantId: tenant.tenantId },
        select: { id: true }
      });

      if (!landing) {
        throw new BadRequestError('Invalid landing reference');
      }
      landingId = landing.id;
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const event = await tx.event.findFirst({
          where: { id: params.eventId, tenantId: tenant.tenantId }
        });

        if (!event) {
          throw new NotFoundError('Event not found');
        }

        const currentTickets = await tx.eventParticipant.aggregate({
          where: { tenantId: tenant.tenantId, eventId: event.id },
          _sum: { ticketCount: true }
        });

        const totalTickets = (currentTickets._sum.ticketCount ?? 0) + input.ticketCount;

        if (event.maxParticipants && totalTickets > event.maxParticipants) {
          throw new ConflictError('Event capacity exceeded');
        }

        const pricing = calculateEventPrice(event, input.ticketCount);

        const participant = await tx.eventParticipant.create({
          data: {
            tenantId: tenant.tenantId,
            eventId: event.id,
            name: input.name,
            email: input.email,
            phone: input.phone,
            ticketCount: input.ticketCount,
            amountPaid: pricing.total,
            paymentStatus: PaymentStatus.PENDING,
            paymentType: PaymentType.ONLINE,
            registeredFromLandingId: landingId
          }
        });

        return { participant, pricing };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return NextResponse.json(
      {
        participant: result.participant,
        pricing: {
          strategy: result.pricing.strategy,
          unitPrice: result.pricing.unitPrice,
          total: result.pricing.total
        }
      },
      { status: 201 }
    );
  },
  { onError: 'Unable to register participant' }
);


