import Link from 'next/link';

import { fetchTenantApi } from '@/lib/tenant/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PaymentStatus } from '@/lib/prisma/enums';

type EventOption = {
  id: string;
  title: string;
  date: string;
};

type EventsResponse = {
  events: EventOption[];
};

type ParticipantsResponse = {
  participants: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    ticketCount: number;
    paymentStatus: PaymentStatus;
    createdAt: string;
    amountPaid: string | null;
    eventId: string | null;
  }[];
};

type ParticipantsPageProps = {
  searchParams?: Promise<{ eventId?: string }>;
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
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { events } = await fetchTenantApi<EventsResponse>('/api/events');
  const selectedEvent = pickEvent(events, resolvedSearchParams.eventId);

  let participants: ParticipantsResponse['participants'] = [];
  if (selectedEvent) {
    const data = await fetchTenantApi<ParticipantsResponse>(`/api/events/${selectedEvent.id}/participants`);
    participants = data.participants;
  }

  const currencyFormatter = new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'EUR'
  });

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
            {participants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-muted-foreground">
                      <th className="pb-2 font-medium">Participant</th>
                      <th className="pb-2 font-medium">Email</th>
                      <th className="pb-2 font-medium">Phone</th>
                      <th className="pb-2 font-medium">Ticket count</th>
                      <th className="pb-2 font-medium">Payment status</th>
                      <th className="pb-2 font-medium">Registration date</th>
                      <th className="pb-2 font-medium">Amount paid</th>
                      <th className="pb-2 font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {participants.map((participant) => {
                      const participantType = participant.eventId ? 'B2C' : 'B2B lead';
                      const amountValue = participant.amountPaid ? Number(participant.amountPaid) : null;
                      return (
                        <tr key={participant.id} className="align-top">
                          <td className="py-3">
                            <p className="font-medium text-foreground">{participant.name}</p>
                            <p className="text-xs text-muted-foreground">#{participant.id.slice(-6)}</p>
                          </td>
                          <td className="py-3">{participant.email}</td>
                          <td className="py-3">{participant.phone ?? '—'}</td>
                          <td className="py-3">{participant.ticketCount}</td>
                          <td className="py-3">
                            <Badge variant={participant.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                              {participant.paymentStatus.toLowerCase()}
                            </Badge>
                          </td>
                          <td className="py-3">
                            {new Date(participant.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-3">
                            {amountValue !== null ? currencyFormatter.format(amountValue) : '—'}
                          </td>
                          <td className="py-3">
                            <Badge variant="secondary">{participantType}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No participants yet. Share the registration link to get started.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}


