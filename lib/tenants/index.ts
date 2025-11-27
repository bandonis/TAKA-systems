import { NextResponse } from 'next/server';
import type { UserRole } from '@prisma/client';
import { z } from 'zod';

import { getSessionFromHeaders } from '@/lib/auth/session';

export class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not found') {
    super(message, 404);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

export type RequestContext = {
  userId: string;
  role: UserRole;
  tenantId?: string | null;
};

export type TenantRequestContext = {
  userId: string;
  role: UserRole;
  tenantId: string;
};

export async function getRequestContext(req: Request): Promise<RequestContext | null> {
  const session = await getSessionFromHeaders(req.headers);

  if (!session) {
    return null;
  }

  return {
    userId: session.userId,
    role: session.role,
    tenantId: session.tenantId ?? null
  };
}

export async function requireTenantContext(req: Request): Promise<TenantRequestContext> {
  const context = await getRequestContext(req);

  if (!context) {
    throw new UnauthorizedError('Unauthorized');
  }

  if (!context.tenantId) {
    throw new ForbiddenError('Tenant context required');
  }

  return {
    userId: context.userId,
    role: context.role,
    tenantId: context.tenantId
  };
}

type RouteContext<P> = {
  params?: P;
};

type TenantRouteHandler<P> = (args: { req: Request; tenant: TenantRequestContext; params?: P }) => Promise<Response>;

export function withTenantRoute<P = Record<string, string>>(
  handler: TenantRouteHandler<P>,
  options?: { onError?: string }
) {
  return async (req: Request, routeContext?: RouteContext<P>) => {
    try {
      const tenant = await requireTenantContext(req);
      return await handler({ req, tenant, params: routeContext?.params });
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }

      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.flatten() }, { status: 422 });
      }

      console.error(options?.onError ?? 'Unhandled tenant route error', error);
      return NextResponse.json({ error: options?.onError ?? 'Internal server error' }, { status: 500 });
    }
  };
}

