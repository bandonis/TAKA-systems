"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type HeaderNavProps = {
  tenantName: string;
  navItems: Array<{ label: string; href: string }>;
  ctaHref: string;
  homeHref?: string;
};

export function HeaderNav({ tenantName, navItems, ctaHref, homeHref = '#hero' }: HeaderNavProps) {
  const [open, setOpen] = useState(false);
  const items = navItems.length ? navItems : [{ label: 'Contact', href: ctaHref }];

  const handleNavigate = () => {
    setOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-20 bg-gradient-to-b from-slate-950/90 via-slate-950/70 to-transparent backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-white sm:px-6 lg:px-8">
        <Link href={homeHref} className="text-lg font-semibold tracking-tight" onClick={handleNavigate}>
          {tenantName}
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-white/80 md:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-white"
              onClick={handleNavigate}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" className="hidden rounded-full bg-white text-slate-900 hover:bg-white/90 md:inline-flex">
            <Link href={ctaHref} onClick={handleNavigate}>
              Book a hike
            </Link>
          </Button>
          <button
            type="button"
            className="inline-flex rounded-full border border-white/20 p-2 text-white hover:border-white md:hidden"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div
        className={cn(
          'md:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <div className="mx-4 mb-4 rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-xl">
          <nav className="flex flex-col gap-3 text-base font-medium text-white">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavigate}
                className="rounded-2xl px-3 py-2 hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
            <Button
              asChild
              className="w-full rounded-2xl bg-white text-slate-900 hover:bg-white/90"
              onClick={handleNavigate}
            >
              <Link href={ctaHref}>Book a hike</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}

