import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getPrisma } from '@/lib/db';
import { withTenantRoute, NotFoundError } from '@/lib/tenants';

export const runtime = "nodejs";

const nameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Team name must be at least 2 characters.')
    .max(120, 'Team name must be 120 characters or fewer.')
});

export const GET = withTenantRoute(
  async ({ tenant }) => {
    const prisma = getPrisma();
    const record = await prisma.tenant.findUnique({
      where: { id: tenant.tenantId },
      select: { name: true }
    });

    if (!record) {
      throw new NotFoundError('Tenant not found');
    }

    return NextResponse.json({ name: record.name });
  },
  { onError: 'Unable to load tenant name' }
);

export const PATCH = withTenantRoute(
  async ({ tenant, req }) => {
    const prisma = getPrisma();
    const data = await req.json();
    const input = nameSchema.parse(data);

    const updated = await prisma.tenant.update({
      where: { id: tenant.tenantId },
      data: { name: input.name },
      select: { name: true }
    });

    return NextResponse.json({ name: updated.name });
  },
  { onError: 'Unable to update tenant name' }
);


