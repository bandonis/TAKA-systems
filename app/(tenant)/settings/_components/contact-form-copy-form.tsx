"use client";

import { useState, useTransition } from 'react';

import type { ContactFormCopy } from '@/lib/contact/copy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const FIELD_ORDER: Array<{ key: keyof ContactFormCopy; label: string; type: 'input' | 'textarea' }> = [
  { key: 'nameLabel', label: 'Name label', type: 'input' },
  { key: 'namePlaceholder', label: 'Name placeholder', type: 'input' },
  { key: 'headingB2C', label: 'Heading (B2C)', type: 'input' },
  { key: 'headingB2B', label: 'Heading (B2B)', type: 'input' },
  { key: 'descriptionB2C', label: 'Description (B2C)', type: 'textarea' },
  { key: 'descriptionB2B', label: 'Description (B2B)', type: 'textarea' },
  { key: 'modeLabelB2B', label: 'Toggle label (B2B)', type: 'input' },
  { key: 'modeLabelB2C', label: 'Toggle label (B2C)', type: 'input' },
  { key: 'emailLabel', label: 'Email label', type: 'input' },
  { key: 'emailPlaceholder', label: 'Email placeholder', type: 'input' },
  { key: 'phoneLabel', label: 'Phone label', type: 'input' },
  { key: 'phonePlaceholder', label: 'Phone placeholder', type: 'input' },
  { key: 'eventLabel', label: 'Event dropdown label', type: 'input' },
  { key: 'eventPlaceholder', label: 'Event placeholder', type: 'input' },
  { key: 'eventTypeLabel', label: 'Hike type label (B2B)', type: 'input' },
  { key: 'ticketCountLabel', label: 'Ticket count label', type: 'input' },
  { key: 'totalLabel', label: 'Total label', type: 'input' },
  { key: 'earlyBirdLabel', label: 'Early-bird helper text (use {date})', type: 'input' },
  { key: 'commentLabel', label: 'Comment label', type: 'input' },
  { key: 'commentPlaceholder', label: 'Comment placeholder', type: 'textarea' },
  { key: 'companyNameLabel', label: 'Company name label (B2B)', type: 'input' },
  { key: 'contactPersonLabel', label: 'Contact person label (B2B)', type: 'input' },
  { key: 'participantsLabel', label: 'Participants label (B2B)', type: 'input' },
  { key: 'preferredDateLabel', label: 'Preferred date label (B2B)', type: 'input' },
  { key: 'submitLabelB2C', label: 'Submit button (B2C)', type: 'input' },
  { key: 'submitLabelB2B', label: 'Submit button (B2B)', type: 'input' },
  { key: 'marketingConsentLabel', label: 'Marketing consent text', type: 'textarea' },
  { key: 'manualDisclaimer', label: 'Manual payment disclaimer', type: 'textarea' }
];

export function ContactFormCopyForm({ initialCopy }: { initialCopy: ContactFormCopy }) {
  const [values, setValues] = useState<ContactFormCopy>(initialCopy);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleChange = (key: keyof ContactFormCopy, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch('/api/tenant/contact-copy', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        const payload = (await response.json().catch(() => null)) as { copy?: ContactFormCopy; error?: string } | null;
        if (!response.ok || !payload?.copy) {
          throw new Error(payload?.error ?? 'Unable to save wording.');
        }
        setValues(payload.copy);
        setMessage('Saved contact form wording.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to save wording.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {FIELD_ORDER.map(({ key, label, type }) => (
        <div key={key} className="space-y-1">
          <label className="text-sm font-medium text-foreground" htmlFor={`copy-${key}`}>
            {label}
          </label>
          {type === 'input' ? (
            <Input
              id={`copy-${key}`}
              value={values[key]}
              onChange={(event) => handleChange(key, event.target.value)}
              disabled={isPending}
            />
          ) : (
            <Textarea
              id={`copy-${key}`}
              value={values[key]}
              onChange={(event) => handleChange(key, event.target.value)}
              disabled={isPending}
              rows={3}
            />
          )}
        </div>
      ))}
      {message ? <p className="text-xs text-emerald-600">{message}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save wording'}
      </Button>
    </form>
  );
}
