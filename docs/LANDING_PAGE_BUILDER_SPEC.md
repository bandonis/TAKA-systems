TAKA — Landing Page Builder Specification (Full Front-End Logic)

Version 1.0
Audience: AI Developer (Cursor), Front-End Developers
Scope: Landing Page Rendering, Builder UI, Content Structure, Optimization Rules

1. System Overview

Tenantam ir iespēja izveidot vairākas landing lapas, kas sastāv no blokiem (hero, features, gallery, companions, testimonials, contact form u.c.).

Katru landing:

var saglabāt ar unikālu slug,

var publicēt vai atstāt draftā,

satur SEO / meta iestatījumus,

ļauj pievienot / noņemt / pārvietot blokus,

nodrošina mobile/desktop redzamības kontroli,

atbalsta globālu fonta izmēra skalu (heading/body, mobile/desktop),

nodrošina ātru ielādi (lazy-loading + optimized images),

satur CAPTCHA aizsardzību kontaktformai,

saglabā versijas, lai varētu atgriezties pie vecākām versijām.

Backend jau nodrošina:

LandingPage

LandingBlock

LandingVersion

Šī specifikācija nosaka, kā front-end strādā, kā Builder jāuzvedas un kā data struktūra tiek definēta.

2. Performance & Optimization Rules

Šī ir obligāta daļa, kas Cursor-am jāimplementē, jo landing lapām jāstrādā ātri un jābūt lētām serverim.

2.1. Images must be optimized

Visi augšupielādētie attēli jāoptimizē:

max 1920px (desktop)

max 1280px (tablet)

max 800px (mobile)

konvertēt WebP / AVIF formātos

Nedrīkst pieļaut, ka lietotājs ielādē 20MB foto.

Builder UI parāda warning, ja bilde ir pārāk liela.

2.2. Lazy-loading & progressive loading

Visi attēli:

lazy-load

blur-up (low-res preview)

2.3. Static rendering

Landing tiek renderēti statiski ar ISR (Incremental Static Regeneration) vai kešotu SSR.

Servera slodzei nedrīkst palielināties, ja tenantam ir daudz landing.

2.4. Local caching

Builder CS puse saglabā pēdējo rediģēto versiju localStorage (failsafe).

3. Landing Page Data Structure
3.1. LandingPage
{
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  
  metaTitle: string;
  metaDescription: string;
  socialImage: string | null;

  fontScale: {
    mobile: { heading: number; body: number; };
    desktop: { heading: number; body: number; };
  };

  menu: {
    enabled: boolean;
    items: Array<{ label: string; blockId: string; visible: boolean }>;
    cta: { label: string; href: string; color: string };
    showLogo: boolean;
    logoType: "text" | "image";
    logoText?: string;
    logoImageUrl?: string;
  };

  footer: {
    contentPages: Array<{ title: string; href: string }>;
    socialLinks: Array<{ type: string; href: string }>;
    email: string;
    phone: string;
    address: string | null;
  };

  tracking: {
    headInsert?: string;
    bodyEndInsert?: string;
  };

  status: "draft" | "published";
}

3.2. LandingBlock
{
  id: string;
  landingId: string;
  blockType: string;
  orderIndex: number;

  visibleMobile: boolean;
  visibleDesktop: boolean;

  content: JSON; // block-specific structure
}

4. Block Types & Content Structures
4.1. Hero Block

Background image, heading, subheading, CTA.

{
  "bgImageUrl": "...",
  "heading": "...",
  "subheading": "...",
  "ctaLabel": "Register",
  "ctaHref": "#contact",
  "overlayOpacity": 0.4
}

4.2. Features Grid Block

3–4 kartītes.

{
  "title": "Ignite your senses",
  "subtitle": "Visceral connection.",
  "items": [
    { "icon": "trees", "title": "Primal Bathing", "description": "Dive into the forest." }
  ]
}

4.3. Gallery Block
{
  "images": [
    { "imageUrl": "...", "caption": "" }
  ]
}

4.4. Carousel Block
{
  "slides": [
    { "imageUrl": "...", "title": "...", "description": "...", "href": null }
  ]
}

4.5. Side Image Block
{
  "position": "left",
  "imageUrl": "...",
  "heading": "...",
  "body": "..."
}

4.6. Companions Block
{
  "title": "Your companions",
  "subtitle": "Meet the passionate guides.",
  "items": [
    { "imageUrl": "...", "name": "Alex Rivers", "role": "Lead Guide", "bio": "..." }
  ]
}

4.7. FAQ Block
{
  "title": "FAQ",
  "items": [
    { "question": "...", "answer": "..." }
  ]
}

4.8. Testimonials Block (Atsauksmes)
{
  "items": [
    {
      "logoUrl": null,
      "author": "Anna Reviews",
      "rating": 5,
      "text": "Great!"
    }
  ]
}

4.9. Contact Form Block (B2B + B2C)

Switch tabs: Uzņēmumiem / Privātpersonām

B2B izvēlas “Pārgājiena tipu”

B2C izvēlas konkrētu eventu

Automātiska cenas aprēķināšana

Auto-save leads backendā

CAPTCHA

{
  "title": "Sazinies ar mums",
  "mode": "both",
  "b2bEventTypes": true,
  "b2cEvents": true
}

5. Builder UI Logic (Admin Mode)
5.1. Block ordering (no drag & drop needed)

Katram blokam:

↑ pārvietot uz augšu

↓ pārvietot uz leju

🗑 dzēst

⚙️ atvērt iestatījumus

5.2. Inline content editing

Katrs teksfields ir contentEditable

“Delete element” noņem konkrētu lauku (piem. heading, body)

Var pievienot:

jaunu feature kartīti

jaunu companion

jaunu carousel slide

jaunu FAQ jautājumu

jaunu testimonial

5.3. Block visibility

Toggle visibleMobile

Toggle visibleDesktop

5.4. Header settings

Logo: teksts vai bilde

Font family + thickness

CTA poga labajā pusē (vienmēr redzama desktopā)

Mobile režīmā:

header pazūd scroll-down

paliek hamburger menu

menu overlay parāda visus blokus kā anchorus

5.5. Global font scaling

Lietotājs var regulēt fontus centralizēti:

Mobile heading scale (0.5–2.0)

Mobile body scale (0.5–2.0)

Desktop heading scale

Desktop body scale

Tas pārraksta tikai CSS variables, nevis katra elementa izmēru.

6. Footer Logic

Footerā var:

pievienot statiskas satura lapas (no admin paneļa)

pievienot sociālos linkus

pievienot epastu (mailto)

pievienot telefonu (tel:)

pievienot adresi

automātiski atspoguļot uzņēmuma rekvizītus (ja tenant iestatījumos definēti)

7. Versioning

Katru reizi, kad:

publicē landing

saglabā major izmaiņas

tiek izveidota LandingVersion:

{
  "createdAt": "...",
  "snapshot": {
    "page": { ... },
    "blocks": [ ... ]
  }
}


Admins var:

apskatīt iepriekšējās versijas

atjaunot iepriekšējo

8. Contact Form Backend Requirements

Contact block uses the shared Contact Form spec (see `docs/spec.md` §7).

Additional rules specific to landing pages:

    Each landing can include exactly one primary Contact block in MVP.
    Contact block has a mode toggle:
        "B2C (event registration)" – ties the form to specific Event(s)
        "B2B (company inquiry)" – ties the form to Event Types ("hike types")
    For B2C mode:
        Block configuration points to one or more upcoming Events for this tenant.
        Form shows B2C fields and pricing as per §7.3.
    For B2B mode:
        Block configuration points to a list of Event Types ("hike types").
        Form shows B2B fields as per §7.4 (no prices, no ticket count).

9. Event Selection Logic (VERY IMPORTANT)

-----------------------------------------

B2C mode:

    Form displays ALL future Event dates linked to this Landing (for the selected Event).
    If an Event is "full" or disabled, it can be hidden or shown as "Full" – Stage 2+.
    Pricing and Early bird behaviour follow §7.3.

B2B mode:

    Form displays a dropdown of Event Types ("hike types"), not concrete dates:
        e.g. "Tumsas pārgājiens", "Ziemassvētku pārgājiens".
    Tenant can create / edit / delete Event Types in the Events admin area.
        Each Event Type configuration should mention: "Appears in B2B contact form type selector."
    No ticket prices or counts are shown for B2B submissions.

11. What Cursor MUST NOT Implement Now (Stage-3 constraints)

❌ Drag & drop reordering
❌ Full grid-based CMS editor
❌ Multi-language
❌ B2B billing and workspace management
❌ AI-generated content
❌ Advanced animation builder

12. What Cursor MUST Implement Now (Stage-3)

✔ Stabils front-end rendering
✔ Blocks + ordering
✔ Block editor
✔ Contact form + CAPTCHA + auto-save leads
✔ Optimized images
✔ Fast SSR/ISR
✔ Global fonts scaling
✔ Header + Mobile menu logic
✔ Footer configuration
✔ Versioning skeleton (no need full UI)
✔ Basic block library

13. Summary in One Sentence

Landing Builder ļauj tenantam veidot ātru, optimizētu, vizuālu marketinga lapu, izmantojot blokstruktūru bez drag-and-drop, ar mobilajām adaptācijām, CTA navigāciju, galerijām, atsauksmēm un kontaktformu ar CAPTCHA un auto-leads.


Tenant var:

14.1. Izveidot vairākas landing lapas

Nav ierobežojuma lapu skaitam.

Katra landing tiek saglabāta ar:

unikālu nosaukumu,

slug piemēram /t/[tenantSlug]/l/[landingSlug],

savu bloku struktūru,

saviem SEO/meta iestatījumiem,

savu header un footer konfigurāciju.

14.2. Rediģēt katru landing neatkarīgi

Katram landing ir atsevišķs:

bloku saraksts,

fontu skalas iestatījumi,

header un footer,

tracking kodi,

versiju vēsture.

14.3. Publicēt vai atstāt draftā

Katram landing ir status: 'draft' | 'published'.

Vienu landing var publicēt, kamēr citu tur draftā.

Publicētai lapai ir publisks URL.

Draft režīmā to redz tikai admins.

14.4. Kopēt landing

Admin panelī var piedāvāt funkciju “Duplicate Landing”.

Tiek nokopēts:

lapas saturs,

bloki,

fontu iestatījumi,

header/footer struktūra,

netiek kopēti analytics dati.

14.5. Versiju saglabāšana notiek per-landing

Katrai lapai ir sava versiju vēsture.

Atjaunošana ietekmē tikai konkrēto lapu.

14.6. Landing page neatkarīga slodze

Katras lapas SSR/ISR notiek neatkarīgi,

Lapas neietekmē viena otras ielādes ātrumus,

Tādējādi tenants var droši izveidot daudz lapas, nenoslogojot infrastruktūru.

### Block management (MVP)

The landing builder does **not** need drag-and-drop in the first version.

    Each landing version consists of an ordered list of blocks.
    The builder shows an “Add block” button with a dropdown of all available block types

  (Hero, Video, Benefits, Gallery, Testimonials, FAQ, Text+Image, Event highlight,
  Contact form, etc.).

    When the user selects a block type, that block is appended to the **end** of the

  current block list.

    Each block row in the UI must have:
        “Move up” action – swaps this block with the one above it.
        “Move down” action – swaps this block with the one below it.
        “Delete” (or “Hide”) action – removes this block from the current landing version.

The ordering is stored on the landing version, so the public page always renders blocks
in the same order as configured in the builder.

### Unified contact form block

The landing contact form aligns with the unified B2C/B2B spec and the new design reference.

#### Block-level rules

- Each landing can include **only one** contact block. The builder must disable the “add” option (and show a warning) once one exists.
- Block JSON stores:
  - `mode: "b2c" | "b2b"`
  - `allowedEventIds: string[]` (B2C mode)
  - `showHikeTypeField: boolean` (B2B mode)
  - `hikeTypeLabel: string` (per-block label for the optional dropdown)
  - `hikeTypeOptions: string[]` (free-text options shown when the toggle is enabled)
  - `testimonials: Array<{ author: string; quote: string; rating?: number }>` for the left-hand swiper panel.

#### B2C configuration (Privātpersonām)

- Admin selects upcoming events. Empty list = misconfiguration warning (“Please select at least one event”).
- Public UI:
  - If only one event, hide the dropdown and lock the choice.
  - Otherwise render “Tuvākie pārgājieni” select.
  - Show ticket count input, total price (`ticketCount × active price`), early-bird badge/timer when applicable, and marketing-consent checkbox (checked by default).
- Submissions auto-save to `EventParticipant` with `registrationStatus` updates and respect tenant `paymentMode` (Stripe vs manual).

#### B2B configuration (Uzņēmumiem)

- Admin can toggle “Ask for hike type?” to surface a dropdown backed by free-text options (not tied to Event Types).
  - When enabled the builder requires a field label and at least one option.
  - Options display exactly as entered in the public form.
- Form exposes company name, contact person, email, phone, participants count, preferred date, comment, and marketing consent.
- No pricing/total fields are shown in this mode.

#### Testimonials panel

- Contact block can render a sibling testimonials slider (per design). Content is stored per block so it is fully tenant-editable.

#### Registration behavior

- B2C submissions create/update `EventParticipant` rows with attribution (`landingId`), `marketingConsent`, `priceAtTheMoment`, and the new `registrationStatus` enum.
- B2B submissions create/update `B2BLead` rows with company/contact fields, the optional `requestedHikeType`, and `status` transitions (`draft` → `open`).
- Auto-save triggers after the first required field blur so partial data is never lost.
Blocks cannot be re-arranged by drag and drop.
Reordering is performed only by:

    Move Up
    Move Down

Each button swaps the current block with the adjacent one.
Available block types (MVP):

    hero
    textImage
    video
    gallery
    testimonials
    faq
    eventHighlight
    contactForm   ← NEW