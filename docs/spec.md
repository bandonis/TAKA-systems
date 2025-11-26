TAKA PLATFORM — TECHNICAL SPECIFICATION (Cursor-Optimized)

Version 1.1
Format: Cursor-First Architecture Document
Author: SuperAdmin

=====================================
0. SYSTEM SUMMARY
=====================================

TAKA ir multi-tenant SaaS sistēma, kas ļauj pārgājienu organizatoriem:

veidot landing lapas (drag & drop)

pieņemt B2C un B2B reģistrācijas

pieņemt online maksājumus

nosūtīt automatizētu e-pastu plūsmas

pārvaldīt izmaksas un ienākumus

redzēt analītiku

izmantot AI satura ģenerēšanai

pievienot un pārvaldīt komandu

strādāt ar unikālu kontaktformu sistēmu

pārvaldīt GDPR un drošības piekrišanas

SuperAdmin var:

pārvaldīt visus tenantus

pārslēgties viņu paneļos

redzēt pilno analītiku

apturēt/aktivizēt tenantus

pārvaldīt cenu modeli

Šis dokuments definē sistēmas struktūru, moduļus, datubāzes modeli un API prasības.

=====================================
1. SYSTEM ARCHITECTURE
=====================================
1.1. Stack (mandatory)

Next.js 15 (App Router)

TypeScript

Prisma ORM

PostgreSQL (Supabase)

Supabase Auth + RLS

TailwindCSS

Shadcn UI

Stripe / Paysera

Supabase Storage

1.2. Multi-tenant rules

Single database, shared schema

Every table includes:

tenantId  (UUID)
createdAt
updatedAt


Middleware enforces tenant boundaries

SuperAdmin can bypass tenant filtering

=====================================
2. DATABASE MODEL
=====================================
2.1. Tables overview

Cursor must generate these tables:

Core

Tenants

Users

UserRoles

Events

EventTypes

Events

EventParticipants

EventExpenses

B2B

B2BLeads

B2BDeals

B2BInvoices

Landing Builder

LandingPages

LandingBlocks

LandingVersions

Leads & Forms

ContactForms

ContactFormFields

Leads

Consents

Consents

ConsentTemplates

Analytics

PageViews

ConversionEvents

LeadSources

=====================================
3. USER ROLES AND PERMISSIONS
=====================================
3.1. Roles

superadmin

tenant_admin

tenant_editor

public_user

3.2. Permissions summary

(Implement via middleware, not per-table ACLs)

Role	Permissions
superadmin	Full access, impersonate, view all tenants
tenant_admin	Full control over own tenant
tenant_editor	Limited access (events only, or financials only)
public_user	Can register & pay
=====================================
4. AUTHENTICATION MODULE
=====================================
4.1. Requirements

Supabase Auth

Email/password

Magic link login

CAPTCHA during registration

4.2. Tenant registration flow

Tenant signs up → system creates:

tenant row

default settings

default landing page

welcome email

=====================================
5. LANDING PAGE BUILDER (DRAG & DROP)
=====================================
5.1. Block types (must be modular)

Hero

Side image (L/R)

Gallery

Carousel

Features

FAQ

Testimonials

Guides

Footer

Custom HTML

Custom Page (for Privacy, Terms)

5.2. Block properties

Every block supports:

visibleMobile: boolean
visibleDesktop: boolean
backgroundColor
backgroundImage
contentFields (text, images)
orderIndex
padding / margin
font settings
icon settings
animations

5.3. Navigation bar

editable menu items

highlight item for contact form

scrolling anchors

5.4. Global settings

colors

fonts (heading + body)

mobile/desktop font proportions

SEO settings

OG image

favicon

5.5. Publishing and versioning

publish button

save draft

version history (last 2 versions)

superadmin can override tenant design

=====================================
6. CONTACT FORM SYSTEM
=====================================
6.1. Admin configurable fields

Each field has:

label
type (text, email, phone, number, dropdown)
required (true/false)
placeholder
validationRules


Special B2B fields:

companyName
registrationNumber
participantEstimate

6.2. Anti-spam

CAPTCHA

honeypot field

rate limiting

6.3. Success flow

After submission:

show success message (editable)

save lead

send confirmation email (optional)

6.4. Embeddable Mode

Generated iframe:

<iframe src="https://platform.com/form/{formId}?tenant={tenantId}" />

=====================================
7. EVENTS MODULE
=====================================
7.1. Event fields
title
description
date
time
maxParticipants
priceSingle
priceGroup (2+)
earlyBirdPrice
earlyBirdDeadline
location
guideId
visibility

7.2. Expenses
name
amount
tag
date
notes

7.3. Manual participants

Fields:

name
email
phone
ticketCount
amountPaid
paymentType (cash/online/transfer)
paymentStatus
consentStatus

7.4. Automated emails

registration confirmation

event reminders

weather/safety alerts

Admin sets:

timing

email content

=====================================
8. B2B MODULE
=====================================
8.1. Lead capture fields
email
phone
companyName
participantCount
eventType
comment

8.2. Deal conversion

Adds:

amount
legalName
registrationNumber
address
eventTime
statusTimeline

8.3. Invoice generation

PDF includes:

company data

amount

bank details

tax info

due date

System logs: sent_on, opened, paid_on.

=====================================
9. PAYMENT SYSTEM
=====================================

Required:

Stripe or Paysera

one-time payments

multi-ticket

early bird logic

receipts PDF

webhook to confirm success

=====================================
10. CONSENT SYSTEM (LEGAL)
=====================================
10.1. Consent types

GDPR

Safety waiver

10.2. Flow

If online payment:

user checks consent boxes

receives email copy

stored in database

If on-site payment:

system generates unique consent URL

user signs digitally

system logs timestamp

=====================================
11. ANALYTICS MODULE
=====================================
11.1. Revenue dashboards

B2C

B2B

event-level

tenant-level

platform-level (superadmin)

11.2. Expenses

event expenses

monthly global expenses

tags filter

11.3. Conversion funnel
Landing visits →
Contact form →
Registration →
Payment →
Event attendance

11.4. Lead sources

Facebook Ads

Instagram Ads

TikTok

Organic

Influencers

=====================================
12. SUPERADMIN MODULE
=====================================

Functions:

list tenants

view tenant analytics

suspend/activate tenant

impersonate tenant

view B2B invoices

view B2C revenue

edit landing pages

manage subscription/revenue-share

=====================================
END OF SPEC DOCUMENT
=====================================
