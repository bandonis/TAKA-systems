import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { RegisterTenantForm } from './register-form';

export const metadata: Metadata = {
  title: 'Register your tenant | TAKA',
  description: 'Create a new tenant workspace and invite your team.'
};

export default function RegisterTenantPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-4 py-12">
      <div className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Start organizing adventures</p>
        <h1 className="text-3xl font-semibold tracking-tight">Create your tenant</h1>
        <p className="text-muted-foreground">
          Set up the workspace, invite your teammates, and manage events from one cockpit.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant details</CardTitle>
          <CardDescription>We’ll use this information to personalize your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterTenantForm />
        </CardContent>
      </Card>
    </div>
  );
}


