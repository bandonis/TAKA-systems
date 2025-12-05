"use client";

import { useState, useTransition } from 'react';
import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRY_OPTIONS } from '@/lib/constants/countries';
import { BILLING_LEGAL_TYPE, type BillingLegalType } from '@/lib/prisma/enums';
import type { BillingProfile } from '@/lib/tenant-settings/billing-profile';
import { updateBillingProfile } from '../actions';

export type BillingProfileFormValues = BillingProfile;

type BillingProfileFormProps = {
  initialValues: BillingProfileFormValues;
};

export function BillingProfileForm({ initialValues }: BillingProfileFormProps) {
  const [legalType, setLegalType] = useState<BillingLegalType>(initialValues.legalType);
  const [isVatPayer, setIsVatPayer] = useState(initialValues.isVatPayer);
  const [billingCountry, setBillingCountry] = useState(initialValues.billingCountry ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const payload: BillingProfileFormValues = {
      legalType,
      firstName: getNullableInput(formData, 'firstName'),
      lastName: getNullableInput(formData, 'lastName'),
      legalName: getNullableInput(formData, 'legalName'),
      registrationNumber: getNullableInput(formData, 'registrationNumber'),
      isVatPayer,
      vatNumber: getNullableInput(formData, 'vatNumber'),
      vatRate: parseNumberInput(formData, 'vatRate'),
      billingAddressLine1: (formData.get('billingAddressLine1') as string | null)?.trim() ?? '',
      billingAddressLine2: getNullableInput(formData, 'billingAddressLine2'),
      billingCity: getNullableInput(formData, 'billingCity'),
      billingPostcode: getNullableInput(formData, 'billingPostcode'),
      billingCountry: billingCountry ?? '',
      billingEmail: (formData.get('billingEmail') as string | null)?.trim() ?? '',
      billingPhone: getExactInput(formData, 'billingPhone')
    };

    if (legalType === BILLING_LEGAL_TYPE.INDIVIDUAL) {
      if (!payload.firstName) {
        setError('Name is required for individuals');
        return;
      }
      if (!payload.lastName) {
        setError('Surname is required for individuals');
        return;
      }
    } else {
      if (!payload.legalName) {
        setError('Legal name is required for companies');
        return;
      }
      if (!payload.registrationNumber) {
        setError('Registration number is required for companies');
        return;
      }
    }

    if (!payload.billingCountry) {
      setError('Country is required');
      return;
    }

    if (!payload.billingEmail) {
      setError('Billing email is required');
      return;
    }

    if (isVatPayer && !payload.vatNumber) {
      setError('VAT number is required when VAT payer');
      return;
    }

    startTransition(() => {
      updateBillingProfile(payload)
        .then((updated) => {
          setSuccess('Billing profile saved');
          setLegalType(updated.legalType);
          setIsVatPayer(updated.isVatPayer);
          setBillingCountry(updated.billingCountry ?? '');
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Unable to save billing profile');
        });
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="legalType" requiredIndicator>
            Legal type
          </Label>
          <Select value={legalType} onValueChange={(value: BillingLegalType) => setLegalType(value)}>
            <SelectTrigger id="legalType">
              <SelectValue placeholder="Select legal type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={BILLING_LEGAL_TYPE.COMPANY}>Company</SelectItem>
              <SelectItem value={BILLING_LEGAL_TYPE.INDIVIDUAL}>Individual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {legalType === BILLING_LEGAL_TYPE.INDIVIDUAL ? (
          <div className="grid gap-2">
            <Label htmlFor="firstName" requiredIndicator>
              Name
            </Label>
            <Input
              id="firstName"
              name="firstName"
              defaultValue={initialValues.firstName ?? ''}
              placeholder="Laura"
              required={legalType === BILLING_LEGAL_TYPE.INDIVIDUAL}
            />
          </div>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="legalName" requiredIndicator>
              Legal name
            </Label>
            <Input
              id="legalName"
              name="legalName"
              defaultValue={initialValues.legalName ?? ''}
              placeholder="Summit Trails LLC"
              required={legalType === BILLING_LEGAL_TYPE.COMPANY}
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {legalType === BILLING_LEGAL_TYPE.INDIVIDUAL ? (
          <div className="grid gap-2">
            <Label htmlFor="lastName" requiredIndicator>
              Surname
            </Label>
            <Input
              id="lastName"
              name="lastName"
              defaultValue={initialValues.lastName ?? ''}
              placeholder="Johnson"
              required={legalType === BILLING_LEGAL_TYPE.INDIVIDUAL}
            />
          </div>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="registrationNumber" requiredIndicator>
              Registration number
            </Label>
            <Input
              id="registrationNumber"
              name="registrationNumber"
              defaultValue={initialValues.registrationNumber ?? ''}
              placeholder="Enter registration number"
            />
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="billingEmail" requiredIndicator>
            {legalType === BILLING_LEGAL_TYPE.INDIVIDUAL ? 'Contact email' : 'Company email'}
          </Label>
          <Input
            id="billingEmail"
            name="billingEmail"
            type="email"
            defaultValue={initialValues.billingEmail}
            placeholder="billing@alpinehq.com"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-md border border-input p-4">
        <div>
          <Label htmlFor="isVatPayer">VAT payer</Label>
        </div>
        <input
          id="isVatPayer"
          name="isVatPayer"
          type="checkbox"
          className="h-5 w-5 rounded border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          checked={isVatPayer}
          onChange={(event) => setIsVatPayer(event.target.checked)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="vatNumber" requiredIndicator={isVatPayer}>
            VAT number
          </Label>
          <Input
            id="vatNumber"
            name="vatNumber"
            defaultValue={initialValues.vatNumber ?? ''}
            placeholder="Enter VAT number"
            disabled={!isVatPayer}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="vatRate">VAT rate (%)</Label>
          <Input
            id="vatRate"
            name="vatRate"
            type="number"
            step="0.1"
            min="0"
            max="100"
            defaultValue={initialValues.vatRate ?? ''}
            placeholder="21.0"
            disabled={!isVatPayer}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="billingCountry" requiredIndicator>
            Country
          </Label>
          <Select value={billingCountry || undefined} onValueChange={(value) => setBillingCountry(value)}>
            <SelectTrigger id="billingCountry">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_OPTIONS.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="billingAddressLine1" requiredIndicator>
            Address line 1
          </Label>
          <Input
            id="billingAddressLine1"
            name="billingAddressLine1"
            defaultValue={initialValues.billingAddressLine1}
            placeholder="42 Baker Street"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="billingAddressLine2">Address line 2</Label>
          <Input
            id="billingAddressLine2"
            name="billingAddressLine2"
            defaultValue={initialValues.billingAddressLine2 ?? ''}
            placeholder="Suite 8"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="billingCity">City</Label>
          <Input
            id="billingCity"
            name="billingCity"
            defaultValue={initialValues.billingCity ?? ''}
            placeholder="Seattle"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="billingPostcode">Postcode</Label>
          <Input
            id="billingPostcode"
            name="billingPostcode"
            defaultValue={initialValues.billingPostcode ?? ''}
            placeholder="Postal code"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="billingPhone">Phone</Label>
          <Input
            id="billingPhone"
            name="billingPhone"
            type="text"
            defaultValue={initialValues.billingPhone ?? ''}
            placeholder="Phone number"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save billing profile'}
        </Button>
      </div>
    </form>
  );
}

function getNullableInput(formData: FormData, key: string) {
  const rawValue = formData.get(key);
  if (rawValue === null) return null;
  const value = rawValue.toString().trim();
  return value.length > 0 ? value : null;
}

function parseNumberInput(formData: FormData, key: string) {
  const rawValue = formData.get(key);
  if (rawValue === null || rawValue === '') return null;
  const value = Number(rawValue);
  return Number.isNaN(value) ? null : value;
}

function getExactInput(formData: FormData, key: string) {
  const rawValue = formData.get(key);
  if (rawValue === null) return null;
  const value = rawValue.toString();
  return value.length > 0 ? value : null;
}

