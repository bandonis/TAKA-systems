import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getPrisma } from '@/lib/db';
import { getLandingContactContext } from '@/lib/contact/server';

const autosaveSchema = z.object({
  landingId: z.string().cuid(),
  eventTypeId: z.string().cuid(),
  leadId: z.string().cuid().optional(),
  companyName: z.string().max(120).optional(),
  companyPerson: z.string().max(120).optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  participantEstimate: z.number().int().min(1).max(1000).optional(),
  preferredDate: z.string().max(160).optional(),
  message: z.string().max(1000).optional(),
  marketingConsent: z.boolean().optional()
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const prisma = getPrisma();
    const body = await req.json();
    const input = autosaveSchema.parse(body);

    const context = await getLandingContactContext(prisma, input.landingId);
    if (!context) {
      return NextResponse.json({ error: 'Landing contact form not found' }, { status: 404 });
    }

    const { tenantId, config } = context;

    if (config.mode !== 'b2b') {
      return NextResponse.json({ error: 'Contact form is not in B2B mode' }, { status: 400 });
    }

    if (!config.allowedEventTypeIds.includes(input.eventTypeId)) {
      return NextResponse.json({ error: 'Event type is not allowed for this landing' }, { status: 400 });
    }

    const eventType = await prisma.eventType.findFirst({
      where: { id: input.eventTypeId, tenantId },
      select: { id: true, name: true }
    });

    if (!eventType) {
      return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
    }

    const marketingConsent = input.marketingConsent ?? true;
    let leadId = input.leadId;

    if (leadId) {
      await prisma.b2BLead.update({
        where: { id: leadId, tenantId },
        data: {
          companyName: input.companyName ?? null,
          companyPerson: input.companyPerson ?? null,
          email: input.email,
          companyEmail: input.email,
          companyPhone: input.phone ?? null,
          marketingConsent,
          participantEstimate: input.participantEstimate ?? null,
          ticketCount: input.participantEstimate ?? null,
          preferredDate: input.preferredDate ?? null,
          comment: input.message ?? null,
          eventTypeId: eventType.id,
          eventType: eventType.name,
          source: `landing:${context.landingId}`,
          status: 'DRAFT'
        }
      });
    } else {
      const created = await prisma.b2BLead.create({
        data: {
          tenantId,
          companyName: input.companyName ?? null,
          companyPerson: input.companyPerson ?? null,
          email: input.email,
          companyEmail: input.email,
          companyPhone: input.phone ?? null,
          marketingConsent,
          participantEstimate: input.participantEstimate ?? null,
          ticketCount: input.participantEstimate ?? null,
          preferredDate: input.preferredDate ?? null,
          comment: input.message ?? null,
          eventTypeId: eventType.id,
          eventType: eventType.name,
          source: `landing:${context.landingId}`,
          status: 'DRAFT'
        },
        select: { id: true }
      });
      leadId = created.id;
    }

    return NextResponse.json({ leadId });
  } catch (error) {
    console.error('B2B autosave failed', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return NextResponse.json({ error: 'Unable to autosave inquiry' }, { status: 500 });
  }
}
