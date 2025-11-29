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

type SummaryResponse = {
  totalParticipants: number;
  totalRevenue: number;
  upcomingEventsCount: number;
  pendingPaymentsCount: number;
};

async function getDashboardData() {
  const [eventsResponse, summary] = await Promise.all([
    fetchTenantApi<EventsResponse>('/api/events'),
    fetchTenantApi<SummaryResponse>('/api/dashboard/summary')
  ]);

  return {
    events: eventsResponse.events,
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total participants (30d)"
          value={summary.totalParticipants.toLocaleString()}
          description="Registrations in the last 30 days"
          icon={<Users className="h-4 w-4 text-primary" />}
        />
        <MetricCard
          title="Revenue (all time)"
          value={Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(summary.totalRevenue)}
          description="Receipts marked as paid"
          icon={<DollarSign className="h-4 w-4 text-primary" />}
        />
        <MetricCard
          title="Upcoming events"
          value={summary.upcomingEventsCount.toString()}
          description="Scheduled from today onward"
          icon={<CalendarPlus className="h-4 w-4 text-primary" />}
        />
        <MetricCard
          title="Pending payments"
          value={summary.pendingPaymentsCount.toString()}
          description="Participants awaiting payment"
          icon={<Wallet className="h-4 w-4 text-primary" />}
        />
      </div>

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

function MetricCard({
  title,
  value,
  description,
  icon
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
