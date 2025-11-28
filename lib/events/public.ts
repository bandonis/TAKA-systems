import { getPrisma } from '@/lib/db';

type TenantSummary = {
  id: string;
  name: string;
  primaryColor: string | null;
  language: string | null;
};

type EventSummary = {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  date: Date;
  time: string | null;
  location: string | null;
  guideName: string | null;
  priceSingle: unknown;
  priceGroup: unknown;
  earlyBirdPrice: unknown;
  earlyBirdDeadline: Date | null;
  visibility: string;
};

export type PublicEvent = ReturnType<typeof serializeEventForPublic>;

/**
 * Temporary helper that treats tenantSlug as either the tenant ID or the tenant name.
 * Once dedicated slug fields are introduced, this lookup can be tightened.
 */
export async function getTenantBySlug(tenantSlug: string): Promise<TenantSummary | null> {
  const prisma = getPrisma();

  return prisma.tenant.findFirst({
    where: {
      OR: [{ id: tenantSlug }, { name: tenantSlug }]
    },
    select: {
      id: true,
      name: true,
      primaryColor: true,
      language: true
    }
  });
}

/**
 * Resolves an event by slug (currently matching ID or title for flexibility) within a tenant.
 */
export async function getEventBySlug(tenantId: string, eventSlug: string): Promise<EventSummary | null> {
  const prisma = getPrisma();

  return prisma.event.findFirst({
    where: {
      tenantId,
      OR: [{ id: eventSlug }, { title: eventSlug }]
    },
    select: {
      id: true,
      tenantId: true,
      title: true,
      description: true,
      date: true,
      time: true,
      location: true,
      guideName: true,
      priceSingle: true,
      priceGroup: true,
      earlyBirdPrice: true,
      earlyBirdDeadline: true,
      visibility: true
    }
  });
}

export function serializeEventForPublic(event: EventSummary) {
  return {
    id: event.id,
    tenantId: event.tenantId,
    title: event.title,
    description: event.description ?? '',
    date: event.date,
    time: event.time ?? null,
    location: event.location ?? 'To be announced',
    guideName: event.guideName ?? null,
    priceSingle: event.priceSingle ? Number(event.priceSingle) : null,
    priceGroup: event.priceGroup ? Number(event.priceGroup) : null,
    earlyBirdPrice: event.earlyBirdPrice ? Number(event.earlyBirdPrice) : null,
    earlyBirdDeadline: event.earlyBirdDeadline,
    visibility: event.visibility
  };
}

