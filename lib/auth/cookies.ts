import { cookies } from 'next/headers';

import { SESSION_COOKIE, SESSION_DURATION, verifySessionToken } from './session';

export async function getSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export function attachSessionCookie(response: Response, token: string) {
  response.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_DURATION}; HttpOnly; Secure; SameSite=Lax`
  );
}

export function clearSessionCookie(response: Response) {
  response.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
  );
}


