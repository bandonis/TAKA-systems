"use client";

import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';

import type { ContactFormCopy } from '@/lib/contact/copy';
import type { ContactFormConfig } from '@/lib/landings/blocks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type ContactEventOption = {
  id: string;
  title: string;
  dateLabel: string;
  dateISO: string;
  priceSingle: number | null;
  priceGroup: number | null;
  earlyBirdPrice: number | null;
  earlyBirdDeadline: string | null;
};

export type ContactEventTypeOption = {
  id: string;
  name: string;
};

export type ContactTestimonial = ContactFormConfig['testimonials'][number];

type ContactFormBlockProps = {
  tenantSlug: string;
  landingSlug: string;
  landingId: string;
  config: ContactFormConfig;
  events: ContactEventOption[];
  eventTypes: ContactEventTypeOption[];
  paymentMode: 'STRIPE' | 'MANUAL';
  currency: string;
  copy: ContactFormCopy;
  testimonials: ContactTestimonial[];
};

export function ContactFormBlock(props: ContactFormBlockProps) {
  const [mode, setMode] = useState<ContactFormConfig['mode']>(props.config.mode);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(280px,360px),minmax(0,1fr)]">
      <TestimonialsPanel testimonials={props.testimonials} />
      {mode === 'b2c' ? (
        <B2CForm {...props} mode={mode} onModeChange={setMode} />
      ) : (
        <B2BForm {...props} mode={mode} onModeChange={setMode} />
      )}
    </div>
  );
}

type ModeToggleProps = {
  mode: ContactFormConfig['mode'];
  onModeChange: (mode: ContactFormConfig['mode']) => void;
  copy: ContactFormCopy;
};

function ModeToggle({ mode, onModeChange, copy }: ModeToggleProps) {
  return (
    <div className="inline-flex rounded-full bg-emerald-900/40 p-1 text-xs font-semibold">
      <button
        type="button"
        className={cn(
          'flex items-center gap-2 rounded-full px-4 py-1 transition',
          mode === 'b2b' ? 'bg-amber-400 text-emerald-900 shadow' : 'text-white hover:text-amber-200'
        )}
        onClick={() => onModeChange('b2b')}
      >
        {copy.modeLabelB2B}
      </button>
      <button
        type="button"
        className={cn(
          'flex items-center gap-2 rounded-full px-4 py-1 transition',
          mode === 'b2c' ? 'bg-amber-400 text-emerald-900 shadow' : 'text-white hover:text-amber-200'
        )}
        onClick={() => onModeChange('b2c')}
      >
        {copy.modeLabelB2C}
      </button>
    </div>
  );
}

function B2CForm(props: ContactFormBlockProps & { mode: ContactFormConfig['mode']; onModeChange: (mode: ContactFormConfig['mode']) => void }) {
  const { events, currency, paymentMode, landingId, tenantSlug, landingSlug, copy } = props;
  const defaultEventId = events[0]?.id ?? '';
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    eventId: defaultEventId,
    name: '',
    email: '',
    phone: '',
    ticketCount: 1,
    message: '',
    marketingConsent: true
  });

  const eventMap = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);

  const pricePreview = computePricePreview(eventMap.get(form.eventId), form.ticketCount);
  const earlyBirdText = useMemo(() => {
    if (!pricePreview?.earlyBirdDeadline) {
      return null;
    }
    const date = new Date(pricePreview.earlyBirdDeadline);
    const formatted = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
    return copy.earlyBirdLabel.includes('{date}')
      ? copy.earlyBirdLabel.replace('{date}', formatted)
      : `${copy.earlyBirdLabel} ${formatted}`;
  }, [pricePreview?.earlyBirdDeadline, copy.earlyBirdLabel]);

  const shouldAutosave = () => form.email.trim().length > 0 && form.eventId;

  const triggerAutosave = async (): Promise<string | null> => {
    if (!shouldAutosave()) {
      return participantId;
    }
    try {
      setAutoSaveState('saving');
      const response = await fetch('/api/contact/b2c/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landingId,
          eventId: form.eventId,
          participantId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          ticketCount: form.ticketCount,
          message: form.message,
          marketingConsent: form.marketingConsent
        })
      });
      const payload = (await response.json().catch(() => null)) as { participantId?: string } | { error?: string } | null;
      if (!response.ok || !payload || !('participantId' in payload) || !payload.participantId) {
        throw new Error((payload as { error?: string })?.error ?? 'Unable to autosave');
      }
      setParticipantId(payload.participantId);
      setAutoSaveState('idle');
      return payload.participantId;
    } catch (error) {
      console.error(error);
      setAutoSaveState('error');
      return participantId;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitState === 'submitting') return;
    setSubmitState('submitting');
    setErrorMessage(null);
    setSuccessMessage(null);

    let currentParticipantId = participantId;
    if (!currentParticipantId) {
      currentParticipantId = await triggerAutosave();
      if (!currentParticipantId) {
        setErrorMessage('Please fill in your email to continue.');
        setSubmitState('error');
        return;
      }
      setParticipantId(currentParticipantId);
    }

    try {
      const response = await fetch('/api/contact/b2c/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landingId,
          participantId: currentParticipantId,
          eventId: form.eventId,
          tenantSlug,
          landingSlug,
          name: form.name || 'Guest',
          email: form.email,
          phone: form.phone,
          ticketCount: form.ticketCount,
          message: form.message,
          marketingConsent: form.marketingConsent
        })
      });
      const payload = (await response.json().catch(() => null)) as { checkoutUrl?: string; status?: string; error?: string } | null;
      if (!response.ok || !payload) {
        throw new Error(payload?.error ?? 'Unable to submit form');
      }
      if (payload.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
        return;
      }
      setSuccessMessage('Thanks! We will confirm your registration shortly.');
      setSubmitState('success');
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to submit form');
      setSubmitState('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-emerald-900/30 p-6 text-white">
      <div className="space-y-2">
        <div>
          <p className="text-xl font-semibold tracking-wide">{copy.headingB2C}</p>
          {copy.descriptionB2C ? <p className="text-sm text-white/80">{copy.descriptionB2C}</p> : null}
        </div>
        <ModeToggle mode={props.mode} onModeChange={props.onModeChange} copy={copy} />
      </div>
      <div className="space-y-4">
        <InputField
          label={copy.nameLabel}
          placeholder={copy.namePlaceholder}
          value={form.name}
          onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
          onBlur={triggerAutosave}
        />
        <InputField
          label={copy.emailLabel}
          placeholder={copy.emailPlaceholder}
          type="email"
          value={form.email}
          onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
          onBlur={triggerAutosave}
          required
        />
        <InputField
          label={copy.phoneLabel}
          placeholder={copy.phonePlaceholder}
          value={form.phone}
          onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
          onBlur={triggerAutosave}
        />
        {events.length === 0 ? (
          <p className="text-sm text-amber-200">No upcoming hikes are linked to this landing yet.</p>
        ) : (
          <SelectField
            label={copy.eventLabel}
            value={form.eventId}
            placeholder={copy.eventPlaceholder}
            options={events.map((event) => ({ value: event.id, label: `${event.dateLabel} — ${event.title}` }))}
            disabled={events.length <= 1}
            onChange={(value) => {
              setForm((prev) => ({ ...prev, eventId: value }));
              void triggerAutosave();
            }}
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label={copy.ticketCountLabel}
            type="number"
            min={1}
            value={String(form.ticketCount)}
            onChange={(value) => {
              const parsed = Number(value) || 1;
              setForm((prev) => ({ ...prev, ticketCount: parsed }));
              void triggerAutosave();
            }}
          />
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/90">{copy.totalLabel}</label>
            <div className="rounded-xl bg-white/10 px-3 py-2 text-lg font-semibold text-amber-300">
              {pricePreview ? `${pricePreview.total.toFixed(2)} ${currency}` : '--'}
            </div>
            {earlyBirdText ? <p className="text-xs text-amber-200">{earlyBirdText}</p> : null}
          </div>
        </div>
        <TextareaField
          label={copy.commentLabel}
          placeholder={copy.commentPlaceholder}
          value={form.message}
          onChange={(value) => setForm((prev) => ({ ...prev, message: value }))}
          onBlur={triggerAutosave}
        />
        <label className="flex items-start gap-2 text-xs text-white/80">
          <input
            type="checkbox"
            checked={form.marketingConsent}
            onChange={(event) => setForm((prev) => ({ ...prev, marketingConsent: event.target.checked }))}
          />
          <span>{copy.marketingConsentLabel}</span>
        </label>
        {paymentMode === 'MANUAL' && (
          <p className="text-xs text-white/70">{copy.manualDisclaimer}</p>
        )}
      </div>
      {autoSaveState === 'error' && <p className="text-xs text-amber-200">Could not save your progress automatically.</p>}
      {errorMessage && <p className="text-sm text-red-300">{errorMessage}</p>}
      {successMessage && <p className="text-sm text-emerald-200">{successMessage}</p>}
      <Button type="submit" className="w-full bg-amber-400 text-emerald-900" disabled={submitState === 'submitting'}>
        {submitState === 'submitting' ? 'Submitting…' : copy.submitLabelB2C}
      </Button>
    </form>
  );
}

function B2BForm(props: ContactFormBlockProps & { mode: ContactFormConfig['mode']; onModeChange: (mode: ContactFormConfig['mode']) => void }) {
  const { eventTypes, landingId, tenantSlug, landingSlug, copy } = props;
  const defaultTypeId = eventTypes[0]?.id ?? '';
  const [leadId, setLeadId] = useState<string | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    eventTypeId: defaultTypeId,
    companyName: '',
    companyPerson: '',
    email: '',
    phone: '',
    participantEstimate: 20,
    preferredDate: '',
    message: '',
    marketingConsent: true
  });

  const shouldAutosave = () => form.email.trim().length > 0 && form.eventTypeId;

  const triggerAutosave = async (): Promise<string | null> => {
    if (!shouldAutosave()) {
      return leadId;
    }
    try {
      setAutoSaveState('saving');
      const response = await fetch('/api/contact/b2b/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landingId,
          eventTypeId: form.eventTypeId,
          leadId,
          companyName: form.companyName,
          companyPerson: form.companyPerson,
          email: form.email,
          phone: form.phone,
          participantEstimate: form.participantEstimate,
          preferredDate: form.preferredDate,
          message: form.message,
          marketingConsent: form.marketingConsent
        })
      });
      const payload = (await response.json().catch(() => null)) as { leadId?: string } | { error?: string } | null;
      if (!response.ok || !payload || !('leadId' in payload) || !payload.leadId) {
        throw new Error((payload as { error?: string })?.error ?? 'Unable to autosave');
      }
      setLeadId(payload.leadId);
      setAutoSaveState('idle');
      return payload.leadId;
    } catch (error) {
      console.error(error);
      setAutoSaveState('error');
      return leadId;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitState === 'submitting') return;
    setSubmitState('submitting');
    setErrorMessage(null);
    setSuccessMessage(null);

    let currentLeadId = leadId;
    if (!currentLeadId) {
      currentLeadId = await triggerAutosave();
      if (!currentLeadId) {
        setErrorMessage('Please fill in your email to continue.');
        setSubmitState('error');
        return;
      }
      setLeadId(currentLeadId);
    }

    try {
      const response = await fetch('/api/contact/b2b/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landingId,
          leadId: currentLeadId,
          eventTypeId: form.eventTypeId,
          tenantSlug,
          companyName: form.companyName,
          companyPerson: form.companyPerson,
          email: form.email,
          phone: form.phone,
          participantEstimate: form.participantEstimate,
          preferredDate: form.preferredDate,
          message: form.message,
          marketingConsent: form.marketingConsent
        })
      });
      const payload = (await response.json().catch(() => null)) as { status?: string; error?: string } | null;
      if (!response.ok || !payload) {
        throw new Error(payload?.error ?? 'Unable to submit form');
      }
      setSuccessMessage('Thanks! We will reach out with a proposal.');
      setSubmitState('success');
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to submit form');
      setSubmitState('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-emerald-900/30 p-6 text-white">
      <div className="space-y-2">
        <div>
          <p className="text-xl font-semibold tracking-wide">{copy.headingB2B}</p>
          {copy.descriptionB2B ? <p className="text-sm text-white/80">{copy.descriptionB2B}</p> : null}
        </div>
        <ModeToggle mode={props.mode} onModeChange={props.onModeChange} copy={copy} />
      </div>
      <div className="space-y-4">
        <InputField
          label={copy.emailLabel}
          placeholder={copy.emailPlaceholder}
          type="email"
          value={form.email}
          onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
          onBlur={triggerAutosave}
          required
        />
        <InputField
          label={copy.phoneLabel}
          placeholder={copy.phonePlaceholder}
          value={form.phone}
          onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
          onBlur={triggerAutosave}
        />
        <InputField
          label={copy.companyNameLabel}
          placeholder="Company or team name"
          value={form.companyName}
          onChange={(value) => setForm((prev) => ({ ...prev, companyName: value }))}
          onBlur={triggerAutosave}
        />
        <InputField
          label={copy.contactPersonLabel}
          placeholder="Full name"
          value={form.companyPerson}
          onChange={(value) => setForm((prev) => ({ ...prev, companyPerson: value }))}
          onBlur={triggerAutosave}
        />
        {eventTypes.length === 0 ? (
          <p className="text-sm text-amber-200">No hike types are linked to this landing yet.</p>
        ) : (
          <SelectField
            label={copy.eventTypeLabel}
            value={form.eventTypeId}
            placeholder={copy.eventPlaceholder}
            options={eventTypes.map((type) => ({ value: type.id, label: type.name }))}
            disabled={eventTypes.length === 0}
            onChange={(value) => {
              setForm((prev) => ({ ...prev, eventTypeId: value }));
              void triggerAutosave();
            }}
          />
        )}
        <InputField
          label={copy.participantsLabel}
          type="number"
          min={1}
          value={String(form.participantEstimate ?? '')}
          onChange={(value) => setForm((prev) => ({ ...prev, participantEstimate: Number(value) || 0 }))}
          onBlur={triggerAutosave}
        />
        <InputField
          label={copy.preferredDateLabel}
          placeholder="e.g. May 10 or any Friday"
          value={form.preferredDate}
          onChange={(value) => setForm((prev) => ({ ...prev, preferredDate: value }))}
          onBlur={triggerAutosave}
        />
        <TextareaField
          label={copy.commentLabel}
          placeholder={copy.commentPlaceholder}
          value={form.message}
          onChange={(value) => setForm((prev) => ({ ...prev, message: value }))}
          onBlur={triggerAutosave}
        />
        <label className="flex items-start gap-2 text-xs text-white/80">
          <input
            type="checkbox"
            checked={form.marketingConsent}
            onChange={(event) => setForm((prev) => ({ ...prev, marketingConsent: event.target.checked }))}
          />
          <span>{copy.marketingConsentLabel}</span>
        </label>
      </div>
      {autoSaveState === 'error' && <p className="text-xs text-amber-200">Could not save your progress automatically.</p>}
      {errorMessage && <p className="text-sm text-red-300">{errorMessage}</p>}
      {successMessage && <p className="text-sm text-emerald-200">{successMessage}</p>}
      <Button type="submit" className="w-full bg-amber-400 text-emerald-900" disabled={submitState === 'submitting'}>
        {submitState === 'submitting' ? 'Sending…' : copy.submitLabelB2B}
      </Button>
    </form>
  );
}

function InputField({ label, ...props }: { label: string } & ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-white/90" htmlFor={props.id}>
        {label}
      </label>
      <Input {...props} className={cn('bg-white/10 text-white placeholder:text-white/40', props.className)} />
    </div>
  );
}

function TextareaField({ label, ...props }: { label: string } & ComponentProps<typeof Textarea>) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-white/90" htmlFor={props.id}>
        {label}
      </label>
      <Textarea {...props} className={cn('bg-white/10 text-white placeholder:text-white/40', props.className)} />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  placeholder,
  disabled,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1 text-sm">
      <label className="font-medium text-white/90">{label}</label>
      <div className="rounded-xl bg-white/10 px-3 py-2">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm text-white focus:outline-none"
          disabled={disabled}
        >
          {placeholder ? (
            <option value="" disabled className="bg-emerald-800 text-white/70">
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-emerald-800">
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TestimonialsPanel({ testimonials }: { testimonials: ContactTestimonial[] }) {
  const [index, setIndex] = useState(0);

  if (testimonials.length === 0) {
    return (
      <div className="hidden rounded-3xl bg-emerald-800/40 p-6 text-white lg:flex lg:flex-col lg:items-center lg:justify-center">
        <p className="text-sm text-white/70">Add testimonials in the builder to show customer love here.</p>
      </div>
    );
  }

  const active = testimonials[index % testimonials.length];

  return (
    <div className="hidden rounded-3xl bg-emerald-800/40 p-6 text-white lg:flex lg:flex-col">
      <div className="space-y-3">
          <div className="text-5xl text-amber-300">“</div>
        <p className="text-lg font-semibold leading-snug">{active.quote}</p>
        <p className="text-sm text-white/70">{active.author}</p>
      </div>
      {testimonials.length > 1 && (
        <div className="mt-6 flex items-center justify-between text-xs text-white/70">
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
            className="rounded-full border border-white/30 px-3 py-1 hover:border-white"
          >
            Prev
          </button>
          <div className="flex items-center gap-1">
            {testimonials.map((item, idx) => (
              <span
                key={item.id}
                className={cn(
                  'h-2 w-2 rounded-full border border-white/40',
                  idx === index ? 'bg-amber-300 border-amber-300' : 'bg-transparent'
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev + 1) % testimonials.length)}
            className="rounded-full border border-white/30 px-3 py-1 hover:border-white"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function computePricePreview(event: ContactEventOption | undefined, ticketCount: number) {
  if (!event) {
    return null;
  }
  const count = Math.max(ticketCount, 1);
  const now = Date.now();
  const earlyBirdActive = event.earlyBirdDeadline ? new Date(event.earlyBirdDeadline).getTime() >= now && event.earlyBirdPrice : false;

  if (earlyBirdActive && event.earlyBirdPrice) {
    return {
      strategy: 'EARLY_BIRD',
      unitPrice: event.earlyBirdPrice,
      total: event.earlyBirdPrice * count,
      earlyBirdDeadline: event.earlyBirdDeadline
    };
  }

  if (count >= 2 && event.priceGroup) {
    return {
      strategy: 'GROUP',
      unitPrice: event.priceGroup,
      total: event.priceGroup * count,
      earlyBirdDeadline: null
    };
  }

  if (event.priceSingle) {
    return {
      strategy: 'SINGLE',
      unitPrice: event.priceSingle,
      total: event.priceSingle * count,
      earlyBirdDeadline: null
    };
  }

  return null;
}
