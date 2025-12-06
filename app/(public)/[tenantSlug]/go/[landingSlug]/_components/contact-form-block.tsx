"use client";

import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';

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

export type ContactTestimonial = ContactFormConfig['testimonials'][number];

type ContactFormBlockProps = {
  tenantSlug: string;
  landingSlug: string;
  landingId: string;
  config: ContactFormConfig;
  events: ContactEventOption[];
  paymentMode: 'STRIPE' | 'MANUAL';
  currency: string;
  copy: ContactFormCopy;
  testimonials: ContactTestimonial[];
};

export function ContactFormBlock(props: ContactFormBlockProps) {
  const [mode, setMode] = useState<ContactFormConfig['mode']>(props.config.mode);
  return (
    <section
      id="contact"
      className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-900/70 via-emerald-900/80 to-slate-900/70 p-6 text-white shadow-[0_30px_80px_-40px_rgba(6,78,59,0.8)] lg:p-10"
    >
      <div className="mb-8 flex flex-col gap-2 text-sm uppercase tracking-[0.45em] text-emerald-100/70">
        <span>Get in touch</span>
        <div className="h-px w-12 bg-emerald-300/60" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(260px,320px),minmax(0,1fr)]">
        <TestimonialsPanel testimonials={props.testimonials} />
        {mode === 'b2c' ? (
          <B2CForm {...props} mode={mode} onModeChange={setMode} />
        ) : (
          <B2BForm {...props} mode={mode} onModeChange={setMode} />
        )}
      </div>
    </section>
  );
}

type ModeToggleProps = {
  mode: ContactFormConfig['mode'];
  onModeChange: (mode: ContactFormConfig['mode']) => void;
  copy: ContactFormCopy;
};

function ModeToggle({ mode, onModeChange, copy }: ModeToggleProps) {
  return (
    <div className="inline-flex rounded-full bg-white/10 p-1 text-xs font-semibold shadow-inner">
      <button
        type="button"
        className={cn(
          'flex items-center gap-2 rounded-full px-4 py-1 transition',
          mode === 'b2b'
            ? 'bg-white text-emerald-900 shadow-lg'
            : 'text-white/80 hover:text-white'
        )}
        onClick={() => onModeChange('b2b')}
      >
        {copy.modeLabelB2B}
      </button>
      <button
        type="button"
        className={cn(
          'flex items-center gap-2 rounded-full px-4 py-1 transition',
          mode === 'b2c'
            ? 'bg-white text-emerald-900 shadow-lg'
            : 'text-white/80 hover:text-white'
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

  useEffect(() => {
    setForm((previous) => {
      if (events.length === 0) {
        return previous.eventId === '' ? previous : { ...previous, eventId: '' };
      }
      const stillValid = events.some((event) => event.id === previous.eventId);
      if (stillValid) {
        return previous;
      }
      return { ...previous, eventId: events[0].id };
    });
  }, [events]);

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

  const hasEvents = events.length > 0;

  const shouldAutosave = () => form.email.trim().length > 0 && Boolean(form.eventId);

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
    if (!hasEvents) {
      setErrorMessage('No hikes are available right now. Please check back soon.');
      setSubmitState('error');
      return;
    }
    if (!form.eventId) {
      setErrorMessage('Select a hike date to continue.');
      setSubmitState('error');
      return;
    }
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
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          onBlur={triggerAutosave}
        />
        <InputField
          label={copy.emailLabel}
          placeholder={copy.emailPlaceholder}
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          onBlur={triggerAutosave}
          required
        />
        <InputField
          label={copy.phoneLabel}
          placeholder={copy.phonePlaceholder}
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
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
            onChange={(event) => {
              const parsed = Number(event.target.value) || 1;
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
          onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
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
      <Button
        type="submit"
        className="w-full bg-amber-400 text-emerald-900"
        disabled={submitState === 'submitting' || !hasEvents}
      >
        {submitState === 'submitting' ? 'Submitting…' : copy.submitLabelB2C}
      </Button>
    </form>
  );
}

function B2BForm(
  props: ContactFormBlockProps & { mode: ContactFormConfig['mode']; onModeChange: (mode: ContactFormConfig['mode']) => void }
) {
  const { config, landingId, tenantSlug, landingSlug, copy } = props;
  const hikeTypeEnabled = config.showHikeTypeField && config.hikeTypeOptions.length > 0;
  const hikeTypeLabel = config.hikeTypeLabel || copy.eventTypeLabel;
  const hikeTypeOptions = hikeTypeEnabled ? config.hikeTypeOptions : [];
  const [leadId, setLeadId] = useState<string | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState<{
    requestedHikeType: string;
    companyName: string;
    companyPerson: string;
    email: string;
    phone: string;
    participantEstimate: number | null;
    preferredDate: string;
    message: string;
    marketingConsent: boolean;
  }>({
    requestedHikeType: '',
    companyName: '',
    companyPerson: '',
    email: '',
    phone: '',
    participantEstimate: 20,
    preferredDate: '',
    message: '',
    marketingConsent: true
  });

  useEffect(() => {
    setForm((previous) => {
      if (!hikeTypeEnabled) {
        return previous.requestedHikeType === '' ? previous : { ...previous, requestedHikeType: '' };
      }
      if (previous.requestedHikeType && hikeTypeOptions.includes(previous.requestedHikeType)) {
        return previous;
      }
      return { ...previous, requestedHikeType: '' };
    });
  }, [hikeTypeEnabled, hikeTypeOptions.join('|')]);

  const shouldAutosave = () => form.email.trim().length > 0;

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
          leadId,
          companyName: form.companyName,
          companyPerson: form.companyPerson,
          email: form.email,
          phone: form.phone,
          ...(form.participantEstimate != null ? { participantEstimate: form.participantEstimate } : {}),
          preferredDate: form.preferredDate,
          message: form.message,
          marketingConsent: form.marketingConsent,
          requestedHikeType: form.requestedHikeType || undefined
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
    if (hikeTypeEnabled && !form.requestedHikeType) {
      setErrorMessage('Select a hike type to continue.');
      setSubmitState('error');
      return;
    }
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
          tenantSlug,
          companyName: form.companyName,
          companyPerson: form.companyPerson,
          email: form.email,
          phone: form.phone,
          ...(form.participantEstimate != null ? { participantEstimate: form.participantEstimate } : {}),
          preferredDate: form.preferredDate,
          message: form.message,
          marketingConsent: form.marketingConsent,
          requestedHikeType: form.requestedHikeType || undefined
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
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          onBlur={triggerAutosave}
          required
        />
        <InputField
          label={copy.phoneLabel}
          placeholder={copy.phonePlaceholder}
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          onBlur={triggerAutosave}
        />
        <InputField
          label={copy.companyNameLabel}
          placeholder="Company or team name"
          value={form.companyName}
          onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
          onBlur={triggerAutosave}
        />
        <InputField
          label={copy.contactPersonLabel}
          placeholder="Full name"
          value={form.companyPerson}
          onChange={(event) => setForm((prev) => ({ ...prev, companyPerson: event.target.value }))}
          onBlur={triggerAutosave}
        />
        {config.showHikeTypeField ? (
          hikeTypeEnabled ? (
            <SelectField
              label={hikeTypeLabel}
              value={form.requestedHikeType}
              placeholder={copy.eventPlaceholder}
              options={hikeTypeOptions.map((option) => ({ value: option, label: option }))}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, requestedHikeType: value }));
                void triggerAutosave();
              }}
            />
          ) : (
            <p className="text-sm text-amber-200">
              Add at least one hike type option in the builder to show a dropdown here.
            </p>
          )
        ) : null}
        <InputField
          label={copy.participantsLabel}
          type="number"
          min={1}
          value={String(form.participantEstimate ?? '')}
          onChange={(event) => {
            const raw = event.target.value;
            const parsed = Number(raw);
            setForm((prev) => ({
              ...prev,
              participantEstimate:
                raw.trim().length === 0 || Number.isNaN(parsed) ? null : Math.max(1, parsed)
            }));
          }}
          onBlur={triggerAutosave}
        />
        <InputField
          label={copy.preferredDateLabel}
          placeholder="e.g. May 10 or any Friday"
          value={form.preferredDate}
          onChange={(event) => setForm((prev) => ({ ...prev, preferredDate: event.target.value }))}
          onBlur={triggerAutosave}
        />
        <TextareaField
          label={copy.commentLabel}
          placeholder={copy.commentPlaceholder}
          value={form.message}
          onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
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
      <Button
        type="submit"
        className="w-full bg-amber-400 text-emerald-900"
        disabled={submitState === 'submitting'}
      >
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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/5 p-6 text-center text-white/70">
        <p className="text-sm">Add testimonials in the builder to show customer love here.</p>
      </div>
    );
  }

  const active = testimonials[index % testimonials.length];

  return (
    <div className="flex flex-col rounded-2xl border border-white/15 bg-white/5 p-5 text-white shadow-inner">
      <div className="space-y-4">
        <div className="text-5xl leading-none text-emerald-200">&ldquo;</div>
        <p className="text-lg font-semibold leading-relaxed text-white">{active.quote}</p>
        <p className="text-sm font-medium text-white/70">— {active.author}</p>
      </div>
      {testimonials.length > 1 && (
        <div className="mt-6 flex items-center justify-between text-xs text-white/70">
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
            className="rounded-full border border-white/30 px-3 py-1 hover:border-white/80"
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
            className="rounded-full border border-white/30 px-3 py-1 hover:border-white/80"
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
