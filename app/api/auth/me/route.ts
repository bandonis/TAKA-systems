import { NextResponse } from 'next/server';

import { clearSessionCookie, getSession } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

export const runtime = "nodejs";

export async function GET() {
  try {
    const prisma = getPrisma();
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { tenant: true }
    });

    if (!user) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      clearSessionCookie(response);
      return response;
    }

    return NextResponse.json({
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
  } catch (error) {
    console.error('Failed to fetch session user', error);
    return NextResponse.json({ error: 'Unable to load user' }, { status: 500 });
  }
}


