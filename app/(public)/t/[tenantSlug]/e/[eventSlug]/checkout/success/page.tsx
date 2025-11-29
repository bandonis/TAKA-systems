import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getEventBySlug, getTenantBySlug, serializeEventForPublic } from '@/lib/events/public';

type CheckoutSuccessPageProps = {
  params: Promise<{ tenantSlug: string; eventSlug: string }>;
  searchParams?: Promise<{ session_id?: string | string[] }>;
};

export default async function CheckoutSuccessPage({ params, searchParams }: CheckoutSuccessPageProps) {
  const { tenantSlug, eventSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const sessionIdParam = resolvedSearchParams?.session_id;
  const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;

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
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Checkout complete</p>
        <h1 className="text-4xl font-semibold tracking-tight">Registration confirmed</h1>
        <p className="text-muted-foreground">
          Your payment is on its way. We’ll email a confirmation and receipt once Stripe finishes processing the session.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
          <CardDescription>{formatEventDate(event.date, event.time)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            If you don’t receive a confirmation email within a few minutes, feel free to contact the organizer using the email you received after
            registering.
          </p>
          {sessionId ? (
            <p className="text-xs text-muted-foreground/80">Stripe session ID: {sessionId}</p>
          ) : (
            <p className="text-xs text-muted-foreground/80">
              We couldn’t verify the Stripe session automatically, but your payment is still being processed.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/t/${tenantSlug}/e/${eventSlug}`}>View event details</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to homepage</Link>
        </Button>
      </div>
    </div>
  );
}

function formatEventDate(date: Date, time: string | null) {
  const formattedDate = new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date));

  if (!time) {
    return formattedDate;
  }

  return `${formattedDate} • ${time}`;
}

