import { z } from 'zod';

import { COUNTRY_CODE_SET, COUNTRY_NAME_LOOKUP } from '@/lib/constants/countries';
import { BILLING_LEGAL_TYPE, BILLING_LEGAL_TYPE_VALUES } from '@/lib/prisma/enums';

export const billingProfileSchema = z
  .object({
    legalType: z.enum(BILLING_LEGAL_TYPE_VALUES),
    firstName: nullableString(1, 120),
    lastName: nullableString(1, 120),
    legalName: nullableString(2, 255),
    registrationNumber: nullableString(),
    isVatPayer: z.boolean(),
    vatNumber: nullableString(),
    vatRate: z
      .number()
      .nonnegative()
      .max(100)
      .optional()
      .nullable(),
    billingAddressLine1: z.string().trim().min(2).max(255),
    billingAddressLine2: nullableString(),
    billingCity: nullableString(),
    billingPostcode: nullableString(),
    billingCountry: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .refine((value) => COUNTRY_CODE_SET.has(value), {
        message: 'Select a valid country'
      }),
    billingEmail: z.string().trim().email(),
    billingPhone: nullableString()
  })
  .superRefine((data, ctx) => {
    if (data.legalType === BILLING_LEGAL_TYPE.INDIVIDUAL) {
      if (!data.firstName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['firstName'],
          message: 'Name is required for individuals'
        });
      }

      if (!data.lastName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lastName'],
          message: 'Surname is required for individuals'
        });
      }
    } else {
      if (!data.legalName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['legalName'],
          message: 'Legal name is required for companies'
        });
      }

      if (!data.registrationNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['registrationNumber'],
          message: 'Registration number is required for companies'
        });
      }
    }

    if (data.isVatPayer && !data.vatNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vatNumber'],
        message: 'VAT number is required if VAT payer'
      });
    }
  });

export type BillingProfile = z.infer<typeof billingProfileSchema>;

export type ParticipantRegistrationDefaults = {
  firstName: string | null;
  lastName: string | null;
  billingEmail: string | null;
};

export type ParticipantRegistrationDefaultsInput = {
  name?: string | null;
  email?: string | null;
};

export const DEFAULT_BILLING_PROFILE: BillingProfile = {
  legalType: BILLING_LEGAL_TYPE.INDIVIDUAL,
  firstName: null,
  lastName: null,
  legalName: null,
  registrationNumber: null,
  isVatPayer: false,
  vatNumber: null,
  vatRate: null,
  billingAddressLine1: '',
  billingAddressLine2: null,
  billingCity: null,
  billingPostcode: null,
  billingCountry: '',
  billingEmail: '',
  billingPhone: null
};

export function createParticipantRegistrationDefaults(
  input: ParticipantRegistrationDefaultsInput
): ParticipantRegistrationDefaults | undefined {
  const email = readString(input.email);
  const name = readString(input.name);

  if (!email && !name) {
    return undefined;
  }

  const { firstName, lastName } = splitFullName(name);

  return normalizeParticipantDefaults({
    firstName: firstName ?? null,
    lastName: lastName ?? null,
    billingEmail: email ?? null
  });
}

export function mergeParticipantRegistrationDefaultsIntoConfig(
  config: unknown,
  defaults: ParticipantRegistrationDefaults
): Record<string, unknown> | undefined {
  const sanitizedDefaults = normalizeParticipantDefaults(defaults);
  if (!sanitizedDefaults) {
    return undefined;
  }

  const base = isRecord(config) ? { ...config } : {};
  const existing = getParticipantDefaultsSnapshot(base);

  if (existing && areParticipantDefaultsEqual(existing, sanitizedDefaults)) {
    return undefined;
  }

  return {
    ...base,
    participantRegistrationDefaults: sanitizedDefaults
  };
}

export function normalizeBillingProfile(
  values?: Partial<BillingProfile>,
  fallback?: Partial<BillingProfile>,
  participantDefaults?: Partial<BillingProfile>
): BillingProfile {
  const legalType =
    pickDefined(values?.legalType, fallback?.legalType) ?? DEFAULT_BILLING_PROFILE.legalType;
  const billingCountry = normalizeCountry(
    pickDefined(values?.billingCountry, fallback?.billingCountry) ?? DEFAULT_BILLING_PROFILE.billingCountry
  );
  const participantFallback = legalType === BILLING_LEGAL_TYPE.INDIVIDUAL ? participantDefaults : undefined;

  return {
    legalType,
    firstName:
      pickDefined(
        values?.firstName,
        participantFallback?.firstName,
        fallback?.firstName,
        DEFAULT_BILLING_PROFILE.firstName
      ) ?? null,
    lastName:
      pickDefined(
        values?.lastName,
        participantFallback?.lastName,
        fallback?.lastName,
        DEFAULT_BILLING_PROFILE.lastName
      ) ?? null,
    legalName: pickDefined(values?.legalName, fallback?.legalName, DEFAULT_BILLING_PROFILE.legalName) ?? null,
    registrationNumber:
      pickDefined(values?.registrationNumber, fallback?.registrationNumber, DEFAULT_BILLING_PROFILE.registrationNumber) ??
      null,
    isVatPayer: pickDefined(values?.isVatPayer, fallback?.isVatPayer, DEFAULT_BILLING_PROFILE.isVatPayer) ?? false,
    vatNumber: pickDefined(values?.vatNumber, fallback?.vatNumber, DEFAULT_BILLING_PROFILE.vatNumber) ?? null,
    vatRate: pickDefined(values?.vatRate, fallback?.vatRate, DEFAULT_BILLING_PROFILE.vatRate) ?? null,
    billingAddressLine1:
      pickDefined(values?.billingAddressLine1, fallback?.billingAddressLine1, DEFAULT_BILLING_PROFILE.billingAddressLine1) ??
      '',
    billingAddressLine2:
      pickDefined(values?.billingAddressLine2, fallback?.billingAddressLine2, DEFAULT_BILLING_PROFILE.billingAddressLine2) ??
      null,
    billingCity: pickDefined(values?.billingCity, fallback?.billingCity, DEFAULT_BILLING_PROFILE.billingCity) ?? null,
    billingPostcode:
      pickDefined(values?.billingPostcode, fallback?.billingPostcode, DEFAULT_BILLING_PROFILE.billingPostcode) ?? null,
    billingCountry,
    billingEmail:
      pickDefined(
        values?.billingEmail,
        participantFallback?.billingEmail,
        fallback?.billingEmail,
        DEFAULT_BILLING_PROFILE.billingEmail
      ) ?? '',
    billingPhone: pickDefined(values?.billingPhone, fallback?.billingPhone, DEFAULT_BILLING_PROFILE.billingPhone) ?? null
  };
}

export function extractBillingProfileFromConfig(config: unknown): BillingProfile {
  const partial = getPartialBillingProfile(config);
  const defaults = getRegistrationDefaults(config);
  const participantDefaults = getParticipantRegistrationDefaults(config);
  return normalizeBillingProfile(partial ?? undefined, defaults, participantDefaults);
}

export function mergeBillingProfileIntoConfig(config: unknown, profile: BillingProfile): Record<string, unknown> {
  const base = isRecord(config) ? { ...config } : {};
  return {
    ...base,
    billingProfile: profile
  };
}

function getPartialBillingProfile(config: unknown): Partial<BillingProfile> | undefined {
  if (!isRecord(config)) {
    return undefined;
  }

  const maybeProfile = (config as Record<string, unknown>).billingProfile;
  if (!isRecord(maybeProfile)) {
    return undefined;
  }

  return maybeProfile as Partial<BillingProfile>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nullableString(min = 1, max = 255) {
  return z.string().trim().min(min).max(max).optional().nullable();
}

function pickDefined<T>(...values: (T | undefined)[]): T | undefined {
  for (const value of values) {
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
}

function normalizeCountry(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_BILLING_PROFILE.billingCountry;
  }

  const upper = trimmed.toUpperCase();
  if (COUNTRY_CODE_SET.has(upper)) {
    return upper;
  }

  const byLabel = COUNTRY_NAME_LOOKUP.get(trimmed.toLowerCase());
  if (byLabel) {
    return byLabel;
  }

  return DEFAULT_BILLING_PROFILE.billingCountry;
}

function getRegistrationDefaults(config: unknown): Partial<BillingProfile> | undefined {
  if (!isRecord(config)) {
    return undefined;
  }

  const defaults = (config as Record<string, unknown>).registrationDefaults;
  if (!isRecord(defaults)) {
    return undefined;
  }

  const fallback: Partial<BillingProfile> = {};

  const firstName = readString(defaults.firstName);
  if (firstName) {
    fallback.firstName = firstName;
  }

  const lastName = readString(defaults.lastName);
  if (lastName) {
    fallback.lastName = lastName;
  }

  const email = readString(defaults.email);
  if (email) {
    fallback.billingEmail = email;
  }

  return Object.keys(fallback).length > 0 ? fallback : undefined;
}

function getParticipantRegistrationDefaults(config: unknown): Partial<BillingProfile> | undefined {
  const snapshot = getParticipantDefaultsSnapshot(config);
  if (!snapshot) {
    return undefined;
  }

  const fallback: Partial<BillingProfile> = {};

  const firstName = readString(snapshot.firstName);
  if (firstName) {
    fallback.firstName = firstName;
  }

  const lastName = readString(snapshot.lastName);
  if (lastName) {
    fallback.lastName = lastName;
  }

  const billingEmail = readString(snapshot.billingEmail);
  if (billingEmail) {
    fallback.billingEmail = billingEmail;
  }

  return Object.keys(fallback).length > 0 ? fallback : undefined;
}

function getParticipantDefaultsSnapshot(config: unknown): ParticipantRegistrationDefaults | undefined {
  if (!isRecord(config)) {
    return undefined;
  }

  const raw = (config as Record<string, unknown>).participantRegistrationDefaults;
  if (!isRecord(raw)) {
    return undefined;
  }

  return normalizeParticipantDefaults({
    firstName: readNullable(raw.firstName),
    lastName: readNullable(raw.lastName),
    billingEmail: readNullable((raw.billingEmail ?? raw.email) as unknown)
  });
}

function normalizeParticipantDefaults(
  defaults: ParticipantRegistrationDefaults
): ParticipantRegistrationDefaults | undefined {
  const firstName = readNullable(defaults.firstName);
  const lastName = readNullable(defaults.lastName);
  const billingEmail = readNullable(defaults.billingEmail);

  if (!firstName && !lastName && !billingEmail) {
    return undefined;
  }

  return {
    firstName,
    lastName,
    billingEmail
  };
}

function areParticipantDefaultsEqual(
  a?: ParticipantRegistrationDefaults,
  b?: ParticipantRegistrationDefaults
): boolean {
  if (!a || !b) {
    return false;
  }

  return a.firstName === b.firstName && a.lastName === b.lastName && a.billingEmail === b.billingEmail;
}

function splitFullName(value?: string | null) {
  if (!value) {
    return { firstName: null, lastName: null };
  }

  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: null, lastName: null };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

function readString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readNullable(value: unknown) {
  const result = readString(value);
  return result ?? null;
}


