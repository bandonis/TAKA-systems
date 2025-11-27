import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { Prisma } from '@prisma/client';

import { hashPassword, createSessionToken, attachSessionCookie } from '@/lib/auth';
import { getPrisma } from '@/lib/db';
import { TENANT_STATUS, USER_ROLES } from '@/lib/prisma/enums';

export const runtime = "nodejs";

const registerSchema = z.object({
  tenantName: z.string().min(2, 'Tenant name must be at least 2 characters long'),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  language: z.string().min(2).max(5).default('en'),
  primaryColor: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const prisma = getPrisma();
    const body = await req.json();
    const input = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: input.adminEmail }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(input.adminPassword);

    const { tenant, user } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createdTenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          language: input.language,
          primaryColor: input.primaryColor,
          status: TENANT_STATUS.ACTIVE
        }
      });

      await tx.tenantSettings.create({
        data: {
          tenantId: createdTenant.id,
          defaultLanguage: input.language,
          primaryBrandColor: input.primaryColor
        }
      });

      const createdUser = await tx.user.create({
        data: {
          email: input.adminEmail,
          passwordHash,
          role: USER_ROLES.ADMIN,
          tenantId: createdTenant.id
        }
      });

      return { tenant: createdTenant, user: createdUser };
    });

    const token = await createSessionToken({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role
    });

    const response = NextResponse.json(
      {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          status: tenant.status,
          language: tenant.language
        },
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      },
      { status: 201 }
    );

    attachSessionCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }

    console.error('Failed to register tenant', error);
    return NextResponse.json({ error: 'Unable to register tenant' }, { status: 500 });
  }
}


