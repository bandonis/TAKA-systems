"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
    tenantName: z.string().min(2, 'Tenant name must be at least 2 characters')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export function RegisterTenantForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: (formData.get('name') as string | null)?.trim() ?? '',
      email: (formData.get('email') as string | null)?.trim() ?? '',
      password: (formData.get('password') as string | null) ?? '',
      confirmPassword: (formData.get('confirmPassword') as string | null) ?? '',
      tenantName: (formData.get('tenantName') as string | null)?.trim() ?? ''
    };

    const parsed = formSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form fields and try again.');
      return;
    }

    const registrationName = splitFullName(parsed.data.name);

    setIsSubmitting(true);
    const body = {
      tenantName: parsed.data.tenantName,
      adminEmail: parsed.data.email,
      adminPassword: parsed.data.password,
      language: 'en',
      ...(registrationName.firstName ? { adminFirstName: registrationName.firstName } : {}),
      ...(registrationName.lastName ? { adminLastName: registrationName.lastName } : {})
    };

    try {
      const response = await fetch('/api/auth/register-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'Unable to register tenant.');
        setIsSubmitting(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Tenant registration failed', err);
      setError('Unexpected error. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name" requiredIndicator>
          Your name
        </Label>
        <Input id="name" name="name" placeholder="Laura Jansone" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email" requiredIndicator>
          Work email
        </Label>
        <Input id="email" name="email" type="email" placeholder="laura@example.com" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="tenantName" requiredIndicator>
          Tenant / team name
        </Label>
        <Input id="tenantName" name="tenantName" placeholder="North Ridge Adventures" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password" requiredIndicator>
          Password
        </Label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword" requiredIndicator>
          Confirm password
        </Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating tenant...' : 'Create tenant'}
      </Button>
    </form>
  );
}

function splitFullName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: undefined, lastName: undefined };
  }

  const [firstName, ...rest] = trimmed.split(/\s+/);
  const lastName = rest.length > 0 ? rest.join(' ') : undefined;
  return { firstName, lastName };
}

