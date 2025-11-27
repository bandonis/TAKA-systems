import type { NextRequest } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

import type { UserRole } from '@/lib/prisma/enums';

export const SESSION_COOKIE = 'taka_session';
export const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  userId: string;
  tenantId?: string | null;
  role: UserRole;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured');
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getAuthSecret());
    return payload;
  } catch {
    return null;
  }
}

function extractSessionToken(cookieHeader: string | null) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';');
  for (const rawCookie of cookies) {
    const [name, ...rest] = rawCookie.trim().split('=');
    if (name === SESSION_COOKIE) {
      return rest.join('=');
    }
  }
  return null;
}

export async function getSessionFromHeaders(headers: Headers) {
  const token = extractSessionToken(headers.get('cookie'));
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}


