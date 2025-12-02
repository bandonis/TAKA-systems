import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { getPrisma } from '@/lib/db';
import { withTenantRoute } from '@/lib/tenants';

export const runtime = "nodejs";

export const GET = withTenantRoute(
  async ({ tenant }) => {
    const prisma = getPrisma();

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      totalParticipantsLast30d,
      monthlyRevenueAggregate,
      upcomingEventsCount,
      pendingPaymentsCount,
      tenantSettings,
      latestParticipants
    ] = await Promise.all([
        prisma.eventParticipant.count({
          where: {
            tenantId: tenant.tenantId,
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        prisma.receipt.aggregate({
          where: {
            tenantId: tenant.tenantId,
            type: 'B2C',
            issuedAt: {
              gte: startOfMonth,
              lt: startOfNextMonth
            },
            participant: {
              paymentStatus: 'PAID'
            }
          },
          _sum: {
            amount: true
          }
        }),
        prisma.event.count({
          where: {
            tenantId: tenant.tenantId,
            date: { gte: now }
          }
        }),
        prisma.eventParticipant.count({
          where: {
            tenantId: tenant.tenantId,
            paymentStatus: 'PENDING'
          }
        }),
        prisma.tenantSettings.findUnique({
          where: { tenantId: tenant.tenantId },
          select: { currency: true }
        }),
        prisma.eventParticipant.findMany({
          where: { tenantId: tenant.tenantId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            name: true,
            email: true,
            ticketCount: true,
            paymentStatus: true,
            createdAt: true,
            event: {
              select: { title: true }
            }
          }
        })
      ]);

    const revenueDecimal = monthlyRevenueAggregate._sum.amount ?? new Prisma.Decimal(0);
    const revenueThisMonthCents = Math.round(Number(revenueDecimal) * 100);
    const currency = (tenantSettings?.currency ?? 'EUR').toUpperCase();

    return NextResponse.json({
      currency,
      totalParticipantsLast30d,
      revenueThisMonthCents,
      upcomingEventsCount,
      pendingPaymentsCount,
      latestParticipants: latestParticipants.map((participant) => ({
        id: participant.id,
        name: participant.name,
        email: participant.email,
        eventName: participant.event?.title ?? 'Untitled event',
        ticketCount: participant.ticketCount,
        paymentStatus: participant.paymentStatus,
        createdAt: participant.createdAt
      }))
    });
  },
  { onError: 'Unable to load dashboard summary' }
);
