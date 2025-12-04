"use client";

import type { ReactNode } from 'react';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Loader2, Monitor, Smartphone, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

type EventOption = {
  id: string;
  title: string;
  dateLabel: string;
};

type BlockCardProps = {
  landingId: string;
  blockId: string;
  orderLabel: string;
  variantLabel: string;
  blockTypeLabel: string;
  blockIdentifier: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  visibleMobile: boolean;
  visibleDesktop: boolean;
  isContactForm: boolean;
  contactConfig: { allowedEventIds: string[] };
  events: EventOption[];
};

export function BlockCard(props: BlockCardProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [visibilityState, setVisibilityState] = useState({
    mobile: props.visibleMobile,
    desktop: props.visibleDesktop
  });

  useEffect(() => {
    setVisibilityState({ mobile: props.visibleMobile, desktop: props.visibleDesktop });
  }, [props.visibleMobile, props.visibleDesktop]);

  const [contactSelection, setContactSelection] = useState<string[]>(() =>
    dedupeEventIds(props.contactConfig.allowedEventIds)
  );
  useEffect(() => {
    setContactSelection(dedupeEventIds(props.contactConfig.allowedEventIds));
  }, [props.contactConfig.allowedEventIds]);

  const mutate = (init: RequestInit, options?: { onError?: () => void }) => {
    startTransition(() => {
      setError(null);
      const headers =
        init.body !== undefined
          ? {
              'Content-Type': 'application/json',
              ...(init.headers || {})
            }
          : init.headers;

      fetch(`/api/landings/${props.landingId}/blocks/${props.blockId}`, {
        ...init,
        headers
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Request failed');
          }
          router.refresh();
        })
        .catch((err) => {
          console.error(err);
          setError('Unable to update block. Please try again.');
          options?.onError?.();
        });
    });
  };

  const handleMove = (direction: 'up' | 'down') => {
    mutate({
      method: 'PATCH',
      body: JSON.stringify({ action: 'move', direction })
    });
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this block? This action cannot be undone.')) {
      return;
    }
    mutate({ method: 'DELETE' });
  };

  const toggleVisibility = (target: 'mobile' | 'desktop') => {
    const previous = visibilityState;
    const next = {
      mobile: target === 'mobile' ? !visibilityState.mobile : visibilityState.mobile,
      desktop: target === 'desktop' ? !visibilityState.desktop : visibilityState.desktop
    };
    setVisibilityState(next);
    mutate({
      method: 'PATCH',
      body: JSON.stringify({
        action: 'visibility',
        visibleMobile: next.mobile,
        visibleDesktop: next.desktop
      })
    }, {
      onError: () => setVisibilityState(previous)
    });
  };

  const handleContactSelection = (eventId: string, isChecked: boolean) => {
    const previous = contactSelection;
    const nextSet = new Set(previous);
    if (isChecked) {
      nextSet.add(eventId);
    } else {
      nextSet.delete(eventId);
    }
    const nextSelection = Array.from(nextSet);
    setContactSelection(nextSelection);
    mutate(
      {
        method: 'PATCH',
        body: JSON.stringify({ action: 'contactConfig', allowedEventIds: nextSelection })
      },
      {
        onError: () => setContactSelection(previous)
      }
    );
  };

  const contactEmptyWarning = props.isContactForm && contactSelection.length === 0;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card/30 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{props.orderLabel}</p>
          <h3 className="text-lg font-semibold text-foreground">{props.variantLabel}</h3>
          <p className="text-xs text-muted-foreground">
            {props.blockTypeLabel} · {props.blockIdentifier}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => handleMove('up')} disabled={isPending || !props.canMoveUp}>
            <ArrowUp className="mr-1.5 h-4 w-4" />
            Up
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMove('down')}
            disabled={isPending || !props.canMoveDown}
          >
            <ArrowDown className="mr-1.5 h-4 w-4" />
            Down
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <VisibilityToggle
          label="Show on mobile"
          icon={<Smartphone className="h-4 w-4" />}
          active={visibilityState.mobile}
          disabled={isPending}
          onClick={() => toggleVisibility('mobile')}
        />
        <VisibilityToggle
          label="Show on desktop"
          icon={<Monitor className="h-4 w-4" />}
          active={visibilityState.desktop}
          disabled={isPending}
          onClick={() => toggleVisibility('desktop')}
        />
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {props.isContactForm ? (
        <div className="space-y-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">Contact form events</p>
            <p className="text-xs text-muted-foreground">{contactSelection.length} selected</p>
          </div>
          {props.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming events available. Create one to enable this form.</p>
          ) : (
            <div className="space-y-2">
              {props.events.map((eventOption) => {
                const isSelected = contactSelection.includes(eventOption.id);
                return (
                  <label
                    key={eventOption.id}
                    className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:opacity-50"
                      checked={isSelected}
                      onChange={(event) => handleContactSelection(eventOption.id, event.target.checked)}
                      disabled={isPending}
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{eventOption.title}</span>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">{eventOption.dateLabel}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {contactEmptyWarning && (
            <p className="text-xs font-medium text-amber-600">Contact form requires at least one event.</p>
          )}
        </div>
      ) : null}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
function dedupeEventIds(ids: string[]) {
  const seen = new Set<string>();
  return ids.filter((id) => {
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  });
}

function VisibilityToggle({ label, icon, active, disabled, onClick }: { label: string; icon: ReactNode; active: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
        active
          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700'
          : 'border-border bg-background text-muted-foreground hover:text-foreground'
      } disabled:opacity-50`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

