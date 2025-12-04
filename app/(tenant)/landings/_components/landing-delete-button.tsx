"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button, type ButtonProps } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';

type LandingDeleteButtonProps = {
  landingId: string;
  landingTitle: string;
  redirectTo?: string;
  buttonLabel?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
};

export function LandingDeleteButton({
  landingId,
  landingTitle,
  redirectTo,
  buttonLabel = 'Delete landing',
  variant = 'destructive',
  size = 'sm',
  className
}: LandingDeleteButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/landings/${landingId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = typeof payload.error === 'string' ? payload.error : 'Unable to delete landing.';
        setError(message);
        return;
      }

      setConfirmOpen(false);

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Button type="button" variant={variant} size={size} onClick={() => setConfirmOpen(true)} disabled={isPending}>
        {isPending ? 'Deleting…' : buttonLabel}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete landing page?"
        description="This will permanently delete this landing page and its blocks. Any public links to this page will stop working."
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={handleDelete}
        onCancel={() => {
          if (!isPending) {
            setConfirmOpen(false);
          }
        }}
      />
    </div>
  );
}


