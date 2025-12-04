"use client";

import { useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TenantSlugFormProps = {
  initialSlug: string | null;
  publicSlug: string;
};

export function TenantSlugForm({ initialSlug, publicSlug }: TenantSlugFormProps) {
  const [value, setValue] = useState(initialSlug ?? '');
  const [savedSlug, setSavedSlug] = useState(initialSlug ?? '');
  const [effectiveSlug, setEffectiveSlug] = useState(publicSlug);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDirty = useMemo(() => value.trim() !== savedSlug.trim(), [value, savedSlug]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending || !isDirty) {
      return;
    }

    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch('/api/tenant/slug', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: value })
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? 'Unable to update slug.');
        }

        const payload = (await response.json()) as { slug: string | null; publicSlug: string };
        const nextSlugValue = payload.slug ?? '';
        setSavedSlug(nextSlugValue);
        setEffectiveSlug(payload.publicSlug);
        setValue(nextSlugValue);
        setMessage('Slug updated successfully.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to update slug.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tenant-slug">Tenant slug</Label>
        <Input
          id="tenant-slug"
          name="slug"
          value={value}
          placeholder="adventure-studio"
          onChange={(event) => setValue(event.target.value)}
          spellCheck={false}
          autoComplete="off"
          pattern="[a-z0-9-]*"
          minLength={0}
          maxLength={48}
        />
        <p className="text-xs text-muted-foreground">
          Use lowercase letters, numbers, and hyphens only. Leave blank to fall back to the tenant ID.
        </p>
      </div>
      <div className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
        Public landing URLs will look like{' '}
        <code className="rounded bg-muted px-1 py-0.5 text-[11px] text-muted-foreground">
          /{effectiveSlug || '[tenantId]'}/go/[landingSlug]
        </code>
        .
      </div>
      {message ? <p className="text-xs text-emerald-600">{message}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending || !isDirty}>
          {isPending ? 'Saving…' : 'Save slug'}
        </Button>
        {isDirty ? <p className="text-xs text-muted-foreground">Unsaved changes</p> : null}
      </div>
    </form>
  );
}

