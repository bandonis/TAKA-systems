import Link from 'next/link';
import { CalendarClock, Edit, Eye, PlusCircle } from 'lucide-react';

import type { Event } from '@prisma/client';

import { fetchTenantApi } from '@/lib/tenant/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type EventsResponse = {
  events: (Pick<Event, 'id' | 'title' | 'date' | 'visibility' | 'location'> & { date: string })[];
};

const visibilityMap: Record<string, { label: string; variant: 'success' | 'warning' | 'outline' }> = {
  PUBLISHED: { label: 'Published', variant: 'success' },
  DRAFT: { label: 'Draft', variant: 'outline' }
};

export default async function EventsPage() {
  const { events } = await fetchTenantApi<EventsResponse>('/api/events');

  return (
    <section className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Events</p>
          <h1 className="text-3xl font-semibold tracking-tight">Plan, publish, repeat</h1>
        </div>
        <Button asChild>
          <Link href="/events/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create event
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {events.map((event) => {
          const visibility = visibilityMap[event.visibility] ?? visibilityMap.DRAFT;

          return (
            <Card key={event.id} className="border border-border">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    {new Date(event.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    })}
                    {event.location ? <>· {event.location}</> : null}
                  </CardDescription>
                </div>
                <Badge variant={visibility.variant}>{visibility.label}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Edit pricing, manage participants, and publish when you’re ready.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" asChild size="sm">
                    <Link href={`/events/${event.id}/edit`}>
                      <Edit className="mr-1.5 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild size="sm">
                    <Link href={`/participants?eventId=${event.id}`}>
                      <Eye className="mr-1.5 h-4 w-4" />
                      View participants
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {events.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No events yet</CardTitle>
              <CardDescription>Start by creating your first adventure.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/events/new">Create event</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}


