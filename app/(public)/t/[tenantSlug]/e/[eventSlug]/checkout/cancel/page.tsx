import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getEventBySlug, getTenantBySlug, serializeEventForPublic } from '@/lib/events/public';

type CheckoutCancelPageProps = {
  params: Promise<{ tenantSlug: string; eventSlug: string }>;
};

export default async function CheckoutCancelPage({ params }: CheckoutCancelPageProps) {
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
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Checkout cancelled</p>
        <h1 className="text-4xl font-semibold tracking-tight">Registration not completed</h1>
        <p className="text-muted-foreground">
          Your Stripe payment was cancelled or did not complete. You can restart the process at any time using the buttons below.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
          <CardDescription>{formatEventDate(event.date, event.time)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>No payment has been recorded for this registration. If this was unintentional, you can try again.</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/t/${tenantSlug}/e/${eventSlug}`}>Try again</Link>
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


