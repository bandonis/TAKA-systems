import { NextResponse } from 'next/server';

import { getPrisma } from '@/lib/db';
import { withTenantRoute } from '@/lib/tenants';

export const runtime = "nodejs";

export const GET = withTenantRoute(
  async ({ tenant }) => {
    const prisma = getPrisma();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalParticipants, totalRevenue, upcomingEventsCount, pendingPaymentsCount] = await Promise.all([
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
          date: { gte: new Date() }
        }
      }),
      prisma.eventParticipant.count({
        where: {
          tenantId: tenant.tenantId,
          paymentStatus: 'PENDING'
        }
      })
    ]);

    return NextResponse.json({
      totalParticipants,
      totalRevenue: totalRevenue._sum.amount ? Number(totalRevenue._sum.amount) : 0,
      upcomingEventsCount,
      pendingPaymentsCount
    });
  },
  { onError: 'Unable to load dashboard summary' }
);

