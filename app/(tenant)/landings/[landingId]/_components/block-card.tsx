"use client";

import type { ReactNode } from 'react';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Loader2, Monitor, Smartphone, Trash2 } from 'lucide-react';

import type { ContactFormConfig } from '@/lib/landings/blocks';
import { Button } from '@/components/ui/button';

type EventOption = {
  id: string;
  title: string;
  dateLabel: string;
};

type EventTypeOption = {
  id: string;
  name: string;
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
  contactConfig: ContactFormConfig;
  events: EventOption[];
  eventTypes: EventTypeOption[];
};

const EMPTY_CONTACT_CONFIG: ContactFormConfig = {
  mode: 'b2c',
  allowedEventIds: [],
  allowedEventTypeIds: [],
  testimonials: []
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

  const [contactConfigState, setContactConfigState] = useState<ContactFormConfig>(() =>
    normalizeContactConfig(props.contactConfig)
  );
  useEffect(() => {
    setContactConfigState(normalizeContactConfig(props.contactConfig));
  }, [props.contactConfig]);

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

  const applyContactConfig = (nextConfig: ContactFormConfig) => {
    const previous = contactConfigState;
    setContactConfigState(nextConfig);
    mutate(
      {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'contactConfig',
          mode: nextConfig.mode,
          allowedEventIds: nextConfig.allowedEventIds,
          allowedEventTypeIds: nextConfig.allowedEventTypeIds,
          testimonials: nextConfig.testimonials
        })
      },
      {
        onError: () => setContactConfigState(previous)
      }
    );
  };

  const contactWarning =
    props.isContactForm &&
    ((contactConfigState.mode === 'b2c' && contactConfigState.allowedEventIds.length === 0) ||
      (contactConfigState.mode === 'b2b' && contactConfigState.allowedEventTypeIds.length === 0));

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
        <ContactConfigurator
          config={contactConfigState}
          events={props.events}
          eventTypes={props.eventTypes}
          disabled={isPending}
          warning={contactWarning}
          onConfigChange={applyContactConfig}
        />
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

type ContactConfiguratorProps = {
  config: ContactFormConfig;
  events: EventOption[];
  eventTypes: EventTypeOption[];
  disabled: boolean;
  warning: boolean;
  onConfigChange: (nextConfig: ContactFormConfig) => void;
};

function ContactConfigurator({ config, events, eventTypes, disabled, warning, onConfigChange }: ContactConfiguratorProps) {
  const updateMode = (mode: ContactFormConfig['mode']) => {
    if (mode === config.mode) {
      return;
    }
    onConfigChange({ ...config, mode });
  };

  const toggleEvent = (eventId: string, checked: boolean) => {
    const set = new Set(config.allowedEventIds);
    if (checked) {
      set.add(eventId);
    } else {
      set.delete(eventId);
    }
    onConfigChange({ ...config, allowedEventIds: Array.from(set) });
  };

  const toggleEventType = (typeId: string, checked: boolean) => {
    const set = new Set(config.allowedEventTypeIds);
    if (checked) {
      set.add(typeId);
    } else {
      set.delete(typeId);
    }
    onConfigChange({ ...config, allowedEventTypeIds: Array.from(set) });
  };

  const updateTestimonial = (id: string, partial: Partial<ContactFormTestimonial>) => {
    const items = config.testimonials.map((item) => (item.id === id ? { ...item, ...partial } : item));
    onConfigChange({ ...config, testimonials: items });
  };

  const addTestimonial = () => {
    const newItem: ContactFormTestimonial = {
      id: crypto.randomUUID(),
      author: 'New author',
      quote: 'Share a kind word...'
    };
    onConfigChange({ ...config, testimonials: [...config.testimonials, newItem] });
  };

  const removeTestimonial = (id: string) => {
    onConfigChange({ ...config, testimonials: config.testimonials.filter((item) => item.id !== id) });
  };

  return (
    <div className="space-y-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={config.mode === 'b2c' ? 'default' : 'outline'}
          disabled={disabled}
          onClick={() => updateMode('b2c')}
        >
          B2C (Private persons)
        </Button>
        <Button
          type="button"
          size="sm"
          variant={config.mode === 'b2b' ? 'default' : 'outline'}
          disabled={disabled}
          onClick={() => updateMode('b2b')}
        >
          B2B (Companies)
        </Button>
      </div>

      {config.mode === 'b2c' ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Allowed events ({config.allowedEventIds.length})</p>
            {events.length === 0 && (
              <p className="text-xs text-muted-foreground">No upcoming events. Create one first.</p>
            )}
          </div>
          {events.length > 0 && (
            <div className="space-y-2">
              {events.map((eventOption) => {
                const isSelected = config.allowedEventIds.includes(eventOption.id);
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
                      onChange={(event) => toggleEvent(eventOption.id, event.target.checked)}
                      disabled={disabled}
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
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Allowed event types ({config.allowedEventTypeIds.length})</p>
            {eventTypes.length === 0 && (
              <p className="text-xs text-muted-foreground">No event types yet. Create one in Events → Types.</p>
            )}
          </div>
          {eventTypes.length > 0 && (
            <div className="space-y-2">
              {eventTypes.map((eventType) => {
                const isSelected = config.allowedEventTypeIds.includes(eventType.id);
                return (
                  <label
                    key={eventType.id}
                    className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/60'
                    }`}
                  >
                    <span className="text-sm font-semibold text-foreground">{eventType.name}</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:opacity-50"
                      checked={isSelected}
                      onChange={(event) => toggleEventType(eventType.id, event.target.checked)}
                      disabled={disabled}
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Testimonials ({config.testimonials.length})</p>
          <Button type="button" size="sm" variant="outline" onClick={addTestimonial} disabled={disabled}>
            Add testimonial
          </Button>
        </div>
        {config.testimonials.length === 0 ? (
          <p className="text-xs text-muted-foreground">No testimonials configured. Add one to show the side panel.</p>
        ) : (
          <div className="space-y-2">
            {config.testimonials.map((testimonial) => (
              <div key={testimonial.id} className="rounded-md border border-border bg-background/60 p-3 space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                  <label className="flex-1 space-y-1 text-xs font-medium text-foreground">
                    Author
                    <input
                      type="text"
                      value={testimonial.author}
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                      disabled={disabled}
                      onChange={(event) => updateTestimonial(testimonial.id, { author: event.target.value })}
                    />
                  </label>
                  <label className="flex w-full max-w-[120px] flex-col text-xs font-medium text-foreground">
                    Rating
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={testimonial.rating ?? ''}
                      className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                      disabled={disabled}
                      onChange={(event) =>
                        updateTestimonial(testimonial.id, {
                          rating: event.target.value === '' ? undefined : Number(event.target.value)
                        })
                      }
                    />
                  </label>
                </div>
                <label className="space-y-1 text-xs font-medium text-foreground">
                  Quote
                  <textarea
                    value={testimonial.quote}
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    rows={3}
                    disabled={disabled}
                    onChange={(event) => updateTestimonial(testimonial.id, { quote: event.target.value })}
                  />
                </label>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={disabled}
                    onClick={() => removeTestimonial(testimonial.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {warning && (
        <p className="text-xs font-medium text-amber-600">
          {config.mode === 'b2c'
            ? 'Contact form requires at least one allowed event.'
            : 'Contact form requires at least one event type.'}
        </p>
      )}
    </div>
  );
}

type ContactFormTestimonial = ContactFormConfig['testimonials'][number];

function normalizeContactConfig(config: ContactFormConfig): ContactFormConfig {
  return {
    mode: config.mode === 'b2b' ? 'b2b' : 'b2c',
    allowedEventIds: dedupeEventIds(config.allowedEventIds),
    allowedEventTypeIds: dedupeEventIds(config.allowedEventTypeIds),
    testimonials: config.testimonials.map((item, index) => ({
      id: item.id || `testimonial-${index}`,
      author: item.author,
      quote: item.quote,
      rating: item.rating
    }))
  };
}

