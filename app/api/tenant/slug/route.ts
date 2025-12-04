import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { getPrisma } from '@/lib/db';
import { getTenantPublicSlug } from '@/lib/tenant/urls';
import { withTenantRoute, ConflictError, NotFoundError } from '@/lib/tenants';

export const runtime = "nodejs";

const slugSchema = z.object({
  slug: z
    .string()
    .trim()
    .max(48, 'Slug must be 48 characters or fewer.')
    .regex(/^[a-z0-9-]*$/, 'Use lowercase letters, numbers, and hyphens only.')
    .refine((value) => value.length === 0 || value.length >= 3, 'Slug must be at least 3 characters.')
    .refine((value) => value.length === 0 || !value.startsWith('-'), 'Slug cannot start with a hyphen.')
    .refine((value) => value.length === 0 || !value.endsWith('-'), 'Slug cannot end with a hyphen.')
});

export const GET = withTenantRoute(
  async ({ tenant }) => {
    const prisma = getPrisma();
    const record = await prisma.tenant.findUnique({
      where: { id: tenant.tenantId },
      select: { id: true, slug: true }
    });

    if (!record) {
      throw new NotFoundError('Tenant not found');
    }

    return NextResponse.json({
      slug: record.slug,
      publicSlug: getTenantPublicSlug(record)
    });
  },
  { onError: 'Unable to load tenant slug' }
);

export const PATCH = withTenantRoute(
  async ({ tenant, req }) => {
    const prisma = getPrisma();
    const body = await req.json();
    const input = slugSchema.parse(body);
    const normalized = input.slug.trim();
    const nextSlug = normalized.length === 0 ? null : normalized;

    try {
      const updated = await prisma.tenant.update({
        where: { id: tenant.tenantId },
        data: { slug: nextSlug },
        select: { id: true, slug: true }
      });

      return NextResponse.json({
        slug: updated.slug,
        publicSlug: getTenantPublicSlug(updated)
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('Slug already in use. Choose a different one.');
      }
      throw error;
    }
  },
  { onError: 'Unable to update tenant slug' }
);

