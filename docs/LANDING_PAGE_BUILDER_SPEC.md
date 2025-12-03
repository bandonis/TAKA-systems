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

CAPTCHA obligāts

Auto-save lead pēc 1. lauka aizpildīšanas

Atšķirīgi mode:

B2B → saglabā B2BLead

B2C → saglabā EventParticipant (pending)

Cenas aprēķins no central event rules

GDPR checkbox (optional, Stage 4)

9. Event Selection Logic (VERY IMPORTANT)
For B2C

Formā tiek rādīti VISI pieejamie nākamie eventu datumi šim eventam.

Ja kādam eventam nav vietu → disable, bet joprojām rādīt (“Pilns”).

For B2B

Rādās event types (Tumsas pārgājiens, Ziemassvētku pārgājiens).

Neviens konkrēts datums nav jāizvēlas.

10. Publishing Logic

Kad landing ir “published”:

tiek veidots statisks HTML (ISR recommended)

tiek injectēti third-party scripts

tiek konvertēti visi block data React komponentēs

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

### Contact form and event selection

The landing contact form is responsible for registering participants to events.
To keep the system simple, there is only **one** contact form type, with a configurable
list of events.

#### Event selection model

    Each landing version may include at most one **Contact form** block.
    The Contact form block has a configuration field, e.g. `allowedEventIds: string[]`,

  that stores the list of events that are allowed for this landing.

    In the admin UI, when editing the Contact form block, the user can:
        search and select one or more upcoming events owned by the same tenant;
        remove events from this list at any time.

There is no explicit “single vs multi event mode” switch:

    If `allowedEventIds.length === 0`:
        This is considered a misconfiguration; the builder should show a warning

    (e.g. “Please select at least one event for this contact form”).

    The public page may hide the form or show a generic error.

    If `allowedEventIds.length === 1`:

    The form behaves as a **single-event** registration form.
    The public UI may hide the event dropdown and implicitly use that event,

    or render a disabled select with a single option. In both cases, the
    submitted registration is linked to that one event.

    If `allowedEventIds.length > 1`:
        The public form must show an **Event** select field where the participant

    chooses one of the configured events (e.g. “Darkness hike – Dec 5”, “Mindfulness
    hike – Dec 12”, etc.).

    On submit, the registration is linked to the selected event.

#### Registration behavior

    Submissions from the landing contact form create `EventParticipant` records,

  exactly like registrations from the public event page.

    Each participant created from a landing contact form should store a reference

  to the landing page / landing version as the **source**, e.g. sourceLandingId
  or `sourceLandingSlug`, so analytics can later answer “Which landing generated
  this registration?”.

The UX goal: a tenant can create one “Darkness hikes” landing page with a rich,
evergreen description and let participants choose among multiple concrete future
event dates directly in the contact form, without creating separate landings for
each date.

There is no separate “single event” mode. The contact form always supports
multiple events. A “single event” case is simply when allowedEventIds has one item.
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