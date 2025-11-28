"use client";

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RegistrationFormProps = {
  tenantSlug: string;
  eventSlug: string;
};

export function PublicRegistrationForm({ tenantSlug, eventSlug }: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: (formData.get('name') as string | null)?.trim() ?? '',
      email: (formData.get('email') as string | null)?.trim() ?? '',
      phone: (formData.get('phone') as string | null)?.trim() || null,
      ticketCount: Number(formData.get('ticketCount') ?? 1)
    };

    if (!payload.name || !payload.email || Number.isNaN(payload.ticketCount) || payload.ticketCount < 1) {
      setIsSubmitting(false);
      setError('Please fill out all required fields.');
      return;
    }

    try {
      const response = await fetch(`/api/public/events/${tenantSlug}/${eventSlug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'Unable to start checkout. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const data = (await response.json()) as { checkoutUrl: string };
      window.location.href = data.checkoutUrl;
    } catch (err) {
      console.error('Public registration failed', err);
      setError('Unexpected error. Please refresh and try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
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
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Redirecting…' : 'Continue to secure checkout'}
      </Button>
    </form>
  );
}

