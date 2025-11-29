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

    const [totalParticipantsLast30d, revenueAggregate, upcomingEventsCount, pendingPaymentsCount, tenantSettings] =
      await Promise.all([
        prisma.eventParticipant.count({
          where: {
            tenantId: tenant.tenantId,
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        prisma.receipt.aggregate({
          where: {
            tenantId: tenant.tenantId
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
        })
      ]);

    const revenueDecimal = revenueAggregate._sum.amount ?? new Prisma.Decimal(0);
    const revenueNumber = Number(revenueDecimal);
    const revenueAllTimeCents = Math.round(revenueNumber * 100);

    return NextResponse.json({
      currency: (tenantSettings?.currency ?? 'EUR').toUpperCase(),
      totalParticipantsLast30d,
      revenueAllTime: revenueDecimal.toString(),
      revenueAllTimeCents,
      upcomingEventsCount,
      pendingPaymentsCount
    });
  },
  { onError: 'Unable to load dashboard summary' }
);
