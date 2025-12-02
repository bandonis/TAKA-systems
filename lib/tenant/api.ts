import { headers } from 'next/headers';

export async function fetchTenantApi<T>(path: string, init?: RequestInit) {
  const headerStore = await headers();
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http';
  const host = headerStore.get('host');
  const base = process.env.PUBLIC_URL ?? (host ? `${protocol}://${host}` : undefined);
  const targetUrl =
    path.startsWith('http://') || path.startsWith('https://')
      ? path
      : new URL(path, base ?? 'http://localhost:3000').toString();

  const res = await fetch(targetUrl, {
    ...init,
    headers: {
      cookie: headerStore.get('cookie') ?? '',
      ...(init?.headers || {})
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status}`);
  }

  return (await res.json()) as T;
}


