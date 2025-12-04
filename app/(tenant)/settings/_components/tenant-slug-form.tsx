"use client";

import { useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type TenantSlugFormProps = {
  initialSlug: string | null;
  publicSlug: string;
};

type SlugResponsePayload = {
  slug: string | null;
  publicSlug: string;
};

type ApiErrorPayload = {
  error?: string | { code?: string; message?: string };
};

type NormalizedError = {
  code?: string;
  message: string;
};

export function TenantSlugForm({ initialSlug, publicSlug }: TenantSlugFormProps) {
  const [value, setValue] = useState(initialSlug ?? '');
  const [savedSlug, setSavedSlug] = useState(initialSlug ?? '');
  const [effectiveSlug, setEffectiveSlug] = useState(publicSlug);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isDirty = useMemo(() => value.trim() !== savedSlug.trim(), [value, savedSlug]);

  const submitSlugUpdate = () => {
    setMessage(null);
    setFieldError(null);
    setFormError(null);

    startTransition(async () => {
      try {
        const response = await fetch('/api/tenant/slug', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: value })
        });

        const payload = (await response.json().catch(() => null)) as SlugResponsePayload | ApiErrorPayload | null;

        if (!response.ok || !isSlugResponsePayload(payload)) {
          const apiError = parseApiError(payload);
          if (apiError?.code === 'SLUG_TAKEN') {
            setFieldError(apiError.message);
            return;
          }
          throw new Error(apiError?.message ?? 'Unable to update slug.');
        }

        const nextSlugValue = payload.slug ?? '';
        setSavedSlug(nextSlugValue);
        setEffectiveSlug(payload.publicSlug);
        setValue(nextSlugValue);
        setMessage('Slug updated successfully.');
        setFieldError(null);
        setFormError(null);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Unable to update slug.');
      }
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending || !isDirty) {
      return;
    }

    const trimmedValue = value.trim();
    const trimmedSaved = savedSlug.trim();

    if (trimmedValue !== trimmedSaved) {
      setConfirmOpen(true);
      return;
    }

    submitSlugUpdate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tenant-slug">Public slug</Label>
        <Input
          id="tenant-slug"
          name="slug"
          value={value}
          placeholder="adventure-studio"
          onChange={(event) => {
            setValue(event.target.value);
            if (fieldError) {
              setFieldError(null);
            }
          }}
          spellCheck={false}
          autoComplete="off"
          pattern="[a-z0-9-]*"
          minLength={0}
          maxLength={48}
        />
        {fieldError ? <p className="text-xs text-destructive">{fieldError}</p> : null}
        <p className="text-xs text-muted-foreground">
          Used in your public landing URLs, for example: /your-slug/go/landing-name. Changing this will change every public link.
        </p>
        <p className="text-xs text-muted-foreground">Use lowercase letters, numbers, and hyphens only.</p>
      </div>
      <div className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
        Public landing URLs will look like{' '}
        <code className="rounded bg-muted px-1 py-0.5 text-[11px] text-muted-foreground">
          /{effectiveSlug || '[tenantId]'}/go/[landingSlug]
        </code>
        .
      </div>
      {message ? <p className="text-xs text-emerald-600">{message}</p> : null}
      {formError ? <p className="text-xs text-destructive">{formError}</p> : null}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending || !isDirty}>
          {isPending ? 'Saving…' : 'Save slug'}
        </Button>
        {isDirty ? <p className="text-xs text-muted-foreground">Unsaved changes</p> : null}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Change public URL?"
        description="Updating this slug will change all public URLs for your landing pages. Links you’ve already shared may stop working."
        confirmLabel="Yes, update slug"
        confirmVariant="destructive"
        onConfirm={() => {
          setConfirmOpen(false);
          submitSlugUpdate();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </form>
  );
}

function isSlugResponsePayload(payload: unknown): payload is SlugResponsePayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<SlugResponsePayload>;
  const hasPublicSlug = typeof candidate.publicSlug === 'string';
  const slugValue = (candidate as SlugResponsePayload).slug;
  const hasValidSlug = typeof slugValue === 'string' || slugValue === null;

  return hasPublicSlug && hasValidSlug;
}

function parseApiError(payload: unknown): NormalizedError | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const value = (payload as ApiErrorPayload).error;

  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return { message: value };
  }

  if (typeof value === 'object') {
    const code = typeof value.code === 'string' ? value.code : undefined;
    const message = typeof value.message === 'string' ? value.message : undefined;
    return { code, message: message ?? 'Request failed.' };
  }

  return null;
}

