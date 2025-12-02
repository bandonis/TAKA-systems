# TAKA — Stage 3 (Izstrāde 3) Manifests

This document defines EXACTLY what must be implemented during Stage 3 and what is explicitly forbidden.  
It overrides any generic ideas, suggestions, or parts of the full SPEC.

---

## 1. Stage 3 Goals (MVP-critical)

The focus of Stage 3 is to deliver a functional B2C MVP for hiking event organizers.

1. **Tenant Cockpit Stabilization**
   - Tenant identity settings (name, logo, brand color).
   - Stable admin panel: events list, participants list, revenue summary.

2. **Public Event Page Completion**
   - Stable public registration UX.
   - Early-bird pricing logic (automatic price & deadline display).

3. **B2C Stripe Checkout Hardening**
   - Stripe Checkout → Success → Cancel flow.
   - Reliable payment record creation.
   - Automatic participant creation linked to event & tenant.

4. **Participants Management**
   - Real-time participant list.
   - Minimal CSV export (optional but helpful).
   - Status update (paid / pending).

5. **Minimal Analytics**
   - Tickets sold per event.
   - Total revenue per event.
   - Simple KPI summary (no charts required).

6. **Core Systems Stability**
   - Stable Prisma + Supabase connection (Session Pooler, no 5432).
   - Stable local/Vercel environment.
   - Completed APIs for events, participants, and payments.

---

## 2. Out of Scope (Strictly Forbidden in Stage 3)

Do NOT implement anything in this list unless explicitly authorized.

### Authentication
- ❌ No Supabase Auth migration.
- ❌ No magic links, CAPTCHAs, or new auth methods.

### Landing Builder / Marketing CMS
- ❌ No landing builder.
- ❌ No drag-and-drop blocks.
- ❌ No landing versioning or publish flows.

### B2B Features
- ❌ No leads, deals, proposals, invoices, or B2B lifecycle.
- ❌ No company billing, no team access, no multi-role flows (beyond admin basics).

### AI Module
- ❌ No GPT integrations.
- ❌ No auto-generated event descriptions or landing text.

### Notifications
- ❌ No email/SMS notification system (beyond minimal receipts if absolutely necessary).

### Ticketing Extensions
- ❌ No seat management.
- ❌ No complex ticket types.
- ❌ No “inventory” logic beyond maxParticipants.

### Multi-language
- ❌ No localization layer.

These belong to Stage 4+ and must not distract the MVP.

---

## 3. Stage 3 Priorities (Ordered)

### **Priority 1 — Money Flow Unification**
- Perfect pricing logic (single, group, early bird).
- Stable checkout → webhook → participant creation.
- Payment records stored correctly.

### **Priority 2 — Event Engine Completion**
- Event CRUD.
- Public event page.
- Registration form with validations.
- Clean, consistent public API.

### **Priority 3 — Tenant Cockpit Foundations**
- Dashboard with core metrics.
- Participants table.
- Basic revenue summary.

---

## 4. How to Use This Manifest

Whenever a new GPT or Cursor agent is created, supply this file and instruct:

> “You must strictly follow `docs/STAGE3_MANIFEST.md`.  
> Implement ONLY what is inside Stage 3 scope.  
> Ignore all other ideas, even if they are in SPEC or database schema.”

This file acts as a **stage lock**: it prevents overscoping, premature architectural redesigns, and unnecessary complexity.

---

**End of Stage 3 Manifest**
