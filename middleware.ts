import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session';

const PUBLIC_PATHS = [
  '/',
  '/api/auth/login',
  '/api/auth/register-tenant',
  '/favicon.ico',
  '/robots.txt'
];

const TENANT_PATH_PREFIXES = ['/dashboard', '/landing-builder'];
const SUPERADMIN_PATH_PREFIXES = ['/superadmin'];

function isProtected(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const requiresTenantAccess = isProtected(pathname, TENANT_PATH_PREFIXES);
  const requiresSuperadminAccess = isProtected(pathname, SUPERADMIN_PATH_PREFIXES);

  if (!session && !PUBLIC_PATHS.includes(pathname) && (requiresTenantAccess || requiresSuperadminAccess)) {
    const loginUrl = new URL('/', req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (requiresTenantAccess && session && !session.tenantId) {
    return NextResponse.redirect(new URL('/superadmin', req.url));
  }

  if (requiresSuperadminAccess && (!session || session.role !== 'SUPERADMIN')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};


