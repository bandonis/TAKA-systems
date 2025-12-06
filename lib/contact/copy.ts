import type { Prisma } from '@prisma/client';

export type ContactFormCopy = {
  nameLabel: string;
  namePlaceholder: string;
  headingB2C: string;
  headingB2B: string;
  descriptionB2C: string;
  descriptionB2B: string;
  modeLabelB2B: string;
  modeLabelB2C: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  eventLabel: string;
  eventPlaceholder: string;
  eventTypeLabel: string;
  ticketCountLabel: string;
  totalLabel: string;
  earlyBirdLabel: string;
  commentLabel: string;
  commentPlaceholder: string;
  companyNameLabel: string;
  contactPersonLabel: string;
  participantsLabel: string;
  preferredDateLabel: string;
  submitLabelB2C: string;
  submitLabelB2B: string;
  marketingConsentLabel: string;
  manualDisclaimer: string;
};

const DEFAULT_COPY: ContactFormCopy = {
  nameLabel: 'Full name',
  namePlaceholder: 'Your name',
  headingB2C: 'Get ready for your next adventure',
  headingB2B: 'Plan a private hike for your team',
  descriptionB2C: 'Choose a date and tell us who is joining. We will confirm the details right away.',
  descriptionB2B: 'Share a few details about your company event and we will get back with a custom plan.',
  modeLabelB2B: 'For companies',
  modeLabelB2C: 'For individuals',
  emailLabel: 'Email',
  emailPlaceholder: 'you@example.com',
  phoneLabel: 'Phone number',
  phonePlaceholder: '+371 20000000',
  eventLabel: 'Upcoming hikes',
  eventPlaceholder: 'Select a hike',
  eventTypeLabel: 'Hike type',
  ticketCountLabel: 'Ticket count',
  totalLabel: 'Total',
  earlyBirdLabel: 'Early bird price valid until {date}',
  commentLabel: 'Comment',
  commentPlaceholder: 'Anything we should know?',
  companyNameLabel: 'Company name',
  contactPersonLabel: 'Contact person',
  participantsLabel: 'Participants',
  preferredDateLabel: 'Preferred date',
  submitLabelB2C: 'Register',
  submitLabelB2B: 'Send inquiry',
  marketingConsentLabel: 'Keep me posted about future hikes and special offers.',
  manualDisclaimer: 'We will confirm your booking by email.'
};

export function getContactFormCopy(value?: Prisma.JsonValue | null): ContactFormCopy {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_COPY;
  }
  const copy = value as Partial<ContactFormCopy>;
  return {
    nameLabel: copy.nameLabel ?? DEFAULT_COPY.nameLabel,
    namePlaceholder: copy.namePlaceholder ?? DEFAULT_COPY.namePlaceholder,
    headingB2C: copy.headingB2C ?? DEFAULT_COPY.headingB2C,
    headingB2B: copy.headingB2B ?? DEFAULT_COPY.headingB2B,
    descriptionB2C: copy.descriptionB2C ?? DEFAULT_COPY.descriptionB2C,
    descriptionB2B: copy.descriptionB2B ?? DEFAULT_COPY.descriptionB2B,
    modeLabelB2B: copy.modeLabelB2B ?? DEFAULT_COPY.modeLabelB2B,
    modeLabelB2C: copy.modeLabelB2C ?? DEFAULT_COPY.modeLabelB2C,
    emailLabel: copy.emailLabel ?? DEFAULT_COPY.emailLabel,
    emailPlaceholder: copy.emailPlaceholder ?? DEFAULT_COPY.emailPlaceholder,
    phoneLabel: copy.phoneLabel ?? DEFAULT_COPY.phoneLabel,
    phonePlaceholder: copy.phonePlaceholder ?? DEFAULT_COPY.phonePlaceholder,
    eventLabel: copy.eventLabel ?? DEFAULT_COPY.eventLabel,
    eventPlaceholder: copy.eventPlaceholder ?? DEFAULT_COPY.eventPlaceholder,
    eventTypeLabel: copy.eventTypeLabel ?? DEFAULT_COPY.eventTypeLabel,
    ticketCountLabel: copy.ticketCountLabel ?? DEFAULT_COPY.ticketCountLabel,
    totalLabel: copy.totalLabel ?? DEFAULT_COPY.totalLabel,
    earlyBirdLabel: copy.earlyBirdLabel ?? DEFAULT_COPY.earlyBirdLabel,
    commentLabel: copy.commentLabel ?? DEFAULT_COPY.commentLabel,
    commentPlaceholder: copy.commentPlaceholder ?? DEFAULT_COPY.commentPlaceholder,
    companyNameLabel: copy.companyNameLabel ?? DEFAULT_COPY.companyNameLabel,
    contactPersonLabel: copy.contactPersonLabel ?? DEFAULT_COPY.contactPersonLabel,
    participantsLabel: copy.participantsLabel ?? DEFAULT_COPY.participantsLabel,
    preferredDateLabel: copy.preferredDateLabel ?? DEFAULT_COPY.preferredDateLabel,
    submitLabelB2C: copy.submitLabelB2C ?? DEFAULT_COPY.submitLabelB2C,
    submitLabelB2B: copy.submitLabelB2B ?? DEFAULT_COPY.submitLabelB2B,
    marketingConsentLabel: copy.marketingConsentLabel ?? DEFAULT_COPY.marketingConsentLabel,
    manualDisclaimer: copy.manualDisclaimer ?? DEFAULT_COPY.manualDisclaimer
  };
}

export function mergeContactFormCopy(
  existing: Prisma.JsonValue | null | undefined,
  updates: Partial<ContactFormCopy>
): ContactFormCopy {
  const current = getContactFormCopy(existing);
  return {
    ...current,
    ...updates
  };
}

export const CONTACT_FORM_COPY_DEFAULTS = DEFAULT_COPY;
