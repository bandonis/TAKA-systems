"use client";

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';

const OPTIONS: Array<{ value: 'STRIPE' | 'MANUAL'; label: string; description: string }> = [
  {
    value: 'STRIPE',
    label: 'Stripe checkout',
    description: 'Participants pay immediately via Stripe checkout and the booking is confirmed on payment.'
  },
  {
    value: 'MANUAL',
    label: 'Manual confirmation',
    description: 'Participants submit a request and you confirm or invoice them manually (no online payment).'
  }
];

type PaymentModeFormProps = {
  initialMode: 'STRIPE' | 'MANUAL';
};

export function PaymentModeForm({ initialMode }: PaymentModeFormProps) {
  const [mode, setMode] = useState<'STRIPE' | 'MANUAL'>(initialMode);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch('/api/tenant/payment-mode', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentMode: mode })
        });
        const payload = (await response.json().catch(() => null)) as { paymentMode?: 'STRIPE' | 'MANUAL'; error?: string } | null;
        if (!response.ok || !payload?.paymentMode) {
          throw new Error(payload?.error ?? 'Unable to update payment mode.');
        }
        setMode(payload.paymentMode);
        setMessage('Payment mode saved.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to update payment mode.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer flex-col gap-1 rounded-lg border px-4 py-3 text-left ${
              mode === option.value ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="paymentMode"
              value={option.value}
              className="sr-only"
              checked={mode === option.value}
              onChange={() => setMode(option.value)}
              disabled={isPending}
            />
            <span className="text-sm font-semibold">{option.label}</span>
            <span className="text-xs text-muted-foreground">{option.description}</span>
          </label>
        ))}
      </div>
      {message ? <p className="text-xs text-emerald-600">{message}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save payment mode'}
      </Button>
    </form>
  );
}

