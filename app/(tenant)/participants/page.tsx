import Link from 'next/link';

import type { Event, EventParticipant } from '@prisma/client';

import { fetchTenantApi } from '@/lib/tenant/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type EventsResponse = {
  events: (Pick<Event, 'id' | 'title' | 'date'> & { date: string })[];
};

type ParticipantsResponse = {
  participants: Pick<EventParticipant, 'id' | 'name' | 'email' | 'ticketCount' | 'paymentStatus'>[];
};

type ParticipantsPageProps = {
  searchParams: { eventId?: string };
};

function pickEvent(events: EventsResponse['events'], preferredId?: string) {
  if (preferredId) {
    return events.find((event) => event.id === preferredId) ?? null;
  }

  const upcoming = events
    .filter((event) => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (upcoming.length > 0) return upcoming[0];

  return events[0] ?? null;
}

export default async function ParticipantsPage({ searchParams }: ParticipantsPageProps) {
  const { events } = await fetchTenantApi<EventsResponse>('/api/events');
  const selectedEvent = pickEvent(events, searchParams.eventId);

  let participants: ParticipantsResponse['participants'] = [];
  if (selectedEvent) {
    const data = await fetchTenantApi<ParticipantsResponse>(`/api/events/${selectedEvent.id}/participants`);
    participants = data.participants;
  }

  return (
    <section className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Participants</p>
        <h1 className="text-3xl font-semibold tracking-tight">Manage registrations</h1>
        <p className="text-muted-foreground">
          Track who&apos;s confirmed and chase pending payments without leaving the dashboard.
        </p>
      </div>

      <div className="space-y-3">
        <span className="text-sm text-muted-foreground">Event</span>
        <div className="flex flex-wrap gap-2">
          {events.map((event) => (
            <Button key={event.id} asChild variant={selectedEvent?.id === event.id ? 'default' : 'outline'} size="sm">
              <Link href={`/participants?eventId=${event.id}`}>
                {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {event.title}
              </Link>
            </Button>
          ))}
          {events.length === 0 && <p className="text-sm text-muted-foreground">Create an event to start collecting participants.</p>}
        </div>
      </div>

      {selectedEvent ? (
        <Card>
          <CardHeader>
            <CardTitle>{selectedEvent.title}</CardTitle>
            <CardDescription>
              {new Date(selectedEvent.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
              {participants.length} participant{participants.length === 1 ? '' : 's'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {participants.map((participant) => (
              <div key={participant.id} className="flex flex-col gap-2 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold">{participant.name}</p>
                  <p className="text-sm text-muted-foreground">{participant.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={participant.paymentStatus === 'PAID' ? 'success' : 'warning'}>{participant.paymentStatus.toLowerCase()}</Badge>
                  <span className="text-sm text-muted-foreground">{participant.ticketCount} ticket(s)</span>
                </div>
              </div>
            ))}
            {participants.length === 0 && (
              <p className="text-sm text-muted-foreground">No participants yet. Share the registration link to get started.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}


