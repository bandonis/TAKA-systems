import { NextResponse } from 'next/server';
import { z } from 'zod';

import { verifyPassword, createSessionToken, attachSessionCookie } from '@/lib/auth';
import { getPrisma } from '@/lib/db';
import { TENANT_STATUS } from '@/lib/prisma/enums';

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(req: Request) {
  try {
    const prisma = getPrisma();
    const body = await req.json();
    const input = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { tenant: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValidPassword = await verifyPassword(user.passwordHash, input.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.tenant && user.tenant.status === TENANT_STATUS.SUSPENDED) {
      return NextResponse.json({ error: 'Tenant is suspended' }, { status: 403 });
    }

    const token = await createSessionToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      tenant: user.tenant
        ? {
            id: user.tenant.id,
            name: user.tenant.name,
            status: user.tenant.status
          }
        : null
    });

    attachSessionCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }

    console.error('Login failed', error);
    return NextResponse.json({ error: 'Unable to login' }, { status: 500 });
  }
}


