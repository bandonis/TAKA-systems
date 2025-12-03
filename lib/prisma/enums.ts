export const TENANT_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED'
} as const;

export type TenantStatus = (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];

export const USER_ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER'
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const EVENT_VISIBILITY = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED'
} as const;

export type EventVisibility = (typeof EVENT_VISIBILITY)[keyof typeof EVENT_VISIBILITY];
export const EVENT_VISIBILITY_VALUES = Object.values(EVENT_VISIBILITY) as EventVisibility[];

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID'
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS) as PaymentStatus[];

export const PAYMENT_TYPE = {
  ONLINE: 'ONLINE',
  CASH: 'CASH',
  TRANSFER: 'TRANSFER'
} as const;

export type PaymentType = (typeof PAYMENT_TYPE)[keyof typeof PAYMENT_TYPE];
export const PAYMENT_TYPE_VALUES = Object.values(PAYMENT_TYPE) as PaymentType[];

export const BILLING_LEGAL_TYPE = {
  COMPANY: 'COMPANY',
  INDIVIDUAL: 'INDIVIDUAL'
} as const;

export type BillingLegalType = (typeof BILLING_LEGAL_TYPE)[keyof typeof BILLING_LEGAL_TYPE];
export const BILLING_LEGAL_TYPE_VALUES = Object.values(BILLING_LEGAL_TYPE) as BillingLegalType[];

