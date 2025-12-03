import type { Prisma, PrismaClient } from '@prisma/client';

import {
  createParticipantRegistrationDefaults,
  mergeParticipantRegistrationDefaultsIntoConfig
} from '@/lib/tenant-settings/billing-profile';

type SyncParticipantDefaultsParams = {
  prisma: PrismaClient;
  tenantId: string;
  name?: string | null;
  email?: string | null;
};

export async function syncParticipantRegistrationDefaults({
  prisma,
  tenantId,
  name,
  email
}: SyncParticipantDefaultsParams) {
  const defaults = createParticipantRegistrationDefaults({ name, email });
  if (!defaults || !defaults.billingEmail) {
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      tenantId,
      email: defaults.billingEmail
    },
    select: { id: true }
  });

  if (!user) {
    return;
  }

  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
    select: { analyticsConfig: true }
  });

  if (!settings) {
    return;
  }

  const analyticsConfig = mergeParticipantRegistrationDefaultsIntoConfig(settings.analyticsConfig, defaults);
  if (!analyticsConfig) {
    return;
  }

  await prisma.tenantSettings.update({
    where: { tenantId },
    data: { analyticsConfig: analyticsConfig as Prisma.InputJsonValue }
  });
}


