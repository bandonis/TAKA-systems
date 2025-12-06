TAKA PLATFORM — Technical Specification (Cursor-Optimized Edition)

Version: 1.2
Author: SuperAdmin (Platform Owner)
Audience: Cursor (AI developer)
Purpose: Complete MVP-to-Full System Specification for multi-tenant SaaS

==========================================
0. SYSTEM OVERVIEW
==========================================

TAKA is a multi-tenant SaaS system for hiking & adventure event organizers.

Each tenant gets:

their own admin dashboard

event creation & management

B2C & B2B registrations

payment processing

full income/expense analytics

AI assistant for marketing

drag & drop landing builder

automated reminder emails

multi-user team roles

client CRM

GDPR & safety consent system

customizable contact forms

global + event-level expenses

B2B full deal lifecycle

A superadmin controls:

all tenants

platform-level analytics

tenant subscription/revenue sharing

tenant suspension/reactivation

landing page override

multi-tenant revenue insights

==========================================
1. TECH STACK
==========================================
Backend

Next.js 15 (App Router)

TypeScript

Prisma ORM

PostgreSQL (Supabase)

Supabase Auth

Zod validation

tRPC (preferred) or REST (if needed)

Frontend

React

TailwindCSS

Shadcn UI

Zustand / Context

Responsive-first layout

Storage

Supabase Storage (tenant-isolated buckets)

Payments

Stripe (primary)

Paysera optional future module

AI

GPT model (via OpenAI API)

AI used for:

landing text generation

marketing ideas

seasonal event ideas

email text drafts

==========================================
2. MULTI-TENANT ARCHITECTURE
==========================================
2.1. Tenant isolation rules

All tables include:

tenantId (UUID)
createdAt
updatedAt


Requests are scoped by tenantId.

Superadmin bypass allowed.

2.2. Tenant provisioning

When a tenant registers:

Tenant row created

Default landing page generated

Default settings copied

Bucket folder created

Welcome email sent

==========================================
3. DATABASE SCHEMA — TABLES
==========================================

Below are all tables Cursor must implement.

3.1. Tenants
id
name
logoUrl
primaryColor
language
subscriptionPlan
status (active | suspended)
createdAt
updatedAt

3.2. Users
id
tenantId
email
passwordHash
role (admin | editor | viewer)
createdAt
updatedAt

3.3. EventTypes
id
tenantId
name
description
defaultPriceSingle
defaultPriceGroup
defaultEarlyBirdPrice
defaultEarlyBirdDeadline
createdAt
updatedAt

3.4. Events
id
tenantId
eventTypeId
title
description
date
time
maxParticipants
priceSingle
priceGroup
earlyBirdPrice
earlyBirdDeadline
location
guideName
visibility (draft | published)
createdAt
updatedAt

3.5. EventParticipants (B2C)
id
tenantId
eventId
name
email
phone
ticketCount
amountPaid
paymentStatus (pending | paid)
paymentType (online | cash | transfer)
consentStatus (yes/no)
registeredFrom (landingId)
createdAt
updatedAt

3.6. GlobalExpenses
id
tenantId
name
amount
tag
date
notes
createdAt
updatedAt

3.7. EventExpenses
id
tenantId
eventId
name
amount
tag
date
notes
createdAt
updatedAt

3.8. B2BLeads
id
tenantId
email
phone
companyName
participantEstimate
eventType
requestedHikeType
comment
source
createdAt
updatedAt

3.9. B2BDeals
id
tenantId
leadId
amount
legalName
registrationNumber
address
eventDate
status (lead | proposal_sent | negotiation | invoice_sent | paid | completed)
statusTimeline JSON
createdAt
updatedAt

3.10. B2BInvoices
id
tenantId
dealId
invoiceNumber
amount
sentAt
openedAt
paidAt
pdfUrl
createdAt
updatedAt

3.11. ContactForms
id
tenantId
name
successMessage
createdAt
updatedAt

3.12. ContactFormFields
id
formId
label
type (text | email | phone | number | dropdown)
required
placeholder
options JSON
orderIndex
createdAt
updatedAt

3.13. Leads (from contact form)
id
tenantId
formId
data JSON
source
createdAt

3.14. ConsentTemplates
id
tenantId
type (gdpr | safety)
title
content
createdAt
updatedAt

3.15. Consents
id
tenantId
eventId (nullable)
email
consentType (gdpr | safety)
contentSnapshot
ip
userAgent
signedAt
createdAt

3.16. LandingPages
id
tenantId
title
slug
publishedVersionId
createdAt
updatedAt

3.17. LandingBlocks
id
landingId
tenantId
blockType
content JSON
visibleMobile
visibleDesktop
orderIndex
createdAt
updatedAt

3.18. LandingVersions
id
landingId
tenantId
jsonSnapshot
createdAt

3.19. Analytics Events
PageViews
id
tenantId
page
source
createdAt

ConversionEvents
id
tenantId
eventType
value
createdAt

==========================================
4. AUTHENTICATION
==========================================
Requirements

Supabase Auth email/password

Magic links later

CAPTCHA for tenant registration

Every user assigned to tenantId

Superadmin lives in global scope

==========================================
5. EVENT MANAGEMENT LOGIC
==========================================
Event creation flow:

Admin creates event template or custom event

Set pricing (single, group 2+, early bird)

Set max participants

Set visibility

Publish

Rules:

totalParticipants ≤ maxParticipants

early bird price valid until earlyBirdDeadline

priceGroup applied only if ticketCount ≥ 2

Add manual participant:

If paymentType = cash → consent link must be emailed

If online → payment receipt auto generated

==========================================
6. B2B FLOW
==========================================
Lead → Deal conversion

When converting:

system auto-fills fields

admin adds legal data

admin sets event date

admin sets amount

Deal statuses:
lead
proposal_sent
negotiation
invoice_sent
paid
completed

Invoices:

PDF generator

Stores URL

Email sending

Logs: sentAt, openedAt, paidAt

==========================================
7. CONTACT FORMS
==========================================
7.1. Overview
-------------TAKA has a unified ContactForm system used in multiple contexts:

    B2C landing contact form (public, tied to a specific Event)
    B2B inquiry form (public, optionally asks for a free-text "hike type" dropdown defined per landing)
    Optional embeddable modes in later stages

All forms share a core structure, then diverge by "mode" (B2C vs B2B).7.2. Common field model
-----------------------Each ContactForm submission creates one of:

    `EventParticipant` (B2C mode)
    `B2BLead` (B2B mode)

Common logical fields:

    `email` (string, required)
    `name` (string, required)
    `phone` (string, optional but recommended)
    `message` (string, optional free-text comment)
    `marketingConsent` (boolean, default `true`)
        label: "Vēlos saņemt pārgājienu atlaides un īpašos piedāvājumus"
        when checked (default), we store a marketing consent entry (see Consent / Email / GDPR section)

Backend must persist:

    `ip` or similar metadata (if already present in spec)
    timestamps for createdAt / updatedAt

7.3. B2C Contact Form (Landing mode)
------------------------------------Context:

    Used on public landing pages for individual events.
    Target model: `EventParticipant` with `paymentStatus = PENDING` by default.

Form fields (UI):

    `Name` (required)
    `Email` (required)
    `Phone` (optional)
    `Upcoming hike / event date` (select, required)
        options limited to the landing block configuration
    `Ticket type` (radio or segmented control) – single, group, early bird, etc.
    `Ticket count` (integer >=1, required, default 1)
    `Total price` read-only field calculated as `ticketCount × active price`
    `Comment / message` (optional)
    `MarketingConsent` checkbox (default checked, boolean stored on participant)

Pricing display:

    Show the active price for the selected ticket type.
    If an Early bird price is active:
        show early bird price
        show text like: "Cena spēkā līdz {earlyBirdUntil}"
    If Early bird expired:
        show normal price only.

Submit behaviour (MVP):

    Always create/update an `EventParticipant` row via auto-save before redirecting anywhere.
        `registrationStatus` enum tracks `draft | submitted | pending_payment | completed`.
        `marketingConsent`, `ticketCount`, `priceAtTheMoment`, `eventId`, `landingId` must be persisted.
    Tenant settings determine payment flow:
        paymentMode = STRIPE → after submit create/update participant, then start Stripe checkout.
            On Stripe failure we keep participant row and show error.
        paymentMode = MANUAL → simply confirm submission, mark `registrationStatus = submitted`, and notify tenant (future email).

The old “Unable to start registration” behaviour must be replaced by “always save the data first” behaviour.7.4. B2B Contact Form (Company mode)
------------------------------------Context:

    Used by companies to request a private or custom hike.
    Not tied to a specific event instance. Admins can optionally add a per-landing dropdown for "hike type" with free-text options; otherwise no type selection is shown.

Form fields (UI):

    Toggle: "Privātpersonām / Uzņēmumiem" (switch between B2C and B2B modes)
    In B2B mode:

    `Company name` (optional, string)
    `Contact person name` (required)
    `Email` (required)
    `Phone` (required)
    `Company email` + `company phone` fields map 1:1 to DB.
    `Hike type` dropdown (optional, defined per landing; stored as free-text `requestedHikeType`)
    `Estimated participant count` (optional integer)
    `Preferred date or time window` (optional text)
    `Message` (optional)
    `MarketingConsent` checkbox (default checked → create consent entry)

Important:

    **No prices are shown in B2B mode**.
    **No ticket count price calculation** is displayed.
    Submission creates/updates a `B2BLead` record with:
        `companyName`, `companyPerson`, `companyEmail`, `companyPhone`
        `requestedHikeType` (when the dropdown is enabled)
        `participantEstimate`, `preferredDate`, `comment`
        `marketingConsent` flag + consent record
        `status` transitions `draft → open`

7.5. Auto-save behaviour (Leads)
--------------------------------
We must not lose data when someone partially fills the form.

    When the first required field (email/name) is blurred → call autosave endpoint.
        B2C: Create `EventParticipant` with `registrationStatus = draft`, `marketingConsent = bool`, `landingId`.
        B2B: Create `B2BLead` with `status = draft`.
        Response must include the saved record ID for further PATCH calls.
    Every subsequent blur/change should PATCH the existing record (debounced client-side).
    Submit transitions:
        B2C manual flow → `registrationStatus = submitted`.
        B2C stripe flow → `registrationStatus = pending_payment` until payment success.
        B2B → `status = open`.
    Auto-save endpoints must be idempotent and validate tenant/landing ownership.

7.6. Embeddable mode (future)
-----------------------------

    Contact form may later be embeddable via:

  ```html
  <iframe src="{tenantUrl}/embed/form/{formId}" />

==========================================
8. LANDING BUILDER
==========================================
Block types:

Hero

Image left / right

Gallery

Carousel

FAQ

Testimonials

Benefits grid

Custom HTML

Footer

Guides block

Block rules:

movable (drag)

show/hide mobile

show/hide desktop

editable background

editable fonts

reorderable

structured JSON content

Versioning:

each publish creates LandingVersion

stored JSON snapshot

keep last 2 versions

==========================================
9. PAYMENT LOGIC
==========================================
Stripe integration:

pay for 1 ticket

pay for group (2+)

early bird applied automatically

webhook: updates paymentStatus

Receipts:

B2C: simple receipt PDF

B2B: invoice PDF

==========================================
10. ANALYTICS
==========================================
Includes:

revenue (b2c, b2b, total)

expenses (event + global)

profit

CAC (ads spend / registered participants)

funnel:

landing views

form submissions

registrations

payments

==========================================
11. SUPERADMIN
==========================================

Superadmin can:

view all tenants

view tenant revenue

view tenant B2B invoices

impersonate tenant

suspend/activate tenant

access tenant landing builder

modify global settings

==========================================
12. AI MODULE
==========================================

AI helps tenants generate:

landing page copy

marketing ideas

seasonal campaign ideas

event descriptions

email content drafts

AI uses tenant onboarding inputs:

event style (calm / active / extreme)

target audience

location type

special features
# ==========================================
# 13. PERFORMANCE & SCALING GUIDELINES
# ==========================================

This platform must be able to handle 1000+ tenants, each with multiple landing pages and events, without excessive resource usage.

## 13.1. Multi-tenant performance

- All multi-tenant queries MUST be filtered by `tenantId`.
- Add database indexes on:
  - `tenantId`
  - `tenantId + createdAt` (for large tables like Events, EventParticipants, Leads)
  - `tenantId + status` where filtering by status is common (B2BDeals, Payments).
- Avoid loading cross-tenant data in any queries.

## 13.2. Landing pages (speed & hosting)

- Public landing pages should be rendered using:
  - SSG (Static Site Generation) or
  - ISR (Incremental Static Regeneration),
  NOT fully dynamic SSR for every request.
- Landing pages should be cached via CDN where possible.
- When a tenant publishes changes to a landing page:
  - trigger revalidation/ISR for that specific page,
  - do NOT recompute all tenants’ pages.

## 13.3. Expensive operations

- Sending emails, generating PDFs, and heavy analytics should be done:
  - via background jobs / queues, or
  - via async functions (e.g. Supabase edge functions),
  NOT inside user-facing HTTP requests where possible.
- Payment webhooks should:
  - validate input,
  - update DB,
  - return a fast 200 response,
  - delegate heavy follow-up work (emails, reports) to async logic.

## 13.4. Data loading in admin UI

- Admin dashboard pages must:
  - use pagination or “infinite scroll” for large lists (events, participants, leads),
  - avoid loading thousands of records into a single request.
- Use aggregated queries for analytics (SUM, COUNT, GROUP BY), not manual loops in application code.

## 13.5. File & image handling

- All images (for landing pages, events, guides) must be served from Supabase Storage or CDN URLs.
- Do NOT embed base64 images in JSON or HTML.
- Optimize images (resize, compress) on upload where possible.

## 13.6. Future scaling

The architecture should allow:

- horizontal scaling of the Next.js app (stateless server),
- Postgres performance tuning via indexes and read patterns,
- easy move from single Postgres instance to managed scalable Postgres (Supabase, RDS, etc.)

Do NOT introduce design choices that require per-tenant database instances or per-tenant code deployments.

# ==========================================
# 14. SECURITY GUIDELINES
# ==========================================

Security is a core requirement of the TAKA platform.  
All code generated must follow the security rules below.

## 14.1. Multi-tenant data isolation

- Every database query MUST be filtered by `tenantId` unless user is superadmin.
- The backend must NEVER trust “tenantId” coming from the frontend — always derive it from:
  - the authenticated user session, or
  - a secure route parameter resolved on the server.

If a route does not specify tenant context, ask for clarification before coding.

## 14.2. Authentication & authorization

- Use Supabase Auth for login and session management.
- Protect all admin routes — only authenticated users with proper roles can access:
  - events
  - participants
  - expenses
  - analytics
  - B2B deals and invoices
  - landing builder
- Role levels:
  - **admin** → full access
  - **editor** → can edit content (events, landing blocks)
  - **viewer** → read-only, no editing of data

Client-side role checks are NOT enough — always enforce access on the server.

## 14.3. Input validation

- ALL API endpoints must validate input using Zod schemas.
- Backend must sanitize:
  - strings
  - HTML (if custom HTML block is used)
  - email fields
  - phone fields
- Never trust frontend forms.

## 14.4. Sensitive data handling

The following data is considered sensitive:

- participant names, emails, phones
- B2B company legal data (reg number, address)
- consent logs
- event payments
- invoices

Rules:

- Never expose sensitive fields through public API endpoints.
- Never include sensitive fields in analytics events.
- Never log sensitive data into server logs.

## 14.5. GDPR compliance

- Consent logs must include:
  - email
  - consent content snapshot
  - IP
  - userAgent
  - signedAt
- Consent cannot be edited after creation.
- When a user requests deletion of their data:
  - delete participant registers
  - keep aggregated analytics (no personal data)
  - keep invoices (legal requirement) but anonymize names

## 14.6. Passwords & tokens

- Never store plain passwords — only bcrypt hashed.
- Store service tokens (Stripe secret, SMTP password) ONLY in environment variables.
- Never commit secrets to GitHub.

## 14.7. API security

- Use only server-side Next.js App Router handlers for sensitive operations.
- Disallow direct client writes to the database (no open Prisma access).
- Implement rate limiting for:
  - contact forms
  - login endpoint
  - B2C registration endpoint

## 14.8. File uploads

- Validate file type and size on upload.
- Store files in tenant-scoped folders.
- Do not allow uploading executable files.

## 14.9. Email sending

- Do not expose SMTP credentials client-side.
- Use server-only email sending route.
- For B2B invoices and B2C receipts:
  - generate a secure one-time URL
  - never expose internal paths

## 14.10. Deployment & environment rules

- Ensure HTTPS is required for all production traffic.
- Disable Next.js telemetry in production if needed.
- Set secure cookies (httpOnly, SameSite=Strict).
- Log only non-sensitive operational data.

Security checks must be applied to ALL new features.
If something is ambiguous, the system must default to the safest option.

END OF SPECIFICATION FILE