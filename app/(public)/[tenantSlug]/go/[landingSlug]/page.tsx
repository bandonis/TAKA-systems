import { notFound } from 'next/navigation';

import { getPrisma } from '@/lib/db';
import { cn } from '@/lib/utils';
import { TENANT_STATUS } from '@/lib/prisma/enums';
import { Button } from '@/components/ui/button';
import {
  getContactFormConfig,
  isContactFormBlock,
  parseBlockContent,
  resolveVariantIdForBlock,
  type BlockContent,
  type BlockVariantId,
  type ContactFormConfig
} from '@/lib/landings/blocks';
import { buildContactResources, type ContactResources } from '@/lib/contact/resources';
import type { LandingBlockType, Prisma } from '@prisma/client';
import { ContactFormBlock } from './_components/contact-form-block';
import { HeaderNav } from './_components/header-nav';

export const runtime = "nodejs";

type PublicLandingPageProps = {
  params: Promise<{
    tenantSlug: string;
    landingSlug: string;
  }>;
};

type LandingBlockRecord = {
  id: string;
  blockType: LandingBlockType;
  content: Prisma.JsonValue;
  visibleMobile: boolean;
  visibleDesktop: boolean;
};

const SECTION_VARIANTS: Record<string, string> = {
  hero: 'border-none bg-transparent p-0',
  contactForm: 'border-none bg-transparent p-0',
  default:
    'rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_45px_120px_-60px_rgba(6,78,59,0.8)] backdrop-blur'
};

const SECTION_ANCHORS: Partial<Record<BlockVariantId, string>> = {
  hero: 'hero',
  textImage: 'journey',
  gallery: 'gallery',
  faq: 'faq',
  contactForm: 'contact'
};

const NAV_BLUEPRINT: Array<{ anchor: string; label: string }> = [
  { anchor: 'hero', label: 'Home' },
  { anchor: 'journey', label: 'Journey' },
  { anchor: 'gallery', label: 'Gallery' },
  { anchor: 'faq', label: 'FAQ' },
  { anchor: 'contact', label: 'Contact' }
];

export default async function PublicLandingPage({ params }: PublicLandingPageProps) {
  const { tenantSlug, landingSlug } = await params;
  const prisma = getPrisma();
  const normalizedTenantSlug = tenantSlug.trim();

  const tenant = await prisma.tenant.findFirst({
    where: {
      status: TENANT_STATUS.ACTIVE,
      OR: [{ slug: normalizedTenantSlug }, { id: normalizedTenantSlug }]
    },
    select: {
      id: true,
      name: true
    }
  });

  if (!tenant) {
    notFound();
  }

  const landing = await prisma.landingPage.findFirst({
    where: {
      tenantId: tenant.id,
      slug: landingSlug
    },
    select: {
      id: true,
      title: true,
      status: true
    }
  });

  if (!landing) {
    notFound();
  }

  const blocks = await prisma.landingBlock.findMany({
    where: {
      tenantId: tenant.id,
      landingId: landing.id
    },
    orderBy: { orderIndex: 'asc' },
    select: {
      id: true,
      blockType: true,
      content: true,
      visibleMobile: true,
      visibleDesktop: true
    }
  });

  if (blocks.length === 0) {
    notFound();
  }

  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId: tenant.id },
    select: { paymentMode: true, currency: true, contactFormCopy: true }
  });

  const contactBlockRecord = blocks.find((block) => isContactFormBlock(block));
  const contactResources = contactBlockRecord
    ? await buildContactResources({
        prisma,
        tenantSlug,
        landingSlug,
        tenantId: tenant.id,
        landingId: landing.id,
        config: getContactFormConfig(contactBlockRecord),
        tenantSettings
      })
    : null;

  const isDraft = landing.status !== 'PUBLISHED';

  const availableAnchors = new Set<string>();
  for (const block of blocks) {
    const variantId = resolveVariantIdForBlock(block);
    if (variantId) {
      const anchor = SECTION_ANCHORS[variantId];
      if (anchor) {
        availableAnchors.add(anchor);
      }
    }
  }

  const navItems = NAV_BLUEPRINT.filter((item) => availableAnchors.has(item.anchor)).map((item) => ({
    label: item.label,
    href: `#${item.anchor}`
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="relative isolate">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_60%)]"
          aria-hidden
        />
        <HeaderNav tenantName={tenant.name} navItems={navItems} ctaHref="#contact" homeHref="#hero" />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
          {isDraft ? (
            <div className="rounded-xl border border-amber-300/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 shadow">
              This landing page is currently in <span className="font-semibold">Draft</span>. Publish it in the admin panel to
              share it with participants.
            </div>
          ) : null}
        {blocks.map((block) => {
          const variantId = resolveVariantIdForBlock(block);
          const content = parseBlockContent(block.content);
            const variantKey = variantId ?? 'default';
            const sectionClass = SECTION_VARIANTS[variantKey] ?? SECTION_VARIANTS.default;
            const sectionId = variantId ? SECTION_ANCHORS[variantId] : undefined;

          return (
            <section
              key={block.id}
                id={sectionId}
                className={cn(sectionClass, getVisibilityClass(block.visibleMobile, block.visibleDesktop))}
            >
              {renderLandingBlock({
                block,
                variantId,
                content,
                tenantName: tenant.name,
                landingTitle: landing.title,
                  contactResources
              })}
            </section>
          );
        })}
        </div>
      </div>
    </main>
  );
}

type RenderLandingBlockArgs = {
  block: LandingBlockRecord;
  variantId: BlockVariantId | null;
  content: BlockContent;
  tenantName: string;
  landingTitle: string;
  contactResources: ContactResources | null;
};

function renderLandingBlock({
  block,
  variantId,
  content,
  tenantName,
  landingTitle,
  contactResources
}: RenderLandingBlockArgs) {
  switch (variantId) {
    case 'hero':
      return <HeroBlock content={content} tenantName={tenantName} landingTitle={landingTitle} />;
    case 'textImage':
      return <TextImageBlock content={content} />;
    case 'video':
      return <VideoBlock content={content} />;
    case 'gallery':
      return <GalleryBlock content={content} />;
    case 'testimonials':
      return <TestimonialsBlock content={content} />;
    case 'faq':
      return <FaqBlock content={content} />;
    case 'eventHighlight':
      return <EventHighlightBlock content={content} />;
    case 'contactForm':
      return contactResources ? (
        <ContactFormBlock {...contactResources} />
      ) : (
        <p className="text-sm text-muted-foreground">Contact form is not available.</p>
      );
    default:
      return <FallbackBlock blockType={block.blockType} content={content} />;
  }
}

function HeroBlock({ content, tenantName, landingTitle }: { content: BlockContent; tenantName: string; landingTitle: string }) {
  const heading = safeString(content.heading, landingTitle);
  const subheading = safeString(content.subheading);
  const ctaLabel = safeString(content.ctaLabel, 'Get in touch');
  const ctaHref = safeString(content.ctaHref, '#contact');
  const secondaryCtaLabel = safeString(content.secondaryCtaLabel, 'Contact us');
  const backgroundSource = safeString(content.backgroundImage) || safeString(content.imageUrl);

  return (
    <div className="relative isolate overflow-hidden rounded-[40px] border border-white/10 shadow-2xl">
      {backgroundSource ? (
        <img
          src={backgroundSource}
          alt={heading || 'Landing hero'}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700" aria-hidden />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-emerald-950/60 to-slate-950/70" />
      <div className="relative z-10 px-6 py-20 text-center sm:px-10 sm:py-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
          <p className="text-xs uppercase tracking-[0.5em] text-emerald-200/90">{tenantName}</p>
          <div className="space-y-4">
            <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">{heading}</h2>
            {subheading ? <p className="text-base text-emerald-100/80 sm:text-lg">{subheading}</p> : null}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full bg-white text-emerald-900 hover:bg-white/90">
              <a href={ctaHref}>{ctaLabel}</a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-white/60 text-white hover:bg-white/10"
              asChild
            >
              <a href="#contact">{secondaryCtaLabel}</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TextImageBlock({ content }: { content: BlockContent }) {
  const title = safeString(content.title, 'Details');
  const body = safeString(content.body, 'More information coming soon.');
  const imageUrl = safeString(content.imageUrl);

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400/80">Experience</p>
        <h3 className="text-3xl font-semibold tracking-tight">{title}</h3>
        <p className="text-base leading-relaxed text-muted-foreground">{body}</p>
      </div>
      {imageUrl ? (
        <div className="overflow-hidden rounded-2xl border border-border/60 shadow-lg">
          <img src={imageUrl} alt={title || 'Landing visual'} className="h-72 w-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
          Add an image to this block to showcase the atmosphere.
        </div>
      )}
    </div>
  );
}

function VideoBlock({ content }: { content: BlockContent }) {
  const embedUrl = safeString(content.embedUrl);

  if (!embedUrl) {
    return <p className="text-sm text-muted-foreground">Video will be available soon.</p>;
  }

  return (
    <div className="aspect-video overflow-hidden rounded-3xl border border-border/60 shadow-2xl">
      <iframe src={embedUrl} title="Landing video" className="h-full w-full" allowFullScreen />
    </div>
  );
}

function GalleryBlock({ content }: { content: BlockContent }) {
  const images = Array.isArray(content.images)
    ? content.images
        .map((item) => (isRecord(item) ? { imageUrl: safeString(item.imageUrl), caption: safeString(item.caption) } : null))
        .filter((item): item is { imageUrl: string; caption: string } => !!item && !!item.imageUrl)
    : [];

  if (images.length === 0) {
    return <p className="text-sm text-muted-foreground">Gallery coming soon.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image, index) => (
        <figure key={`${image.imageUrl}-${index}`} className="overflow-hidden rounded-2xl border border-border/60 shadow">
          <img
            src={image.imageUrl}
            alt={image.caption || `Gallery image ${index + 1}`}
            className="h-56 w-full object-cover"
            loading="lazy"
          />
          {image.caption ? <figcaption className="px-3 py-2 text-xs text-muted-foreground">{image.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}

function TestimonialsBlock({ content }: { content: BlockContent }) {
  const items = Array.isArray(content.items)
    ? content.items
        .map((item) => (isRecord(item) ? { author: safeString(item.author, 'Anonymous'), text: safeString(item.text) } : null))
        .filter((item): item is { author: string; text: string } => !!item && !!item.text)
    : [];

  if (!items.length) {
    return <p className="text-sm text-muted-foreground">Testimonials will appear soon.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item, idx) => (
        <blockquote
          key={`${item.author}-${idx}`}
          className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-sm"
        >
          <p className="text-base font-medium text-foreground">&ldquo;{item.text}&rdquo;</p>
          <p className="mt-3 text-sm text-muted-foreground">— {item.author}</p>
        </blockquote>
      ))}
    </div>
  );
}

function FaqBlock({ content }: { content: BlockContent }) {
  const items = Array.isArray(content.items)
    ? content.items
        .map((item) => (isRecord(item) ? { question: safeString(item.question), answer: safeString(item.answer) } : null))
        .filter((item): item is { question: string; answer: string } => !!item && !!item.question)
    : [];

  if (!items.length) {
    return <p className="text-sm text-muted-foreground">FAQ is being prepared.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <details
          key={`${item.question}-${idx}`}
          className="group rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm transition hover:border-emerald-300/70"
        >
          <summary className="cursor-pointer list-none text-base font-semibold text-foreground">
            {item.question}
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {item.answer || 'Details coming soon.'}
          </p>
        </details>
      ))}
    </div>
  );
}

function EventHighlightBlock({ content }: { content: BlockContent }) {
  const title = safeString(content.title, 'Event highlight');
  const body = safeString(content.body, 'More details coming soon.');

  return (
    <div className="space-y-3 rounded-3xl border border-border/60 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-lg">
      <p className="text-xs uppercase tracking-[0.4em] text-emerald-600">Highlight</p>
      <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
      <p className="text-base text-slate-600">{body}</p>
    </div>
  );
}

function FallbackBlock({ blockType, content }: { blockType: LandingBlockType; content: BlockContent }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-muted-foreground">{blockType}</p>
      <pre className="overflow-auto rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">{JSON.stringify(content, null, 2)}</pre>
    </div>
  );
}


function getVisibilityClass(visibleMobile: boolean, visibleDesktop: boolean) {
  if (!visibleMobile && !visibleDesktop) {
    return 'hidden';
  }
  if (!visibleMobile) {
    return 'hidden md:block';
  }
  if (!visibleDesktop) {
    return 'block md:hidden';
  }
  return '';
}

function safeString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
