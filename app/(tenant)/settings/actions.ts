"use server";

import { Prisma } from '@prisma/client';

import { getSession } from '@/lib/auth/cookies';
import { getPrisma } from '@/lib/db';
import {
  billingProfileSchema,
  extractBillingProfileFromConfig,
  mergeBillingProfileIntoConfig,
  type BillingProfile
} from '@/lib/tenant-settings/billing-profile';

export async function updateBillingProfile(values: BillingProfile) {
  const session = await getSession();
  if (!session?.tenantId) {
    throw new Error('Unauthorized');
  }

  const prisma = getPrisma();
  const input = billingProfileSchema.parse(values);

  const existingSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId: session.tenantId },
    select: { analyticsConfig: true }
  });

  if (!existingSettings) {
    throw new Error('Tenant settings not found');
  }

  const analyticsConfig = mergeBillingProfileIntoConfig(existingSettings.analyticsConfig, input);

  const updatedSettings = await prisma.tenantSettings.update({
    where: { tenantId: session.tenantId },
    data: {
      analyticsConfig: analyticsConfig as Prisma.InputJsonValue
    },
    select: { analyticsConfig: true }
  });

  return extractBillingProfileFromConfig(updatedSettings.analyticsConfig);
}

