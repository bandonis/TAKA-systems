"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { EVENT_VISIBILITY, type EventVisibility } from '@/lib/prisma/enums';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EventFormProps = {
  mode: 'create' | 'edit';
  initialData?: {
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
    visibility: EventVisibility;
    location?: string | null;
    guideName?: string | null;
  };
};

const visibilityOptions: { label: string; value: EventVisibility }[] = [
  { label: 'Draft', value: EVENT_VISIBILITY.DRAFT },
  { label: 'Published', value: EVENT_VISIBILITY.PUBLISHED }
];

export function EventForm({ mode, initialData }: EventFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [visibility, setVisibility] = useState<EventVisibility>(initialData?.visibility ?? EVENT_VISIBILITY.DRAFT);

  const defaultDate = initialData?.date ? new Date(initialData.date) : null;
  const defaultDateValue = defaultDate ? defaultDate.toISOString().split('T')[0] : '';
  const defaultEarlyBirdValue = initialData?.earlyBirdDeadline
    ? new Date(initialData.earlyBirdDeadline).toISOString().split('T')[0]
    : '';

  function formatTime(value?: string | null) {
    if (!value) return '';
    if (value.includes(':')) return value;
    const date = new Date(value);
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[1].slice(0, 5);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);

    const date = formData.get('date') as string;
    if (!date) {
      setError('Date is required');
      return;
    }

    const time = (formData.get('time') as string) || '00:00';
    const isoDate = new Date(`${date}T${time}`).toISOString();

    const earlyBirdDate = formData.get('earlyBirdDeadline') as string;
    const earlyBirdTime = (formData.get('earlyBirdTime') as string) || '00:00';
    const earlyBirdIso = earlyBirdDate ? new Date(`${earlyBirdDate}T${earlyBirdTime}`).toISOString() : null;

    const payload = {
      title: formData.get('title'),
      description: formData.get('description') || undefined,
      date: isoDate,
      time,
      maxParticipants: parseNumber(formData.get('maxParticipants')),
      priceSingle: parseNumber(formData.get('priceSingle')),
      priceGroup: parseNumber(formData.get('priceGroup')),
      earlyBirdPrice: parseNumber(formData.get('earlyBirdPrice')),
      earlyBirdDeadline: earlyBirdIso,
      visibility,
      location: formData.get('location') || undefined,
      guideName: formData.get('guideName') || undefined
    };

    startTransition(async () => {
      const endpoint =
        mode === 'create'
          ? '/api/events'
          : `/api/events/${initialData?.id}`;

      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(endpoint, {
        method,
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Unable to save event');
        return;
      }

      setSuccess('Event saved');
      router.push('/events');
      router.refresh();
    });
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit(new FormData(event.currentTarget));
      }}
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title" requiredIndicator>
            Title
          </Label>
          <Input id="title" name="title" defaultValue={initialData?.title ?? ''} required placeholder="Alpine sunrise hike" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={initialData?.description ?? ''}
            placeholder="Short blurb about the experience"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="date" requiredIndicator>
              Date
            </Label>
            <Input id="date" name="date" type="date" defaultValue={defaultDateValue} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="time">Start time</Label>
            <Input id="time" name="time" type="time" defaultValue={formatTime(initialData?.time)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="maxParticipants">Max participants</Label>
            <Input
              id="maxParticipants"
              name="maxParticipants"
              type="number"
              min={1}
              defaultValue={initialData?.maxParticipants ?? ''}
              placeholder="24"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={(value: EventVisibility) => setVisibility(value)}>
              <SelectTrigger id="visibility">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={initialData?.location ?? ''} placeholder="Dolomites, Italy" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="guideName">Guide name</Label>
            <Input id="guideName" name="guideName" defaultValue={initialData?.guideName ?? ''} placeholder="Ana Vītola" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <PriceField id="priceSingle" label="Single ticket" defaultValue={initialData?.priceSingle} />
          <PriceField id="priceGroup" label="Group (2+)" defaultValue={initialData?.priceGroup} />
          <PriceField id="earlyBirdPrice" label="Early bird" defaultValue={initialData?.earlyBirdPrice} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="earlyBirdDeadline">Early bird deadline</Label>
            <Input id="earlyBirdDeadline" name="earlyBirdDeadline" type="date" defaultValue={defaultEarlyBirdValue} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="earlyBirdTime">Deadline time</Label>
            <Input id="earlyBirdTime" name="earlyBirdTime" type="time" defaultValue="23:59" />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {mode === 'create' ? 'Create event' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

function parseNumber(value: FormDataEntryValue | null) {
  if (value === null || value === '') return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

type PriceFieldProps = {
  id: string;
  label: string;
  defaultValue?: number | null;
};

function PriceField({ id, label, defaultValue }: PriceFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center rounded-md border border-input">
        <span className="px-3 text-sm text-muted-foreground">€</span>
        <Input
          id={id}
          name={id}
          type="number"
          min={0}
          step="0.01"
          defaultValue={defaultValue ?? ''}
          className={cn('border-0 border-l border-input rounded-l-none focus-visible:ring-0')}
          placeholder="99.00"
        />
      </div>
    </div>
  );
}


