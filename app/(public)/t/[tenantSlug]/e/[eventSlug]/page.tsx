import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getEventBySlug, getTenantBySlug, serializeEventForPublic } from '@/lib/events/public';

export const runtime = "nodejs";

type PublicEventPageProps = {
  params: Promise<{
    tenantSlug: string;
    eventSlug: string;
  }>;
};

export default async function PublicEventPage({ params }: PublicEventPageProps) {
  const { tenantSlug, eventSlug } = await params;

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    notFound();
  }

  const eventRecord = await getEventBySlug(tenant.id, eventSlug);
  if (!eventRecord) {
    notFound();
  }

  const event = serializeEventForPublic(eventRecord);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-4 py-12">
      <section className="space-y-3 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">{tenant.name}</p>
        <h1 className="text-4xl font-semibold tracking-tight">{event.title}</h1>
        <p className="text-muted-foreground">{formatEventDate(event.date, event.time)}</p>
        <p className="text-base text-muted-foreground">{event.location}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>About this experience</CardTitle>
          <CardDescription>Plan the adventure at a glance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{event.description || 'Details coming soon.'}</p>
          <ul className="space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Guide:</span> {event.guideName ?? 'Assigned soon'}
            </li>
            <li>
              <span className="font-medium text-foreground">Visibility:</span> {event.visibility}
            </li>
            {event.earlyBirdDeadline && event.earlyBirdPrice !== null ? (
              <li>
                <span className="font-medium text-foreground">Early bird:</span>{' '}
                {formatPrice(event.earlyBirdPrice)} until {formatDateOnly(event.earlyBirdDeadline)}
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing overview</CardTitle>
          <CardDescription>Choose the option that matches your group.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <PricePill label="Single ticket" value={event.priceSingle} />
          <PricePill label="Group (2+)" value={event.priceGroup} />
          <PricePill label="Early bird" value={event.earlyBirdPrice} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reserve your spot</CardTitle>
          <CardDescription>No payment required yet. We’ll email you the next steps.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={logPlaceholderRegistration} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name" requiredIndicator>
                Full name
              </Label>
              <Input id="name" name="name" required placeholder="Kalvis Ozols" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" requiredIndicator>
                Email
              </Label>
              <Input id="email" name="email" type="email" required placeholder="kalvis@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+371 20 000 000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ticketCount" requiredIndicator>
                Ticket count
              </Label>
              <Input id="ticketCount" name="ticketCount" type="number" min={1} defaultValue={1} required />
            </div>
            <input type="hidden" name="tenantId" value={event.tenantId} />
            <input type="hidden" name="eventId" value={event.id} />
            <Button type="submit">Notify me when registration opens</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

async function logPlaceholderRegistration(formData: FormData) {
  'use server';
  const payload = Object.fromEntries(formData.entries());
  console.log('Public registration placeholder submission', payload);
}

type PricePillProps = {
  label: string;
  value: number | null;
};

function PricePill({ label, value }: PricePillProps) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-4 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value !== null ? formatPrice(value) : '—'}</p>
    </div>
  );
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatEventDate(date: Date, time: string | null) {
  const dateText = formatDateOnly(date);
  if (!time) return dateText;
  return `${dateText} · ${time}`;
}

function formatDateOnly(date: Date) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date));
}

