import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { TenantNavLinks } from '@/components/tenant/nav-links';

export default async function TenantLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session || !session.tenantId) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col lg:flex-row">
        <aside className="hidden w-64 flex-col border-r border-border bg-background/80 p-6 lg:flex">
          <Link href="/dashboard" className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">TA</div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">TAKA</p>
              <p className="text-xs text-muted-foreground">Tenant cockpit</p>
            </div>
          </Link>
          <TenantNavLinks />
          <div className="mt-auto rounded-lg border border-dashed border-muted-foreground/40 p-4 text-xs text-muted-foreground">
            Signed in as
            <br />
            <span className="font-medium text-foreground">{session.userId.slice(0, 8)}…</span>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Tenant area</p>
                <h1 className="text-lg font-semibold leading-tight text-foreground">Welcome back</h1>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
                <span className="hidden sm:inline">Role</span>
                <span className="font-medium text-foreground">{session.role.toLowerCase()}</span>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 p-2 shadow-2xl lg:hidden">
        <TenantNavLinks orientation="horizontal" />
      </div>
    </div>
  );
}


