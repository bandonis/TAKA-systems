"use client";

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { updateLandingHeader, type LandingHeaderFormState } from '../actions';

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' }
] as const;

type LandingStatusValue = (typeof STATUS_OPTIONS)[number]['value'];

type LandingHeaderFormProps = {
  landingId: string;
  title: string;
  slug: string;
  status: LandingStatusValue;
};

const initialState: LandingHeaderFormState = {};

export function LandingHeaderForm({ landingId, title, slug, status }: LandingHeaderFormProps) {
  const [state, formAction] = useFormState(updateLandingHeader, initialState);
  const [localTitle, setLocalTitle] = useState(title);
  const [localSlug, setLocalSlug] = useState(slug);
  const [localStatus, setLocalStatus] = useState<LandingStatusValue>(status);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  useEffect(() => {
    setLocalSlug(slug);
  }, [slug]);

  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  useEffect(() => {
    if (state.success) {
      setJustSaved(true);
      const timeout = setTimeout(() => setJustSaved(false), 2500);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [state.success]);

  const resetSuccess = () => setJustSaved(false);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="landingId" value={landingId} />
      <input type="hidden" name="status" value={localStatus} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="landing-title">Title</Label>
          <Input
            id="landing-title"
            name="title"
            value={localTitle}
            onChange={(event) => {
              setLocalTitle(event.target.value);
              resetSuccess();
            }}
            autoComplete="off"
            required
          />
          {state.fieldErrors?.title && <p className="text-sm text-destructive">{state.fieldErrors.title}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="landing-slug">Slug</Label>
          <Input
            id="landing-slug"
            name="slug"
            value={localSlug}
            onChange={(event) => {
              const next = event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
              setLocalSlug(next);
              resetSuccess();
            }}
            autoComplete="off"
            required
          />
          <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only.</p>
          {state.fieldErrors?.slug && <p className="text-sm text-destructive">{state.fieldErrors.slug}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={localStatus}
          onValueChange={(value) => {
            setLocalStatus(value as LandingStatusValue);
            resetSuccess();
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.status && <p className="text-sm text-destructive">{state.fieldErrors.status}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton />
        {justSaved && <p className="text-sm text-muted-foreground">Saved.</p>}
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </Button>
  );
}

