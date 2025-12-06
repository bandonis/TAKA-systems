import type { Prisma, PrismaClient } from '@prisma/client';

import { getContactFormCopy } from '@/lib/contact/copy';
import type { ContactFormConfig } from '@/lib/landings/blocks';

export type PublicContactEventOption = {
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

export type ContactResources = {
  tenantSlug: string;
  landingSlug: string;
  landingId: string;
  config: ContactFormConfig;
  events: PublicContactEventOption[];
  eventTypes: ContactEventTypeOption[];
  paymentMode: 'STRIPE' | 'MANUAL';
  currency: string;
  copy: ReturnType<typeof getContactFormCopy>;
  testimonials: ContactTestimonial[];
};

export async function buildContactResources({
  prisma,
  tenantSlug,
  landingSlug,
  tenantId,
  landingId,
  config,
  tenantSettings
}: {
  prisma: PrismaClient;
  tenantSlug: string;
  landingSlug: string;
  tenantId: string;
  landingId: string;
  config: ContactFormConfig;
  tenantSettings:
    | {
        paymentMode: string | null;
        currency: string | null;
        contactFormCopy: Prisma.JsonValue | null;
      }
    | null;
}): Promise<ContactResources> {
  const events = config.allowedEventIds.length
    ? await prisma.event.findMany({
        where: { tenantId, id: { in: config.allowedEventIds } },
        select: {
          id: true,
          title: true,
          date: true,
          earlyBirdDeadline: true,
          earlyBirdPrice: true,
          priceGroup: true,
          priceSingle: true
        },
        orderBy: { date: 'asc' }
      })
    : [];

  const eventTypes = config.allowedEventTypeIds.length
    ? await prisma.eventType.findMany({
        where: { tenantId, id: { in: config.allowedEventTypeIds } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      })
    : [];

  const dateFormatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });

  const formattedEvents: PublicContactEventOption[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    dateLabel: dateFormatter.format(event.date),
    dateISO: event.date.toISOString(),
    priceSingle: event.priceSingle ? Number(event.priceSingle) : null,
    priceGroup: event.priceGroup ? Number(event.priceGroup) : null,
    earlyBirdPrice: event.earlyBirdPrice ? Number(event.earlyBirdPrice) : null,
    earlyBirdDeadline: event.earlyBirdDeadline ? event.earlyBirdDeadline.toISOString() : null
  }));

  const formattedEventTypes: ContactEventTypeOption[] = eventTypes.map((type) => ({
    id: type.id,
    name: type.name
  }));

  const copy = getContactFormCopy(tenantSettings?.contactFormCopy);

  return {
    tenantSlug,
    landingSlug,
    landingId,
    config,
    events: formattedEvents,
    eventTypes: formattedEventTypes,
    paymentMode: (tenantSettings?.paymentMode ?? 'STRIPE') as 'STRIPE' | 'MANUAL',
    currency: tenantSettings?.currency ?? 'EUR',
    copy,
    testimonials: config.testimonials
  };
}

