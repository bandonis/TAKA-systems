import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getPrisma } from '@/lib/db';
import { withTenantRoute, NotFoundError } from '@/lib/tenants';

export const runtime = "nodejs";

const schema = z.object({
  paymentMode: z.enum(['STRIPE', 'MANUAL'])
});

export const GET = withTenantRoute(async ({ tenant }) => {
  const prisma = getPrisma();
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId: tenant.tenantId },
    select: { paymentMode: true }
  });

  if (!settings) {
    throw new NotFoundError('Tenant settings not found');
  }

  return NextResponse.json({ paymentMode: settings.paymentMode });
}, { onError: 'Unable to load payment mode' });

export const PATCH = withTenantRoute(async ({ tenant, req }) => {
  const prisma = getPrisma();
  const body = await req.json();
  const input = schema.parse(body);

  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId: tenant.tenantId },
    select: { paymentMode: true }
  });

  if (!settings) {
    throw new NotFoundError('Tenant settings not found');
  }

  const updated = await prisma.tenantSettings.update({
    where: { tenantId: tenant.tenantId },
    data: { paymentMode: input.paymentMode },
    select: { paymentMode: true }
  });

  return NextResponse.json({ paymentMode: updated.paymentMode });
}, { onError: 'Unable to update payment mode' });

