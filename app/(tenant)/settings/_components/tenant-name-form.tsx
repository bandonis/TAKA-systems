"use client";

import { useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TenantNameFormProps = {
  initialName: string;
};

type TenantNameResponse = {
  name: string;
};

export function TenantNameForm({ initialName }: TenantNameFormProps) {
  const [value, setValue] = useState(initialName);
  const [savedValue, setSavedValue] = useState(initialName);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDirty = useMemo(() => value.trim() !== savedValue.trim(), [value, savedValue]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPending || !isDirty) {
      return;
    }

    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch('/api/tenant/name', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: value })
        });

        const payload = (await response.json().catch(() => null)) as TenantNameResponse | { error?: string } | null;

        const apiError =
          typeof payload === 'object' &&
          payload !== null &&
          'error' in payload &&
          typeof (payload as { error?: unknown }).error === 'string'
            ? ((payload as { error?: string }).error ?? undefined)
            : undefined;

        if (!response.ok || !payload || typeof (payload as TenantNameResponse).name !== 'string') {
          throw new Error(apiError ?? 'Unable to update team name.');
        }

        setSavedValue(payload.name);
        setValue(payload.name);
        setMessage('Team name updated.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to update team name.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="team-name">Team name</Label>
        <Input
          id="team-name"
          name="name"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (message) {
              setMessage(null);
            }
            if (error) {
              setError(null);
            }
          }}
          minLength={2}
          maxLength={120}
          placeholder="Summit Guides Collective"
        />
        <p className="text-xs text-muted-foreground">
          Shown to your participants in emails, invoices, and other communications.
        </p>
      </div>
      {message ? <p className="text-xs text-emerald-600">{message}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending || !isDirty}>
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
        {isDirty ? <p className="text-xs text-muted-foreground">Unsaved changes</p> : null}
      </div>
    </form>
  );
}

