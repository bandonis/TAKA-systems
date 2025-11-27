import { headers } from 'next/headers';

const baseUrl = process.env.PUBLIC_URL ?? 'http://localhost:3000';

export async function fetchTenantApi<T>(path: string, init?: RequestInit) {
  const headerStore = await headers();
  const res = await fetch(`${baseUrl}${path}`, {
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


