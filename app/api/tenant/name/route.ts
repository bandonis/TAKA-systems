import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/auth/cookies';
import { getPrisma } from '@/lib/db';

export const runtime = "nodejs";

const nameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Team name must be at least 2 characters.')
    .max(120, 'Team name must be 120 characters or fewer.')
});

function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function tenantNotFoundResponse() {
  return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
}

export async function GET() {
  const session = await getSession();
  if (!session?.tenantId) {
    return unauthorizedResponse();
  }

  const prisma = getPrisma();
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { name: true }
  });

  if (!tenant) {
    return tenantNotFoundResponse();
  }

  return NextResponse.json({ name: tenant.name });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.tenantId) {
    return unauthorizedResponse();
  }

  let input: z.infer<typeof nameSchema>;
  try {
    const data = await req.json();
    input = nameSchema.parse(data);
  } catch (error) {
    const message = error instanceof z.ZodError ? error.errors[0]?.message ?? 'Invalid input.' : 'Invalid input.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const prisma = getPrisma();
  const updated = await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { name: input.name },
    select: { name: true }
  });

  return NextResponse.json({ name: updated.name });
}


