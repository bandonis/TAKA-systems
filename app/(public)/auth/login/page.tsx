import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Log in | TAKA',
  description: 'Access your tenant dashboard.'
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 px-4 py-12">
      <div className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Welcome back</p>
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to continue</h1>
        <p className="text-muted-foreground">Manage events, participants, and analytics from one place.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use the email and password associated with your tenant.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}

