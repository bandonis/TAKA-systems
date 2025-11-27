import { notFound } from 'next/navigation';

import { EventForm } from '@/app/(tenant)/events/_components/event-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchTenantApi } from '@/lib/tenant/api';

type EventsResponse = {
  events: {
    id: string;
    title: string;
    description?: string | null;
    date: string;
    time?: string | null;
    maxParticipants?: number | null;
    priceSingle?: number | null;
    priceGroup?: number | null;
    earlyBirdPrice?: number | null;
    earlyBirdDeadline?: string | null;
    visibility: 'DRAFT' | 'PUBLISHED';
    location?: string | null;
    guideName?: string | null;
  }[];
};

async function getEvent(eventId: string) {
  const data = await fetchTenantApi<EventsResponse>('/api/events');
  const event = data.events.find((item) => item.id === eventId);
  if (!event) {
    notFound();
  }
  return event;
}

export default async function Page({ params }: { params: { eventId: string } }) {
  const { eventId } = params;
  const event = await getEvent(eventId);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Edit event</p>
        <h1 className="text-3xl font-semibold tracking-tight">{event.title}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            mode="edit"
            initialData={{
              id: event.id,
              title: event.title,
              description: event.description,
              date: event.date,
              time: event.time,
              maxParticipants: event.maxParticipants ?? undefined,
              priceSingle: event.priceSingle ?? undefined,
              priceGroup: event.priceGroup ?? undefined,
              earlyBirdPrice: event.earlyBirdPrice ?? undefined,
              earlyBirdDeadline: event.earlyBirdDeadline ?? undefined,
              visibility: event.visibility,
              location: event.location ?? undefined,
              guideName: event.guideName ?? undefined
            }}
          />
        </CardContent>
      </Card>
    </section>
  );
}


