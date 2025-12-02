import { EventForm } from '@/app/(tenant)/events/_components/event-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewEventPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Create event</p>
        <h1 className="text-3xl font-semibold tracking-tight">Launch a new adventure</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm mode="create" />
        </CardContent>
      </Card>
    </section>
  );
}






