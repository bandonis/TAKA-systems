import type { PrismaClient } from '@prisma/client';
import { ConsentType } from '@prisma/client';

export async function recordMarketingConsent(args: {
  prisma: PrismaClient;
  tenantId: string;
  email: string;
  eventId?: string | null;
  landingId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const { prisma, tenantId, email, eventId, landingId, ip, userAgent } = args;

  await prisma.consent.create({
    data: {
      tenantId,
      eventId: eventId ?? null,
      email,
      consentType: ConsentType.GDPR,
      contentSnapshot: {
        source: 'landing-contact',
        landingId
      },
      ip: ip ?? null,
      userAgent: userAgent ?? null,
      signedAt: new Date()
    }
  });
}
