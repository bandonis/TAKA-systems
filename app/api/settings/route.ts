import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { getPrisma } from '@/lib/db';
import { withTenantRoute, NotFoundError } from '@/lib/tenants';
import {
  billingProfileSchema,
  extractBillingProfileFromConfig,
  mergeBillingProfileIntoConfig
} from '@/lib/tenant-settings/billing-profile';

export const runtime = "nodejs";

// Synced TenantSettings select fields with schema by persisting billing profile in analyticsConfig.
const tenantSettingsSelect = {
  analyticsConfig: true,
  updatedAt: true
};

export const GET = withTenantRoute(
  async ({ tenant }) => {
    const prisma = getPrisma();
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.tenantId },
      select: tenantSettingsSelect
    });

    if (!settings) {
      throw new NotFoundError('Tenant settings not found');
    }

    const billingProfile = extractBillingProfileFromConfig(settings.analyticsConfig);
    return NextResponse.json({ settings: billingProfile });
  },
  { onError: 'Unable to load tenant settings' }
);

export const PATCH = withTenantRoute(
  async ({ tenant, req }) => {
    const prisma = getPrisma();
    const data = await req.json();
    const input = billingProfileSchema.parse(data);

    const existingSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.tenantId },
      select: { analyticsConfig: true }
    });

    if (!existingSettings) {
      throw new NotFoundError('Tenant settings not found');
    }

    const analyticsConfig = mergeBillingProfileIntoConfig(existingSettings.analyticsConfig, input);

    const settings = await prisma.tenantSettings.update({
      where: { tenantId: tenant.tenantId },
      data: {
        analyticsConfig: analyticsConfig as Prisma.InputJsonValue
      },
      select: tenantSettingsSelect
    });

    const billingProfile = extractBillingProfileFromConfig(settings.analyticsConfig);
    return NextResponse.json({ settings: billingProfile });
  },
  { onError: 'Unable to update tenant settings' }
);

