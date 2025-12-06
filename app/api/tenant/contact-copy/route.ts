import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getPrisma } from '@/lib/db';
import { getContactFormCopy, mergeContactFormCopy, type ContactFormCopy } from '@/lib/contact/copy';
import { withTenantRoute, NotFoundError } from '@/lib/tenants';

export const runtime = "nodejs";

const copySchema = z.object({
  nameLabel: z.string().max(80).optional(),
  namePlaceholder: z.string().max(120).optional(),
  headingB2C: z.string().max(160).optional(),
  headingB2B: z.string().max(160).optional(),
  descriptionB2C: z.string().max(240).optional(),
  descriptionB2B: z.string().max(240).optional(),
  modeLabelB2B: z.string().max(80).optional(),
  modeLabelB2C: z.string().max(80).optional(),
  emailLabel: z.string().max(80).optional(),
  emailPlaceholder: z.string().max(120).optional(),
  phoneLabel: z.string().max(80).optional(),
  phonePlaceholder: z.string().max(120).optional(),
  eventLabel: z.string().max(80).optional(),
  eventPlaceholder: z.string().max(120).optional(),
  eventTypeLabel: z.string().max(80).optional(),
  ticketCountLabel: z.string().max(80).optional(),
  totalLabel: z.string().max(80).optional(),
  earlyBirdLabel: z.string().max(160).optional(),
  commentLabel: z.string().max(80).optional(),
  commentPlaceholder: z.string().max(200).optional(),
  companyNameLabel: z.string().max(80).optional(),
  contactPersonLabel: z.string().max(80).optional(),
  participantsLabel: z.string().max(80).optional(),
  preferredDateLabel: z.string().max(80).optional(),
  submitLabelB2C: z.string().max(80).optional(),
  submitLabelB2B: z.string().max(80).optional(),
  marketingConsentLabel: z.string().max(200).optional(),
  manualDisclaimer: z.string().max(200).optional()
});

export const GET = withTenantRoute(async ({ tenant }) => {
  const prisma = getPrisma();
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId: tenant.tenantId },
    select: { contactFormCopy: true }
  });

  if (!settings) {
    throw new NotFoundError('Tenant settings not found');
  }

  const copy = getContactFormCopy(settings.contactFormCopy);
  return NextResponse.json({ copy });
}, { onError: 'Unable to load contact form wording' });

export const PATCH = withTenantRoute(async ({ tenant, req }) => {
  const prisma = getPrisma();
  const data = await req.json();
  const input = copySchema.parse(data) as Partial<ContactFormCopy>;

  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId: tenant.tenantId },
    select: { contactFormCopy: true }
  });

  if (!settings) {
    throw new NotFoundError('Tenant settings not found');
  }

  const merged = mergeContactFormCopy(settings.contactFormCopy, input);

  await prisma.tenantSettings.update({
    where: { tenantId: tenant.tenantId },
    data: { contactFormCopy: merged }
  });

  return NextResponse.json({ copy: merged });
}, { onError: 'Unable to update contact form wording' });
