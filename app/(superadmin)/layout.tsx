import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth/cookies';

export const runtime = "nodejs";

export default async function SuperadminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session || session.role !== 'SUPERADMIN') {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/60 px-6 py-4 backdrop-blur">
        <p className="text-sm font-medium text-muted-foreground">TAKA Superadmin</p>
      </header>
      <main className="flex-1 px-6 py-10">{children}</main>
    </div>
  );
}


