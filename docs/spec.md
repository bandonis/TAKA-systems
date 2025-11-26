TAKA Multi-Tenant Adventure Platform — Technical Specification

Version: 1.0
Maintainer: SuperAdmin (platform owner)

1. SYSTEM OVERVIEW

TAKA is a multi-tenant SaaS platform that allows:

1.1. Tenants (pārgājienu organizatori) to:

Create and manage their own adventure events (pārgājieni)

Manage B2C and B2B client registrations

Accept online payments

Track expenses and income

Build custom Landing Pages with drag & drop blocks

Use AI to generate marketing content

Send automated reminder emails

Manage guides, prices, dynamic discounts

Customize their UI (fonts, colors, themes)

Embed contact forms into third-party websites

Maintain GDPR consent logs

Manage multi-user teams in their admin panel

1.2. SuperAdmin to:

Manage all tenants

Switch into any tenant dashboard

Suspend/activate tenant accounts

See analytics for each tenant (income, expenses, B2B statuses)

View tenant subscription or revenue share model

Edit landing pages of tenants

Preview and restore previous landing versions

Global financial dashboards (across all tenants)

2. USER ROLES
2.1. SuperAdmin

Full access to every tenant

Can impersonate tenant admins

Set platform pricing model (subscription or revenue share)

Suspend tenant instances

View global analytics

Manage global landing templates

2.2. Tenant Admin

Full control over their instance

Manage events, landing pages, analytics

Handle B2C and B2B

Add team members

Manage appearance and branding

2.3. Tenant Team Member

Restricted access (events only, or financials only)

2.4. B2C Customer (public)

Registers for a public event

Can pay online

Receives receipts + reminder emails

Signs GDPR & safety consent digitally

2.5. B2B Lead

Registers via B2B contact form

Can be converted to B2B Deal inside admin panel

Receives proposals and invoices

3. MULTI-TENANCY ARCHITECTURE
Database

Single database with shared schema

Every table includes:

tenantId (UUID)
createdAt
updatedAt

Access Control

Middleware enforces tenantId on every request

SuperAdmin can bypass tenant restrictions

Tenant Provisioning

When tenant registers:

New tenant row in Tenants table

Default settings copied

Default landing template created

Welcome email sent

4. AUTHENTICATION

Supabase Auth with:

Email/password

Magic link login

Password reset

Email verification
All auth records include tenantId.

5. LANDING PAGE BUILDER (Drag & Drop)
5.1. Blocks supported

Hero section (full-width image + heading + subtitle)

Gallery

Carousel

Features grid

FAQ accordion

Testimonials slider

Side-image sections (Left/Right)

Custom HTML block

Guides showcase

Footer block

Custom pages (Privacy Policy, Terms)

5.2. Block controls

For each block:

Add

Remove

Duplicate

Reorder

Show/hide on Mobile

Show/hide on Desktop

Adjust padding, margins

Change fonts (inherits global font set)

Background color/image

Icons selector

Animation toggle

5.3. Global landing settings

Logo

Navigation items (customizable)

Highlight menu item (contact form)

Font families (Heading + Body)

Font sizes mobile/desktop proportions

Primary/secondary color palette

SEO settings: title, meta description, OG image

Cookie banner text

5.4. Version History

Each publish creates new version

Ability to restore last 2 versions

6. CONTACT FORM (fully customizable)

Admin can configure:

6.1. Fields:

email

phone

name

participant count

company name

text comment

dropdown for event type

custom fields

Each field has settings:

Required (yes/no)

Placeholder

Validation rules

Field type

Success message after submission

6.2. Anti-spam

CAPTCHA

Honeypot field

Rate limiting

6.3. Embeddable Mode (iframe)

Contact form can be embedded externally

Works as “Lead Gen Mode”

Saves leads to Leads table with source: external

7. EVENT MANAGEMENT MODULE
7.1. Event types

B2C event template

B2B event template

Admin can create event types

7.2. Event creation

Fields:

Event title

Description

Date/time

Max participants

Price for 1 ticket

Price for 2+ tickets

Early bird price + deadline

Location

Guide assigned

Expenses list

Visibility (draft / published)

7.3. Event expenses

Each expense includes:

Name

Amount

Tag (Ads, Food, Transport, Salaries, Gear, Admin, Other)

Date

Notes

7.4. Add manual participants

Name

Email

Phone

Tickets purchased

Payment status

Payment type: online / cash / transfer

Consent status

7.5. Automated Emails

Registration confirmation

Reminder emails (admin chooses: 2h, 6h, 12h, 24h, 48h, custom)

Weather or safety alerts

Payment receipts

Admin can edit templates.

8. B2B DEAL MODULE
8.1. B2B lead capture

From landing:

email
phone
company name
participant count
event type
comment

8.2. Convert to B2B deal

Adds:

Deal amount

Legal company name

Registration number

Address

Confirmed event time

Status timeline:

lead

proposal sent

negotiation

invoice sent

paid

completed

8.3. B2B invoice generation

Generates PDF with:

Event details

Company info

Amount

Tax info

Payment instructions

System logs:

sent_on

opened

paid_on

9. ANALYTICS MODULE
9.1. Revenue tracking

B2C revenue

B2B revenue

Total

Month-by-month

Per event

Per event type

Per tenant (superadmin view)

9.2. Expense tracking

Event expenses

Global monthly expenses

Expense categories summary

Tag filters

9.3. Conversion funnels

Landing visits

Contact form submissions

Event registrations

Event payments

Drop-off points

9.4. Lead sources

Facebook Ads

Instagram Ads

TikTok

Google

Influencer links

Organic

10. AI MODULE
AI asks tenant onboarding questions:

What type of adventures you offer?

What makes them special?

Pace: calm / active / intense / extreme

Your tone: inspiring / friendly / wild / minimal

Who is your audience?

AI uses this to generate:

Marketing ideas

Landing page text suggestions

SEO descriptions

Event descriptions

Social media captions

11. FILE STORAGE

All images go to Supabase Storage

Tenants see only their own bucket folder

12. PAYMENT SYSTEM

Stripe or Paysera

Supports:

One-time ticket purchases

Multi-ticket pricing

Early bird pricing

Auto receipts for B2C

Auto invoice for B2B

13. CONSENT & LEGAL
Each participant must sign:

GDPR data consent

Safety responsibility waiver

If paid onsite:

Unique consent URL

Signs via email

System logs timestamp

14. SUPERADMIN DASHBOARD

Tenant list

Tenant income overview

Tenant B2B invoices

Suspend/activate tenant

Tenant settings

Access tenant admin dashboard

Global platform analytics

END OF SPECIFICATION FILE
