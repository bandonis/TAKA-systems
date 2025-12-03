import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchTenantApi } from '@/lib/tenant/api';
import { normalizeBillingProfile } from '@/lib/tenant-settings/billing-profile';
import type { BillingProfileFormValues } from './_components/billing-profile-form';
import { BillingProfileForm } from './_components/billing-profile-form';

type TenantSettingsResponse = {
  settings: BillingProfileFormValues;
};

export default async function SettingsPage() {
  const { settings } = await fetchTenantApi<TenantSettingsResponse>('/api/settings');
  const billingProfile = normalizeBillingProfile(settings);

  return (
    <section className="space-y-6 pb-20 lg:pb-0">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Settings</p>
        <h1 className="text-3xl font-semibold tracking-tight">Tenant preferences</h1>
        <p className="text-muted-foreground">Configure branding, billing details, and future notification options.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Keep your look consistent across landing pages and receipts.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Brand presets editing will be available in the next sprint.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Billing profile</CardTitle>
          <CardDescription>These details appear on invoices, receipts, and payment confirmations.</CardDescription>
        </CardHeader>
        <CardContent>
          <BillingProfileForm initialValues={billingProfile} />
        </CardContent>
      </Card>
    </section>
  );
}
