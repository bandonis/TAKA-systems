"use client";

import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';

export function CreateLandingButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Creating…' : 'Create landing page'}
    </Button>
  );
}

