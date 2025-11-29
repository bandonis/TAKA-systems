import Link from 'next/link';
import { ArrowRight, CalendarPlus, DollarSign, Users, Wallet } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchTenantApi } from '@/lib/tenant/api';

type DashboardEvent = {
  id: string;
  title: string;
  date: string;
  visibility: 'DRAFT' | 'PUBLISHED';
};

type EventsResponse = {
  events: (DashboardEvent & { date: string })[];
};

type DashboardSummary = {
  currency: string;
  totalParticipantsLast30d: number;
  revenueAllTime: string;
  revenueAllTimeCents: number;
  upcomingEventsCount: number;
  pendingPaymentsCount: number;
};

async function getDashboardData() {
  const eventsPromise = fetchTenantApi<EventsResponse>('/api/events');

  let summary: DashboardSummary | null = null;
  try {
    summary = await fetchTenantApi<DashboardSummary>('/api/dashboard/summary');
  } catch {
    summary = null;
  }

  const { events } = await eventsPromise;

  return {
    events,
    summary
  };
}

export default async function AdminDashboardPage() {
  const { events, summary } = await getDashboardData();

  return (
    <section className="space-y-8 pb-20 lg:pb-0">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Tenant dashboard</p>
        <h1 className="text-3xl font-semibold tracking-tight">Control center</h1>
        <p className="text-muted-foreground">
          Monitor upcoming adventures, keep registrations flowing, and jump straight into action with a tap.
        </p>
      </div>

      <SummaryCards summary={summary} />

      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Quick actions</CardTitle>
          <CardDescription className="text-primary-foreground/80">Build momentum right away</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-2">
          <Button asChild variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-primary-foreground">
            <Link href="/events/new">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Create event
            </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-primary-foreground">
            <Link href="/events">
              <ArrowRight className="mr-2 h-4 w-4" />
              View events
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coming up next</CardTitle>
          <CardDescription>Your next adventures at a glance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {events.slice(0, 3).map((event) => (
            <div key={event.id} className="flex flex-col gap-2 rounded-lg border border-dashed border-border px-4 py-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-base font-semibold">{event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className="flex flex-1 items-center justify-end gap-2">
                <Button variant="outline" asChild size="sm">
                  <Link href={`/events/${event.id}/edit`}>Edit</Link>
                </Button>
                <Button variant="ghost" asChild size="sm">
                  <Link href={`/events`}>View</Link>
                </Button>
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="text-sm text-muted-foreground">No events yet. Start by creating your first one.</p>}
        </CardContent>
      </Card>
    </section>
  );
}

function SummaryCards({ summary }: { summary: DashboardSummary | null }) {
  if (!summary) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Summary unavailable</CardTitle>
            <CardDescription>Unable to load summary right now. Please refresh.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const formatter = new Intl.NumberFormat('en', {
    style: 'currency',
    currency: summary.currency || 'EUR'
  });

  const cards = [
    {
      title: 'Total participants (30d)',
      value: summary.totalParticipantsLast30d.toLocaleString(),
      description: 'Registrations in the last 30 days',
      icon: <Users className="h-4 w-4 text-primary" />
    },
    {
      title: 'Revenue (all time)',
      value: formatter.format(summary.revenueAllTimeCents / 100),
      description: 'Completed payments',
      icon: <DollarSign className="h-4 w-4 text-primary" />
    },
    {
      title: 'Upcoming events',
      value: summary.upcomingEventsCount.toString(),
      description: 'Scheduled from today onward',
      icon: <CalendarPlus className="h-4 w-4 text-primary" />
    },
    {
      title: 'Pending payments',
      value: summary.pendingPaymentsCount.toString(),
      description: 'Awaiting completion',
      icon: <Wallet className="h-4 w-4 text-primary" />
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{card.value}</p>
            <CardDescription>{card.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
