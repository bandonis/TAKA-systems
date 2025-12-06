"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import type { BlockVariantId } from '@/lib/landings/blocks';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type BlockOption = {
  id: BlockVariantId;
  label: string;
  description: string;
};

type AddBlockControlProps = {
  landingId: string;
  options: BlockOption[];
  disabledOptionIds?: BlockVariantId[];
  warningMessage?: string;
};

export function AddBlockControl({
  landingId,
  options,
  disabledOptionIds = [],
  warningMessage
}: AddBlockControlProps) {
  const router = useRouter();
  const initialOption = options.find((option) => !disabledOptionIds.includes(option.id)) ?? options[0];
  const [selected, setSelected] = useState<BlockVariantId>(initialOption?.id ?? 'hero');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!options.length) {
    return null;
  }

  const handleAddBlock = () => {
    if (disabledOptionIds.includes(selected)) {
      setError('This block type cannot be added again.');
      return;
    }
    startTransition(() => {
      setError(null);

      const run = async () => {
        try {
          const response = await fetch(`/api/landings/${landingId}/blocks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variantId: selected })
          });

          if (!response.ok) {
            const message = await extractErrorMessage(response);
            throw new Error(message);
          }

          router.refresh();
        } catch (err) {
          console.error(err);
          setError((err instanceof Error && err.message) || 'Unable to add block. Please try again.');
        }
      };

      void run();
    });
  };

  const currentOption = options.find((option) => option.id === selected);

  return (
    <div className="rounded-lg border border-dashed border-border p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-foreground">Add block</label>
          <Select
            value={selected}
            onValueChange={(value) => setSelected(value as BlockVariantId)}
            disabled={isPending || options.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select block type" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id} disabled={disabledOptionIds.includes(option.id)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{currentOption?.description}</p>
        </div>
        <Button onClick={handleAddBlock} disabled={isPending || options.length === 0} className="sm:w-auto">
          {isPending ? 'Adding…' : 'Add block'}
        </Button>
      </div>
      {warningMessage && (
        <p className="mt-2 text-sm font-medium text-amber-600" role="alert">
          {warningMessage}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

async function extractErrorMessage(response: Response) {
  try {
    const data = await response.json();
    if (data && typeof data.error === 'string') {
      return data.error;
    }
  } catch {
    // ignore
  }
  return 'Unable to add block. Please try again.';
}

