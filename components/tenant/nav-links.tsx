"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Gauge, LayoutTemplate, Settings2, Users } from 'lucide-react';

import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/landings', label: 'Landing pages', icon: LayoutTemplate },
  { href: '/participants', label: 'Participants', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings2 }
];

type NavListProps = {
  orientation?: 'vertical' | 'horizontal';
};

export function TenantNavLinks({ orientation = 'vertical' }: NavListProps) {
  const pathname = usePathname();

  return (
    <nav className={cn('flex', orientation === 'vertical' ? 'flex-col space-y-2' : 'flex-row items-center justify-between gap-2')}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              orientation === 'horizontal' && 'justify-center',
              isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}







