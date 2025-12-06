import { redirect } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSession } from '@/lib/auth/cookies';
import { getPrisma } from '@/lib/db';
import { getContactFormCopy } from '@/lib/contact/copy';
import { getTenantPublicSlug } from '@/lib/tenant/urls';
import { extractBillingProfileFromConfig } from '@/lib/tenant-settings/billing-profile';
import type { BillingProfileFormValues } from './_components/billing-profile-form';
import { BillingProfileForm } from './_components/billing-profile-form';
import { TenantNameForm } from './_components/tenant-name-form';
import { TenantSlugForm } from './_components/tenant-slug-form';
import { ContactFormCopyForm } from './_components/contact-form-copy-form';
import { PaymentModeForm } from './_components/payment-mode-form';

export default async function SettingsPage() {
  const session = await getSession();

  if (!session?.tenantId) {
    redirect('/');
  }

  const prisma = getPrisma();

  const [tenant, settings] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { id: true, name: true, slug: true }
    }),
    prisma.tenantSettings.findUnique({
      where: { tenantId: session.tenantId },
      select: { analyticsConfig: true, contactFormCopy: true, paymentMode: true }
    })
  ]);

  if (!tenant) {
    redirect('/');
  }

  const billingProfile: BillingProfileFormValues = extractBillingProfileFromConfig(settings?.analyticsConfig ?? {});
  const contactCopy = getContactFormCopy(settings?.contactFormCopy);
  const slugData = {
    slug: tenant.slug,
    publicSlug: getTenantPublicSlug(tenant)
  };

  return (
    <section className="space-y-6 pb-20 lg:pb-0">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Settings</p>
        <h1 className="text-3xl font-semibold tracking-tight">Tenant preferences</h1>
        <p className="text-muted-foreground">Configure branding, billing details, and future notification options.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Team name</CardTitle>
          <CardDescription>Shown to participants across emails, invoices, and payment receipts.</CardDescription>
        </CardHeader>
        <CardContent>
          <TenantNameForm initialName={tenant.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment mode</CardTitle>
          <CardDescription>Decide whether landing registrations pay via Stripe immediately or are handled manually.</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentModeForm initialMode={(settings?.paymentMode as 'STRIPE' | 'MANUAL') ?? 'STRIPE'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact form wording</CardTitle>
          <CardDescription>Customize the labels and helper text shown on landing contact forms.</CardDescription>
        </CardHeader>
        <CardContent>
          <ContactFormCopyForm initialCopy={contactCopy} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Public slug</CardTitle>
          <CardDescription>Used inside landing page URLs like /your-slug/go/landing-name.</CardDescription>
        </CardHeader>
        <CardContent>
          <TenantSlugForm initialSlug={slugData.slug} publicSlug={slugData.publicSlug} />
        </CardContent>
      </Card>

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
