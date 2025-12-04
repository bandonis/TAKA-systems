import { NextResponse } from 'next/server';

import { getPrisma } from '@/lib/db';
import { withTenantRoute, NotFoundError } from '@/lib/tenants';

export const runtime = "nodejs";

type RouteParams = {
  landingId: string;
};

export const DELETE = withTenantRoute<RouteParams>(
  async ({ tenant, params }) => {
    const { landingId } = params ?? {};

    if (!landingId) {
      throw new NotFoundError('Landing not found');
    }

    const prisma = getPrisma();

    const landing = await prisma.landingPage.findFirst({
      where: { id: landingId, tenantId: tenant.tenantId },
      select: { id: true }
    });

    if (!landing) {
      throw new NotFoundError('Landing not found');
    }

    await prisma.landingPage.delete({
      where: { id: landing.id }
    });

    return new NextResponse(null, { status: 204 });
  },
  { onError: 'Unable to delete landing' }
);


