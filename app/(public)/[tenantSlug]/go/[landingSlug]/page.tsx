import { notFound } from 'next/navigation';

import { getPrisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TENANT_STATUS } from '@/lib/prisma/enums';
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

  return (
    <main className="bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8">
        {isDraft ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This landing page is currently in <span className="font-semibold">Draft</span>. Publish it in the admin panel to
            share it with participants.
          </div>
        ) : null}
        <header className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">{tenant.name}</p>
          <h1 className="text-4xl font-semibold tracking-tight">{landing.title}</h1>
        </header>

        {blocks.map((block) => {
          const variantId = resolveVariantIdForBlock(block);
          const content = parseBlockContent(block.content);

          return (
            <section
              key={block.id}
              className={cn(
                'rounded-2xl border border-border bg-card/60 p-6 shadow-sm',
                getVisibilityClass(block.visibleMobile, block.visibleDesktop)
              )}
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

  return (
    <div className="space-y-4 text-center">
      <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{tenantName}</p>
      <h2 className="text-4xl font-semibold tracking-tight">{heading}</h2>
      {subheading ? <p className="text-base text-muted-foreground">{subheading}</p> : null}
      <div className="flex justify-center">
        <Button asChild>
          <a href={ctaHref}>{ctaLabel}</a>
        </Button>
      </div>
    </div>
  );
}

function TextImageBlock({ content }: { content: BlockContent }) {
  const title = safeString(content.title, 'Details');
  const body = safeString(content.body, 'More information coming soon.');
  const imageUrl = safeString(content.imageUrl);

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center">
      <div className="flex-1 space-y-2">
        <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
        <p className="text-base text-muted-foreground">{body}</p>
      </div>
      {imageUrl ? (
        <div className="flex-1 overflow-hidden rounded-xl border border-border">
          <img src={imageUrl} alt={title || 'Landing visual'} className="h-64 w-full object-cover" loading="lazy" />
        </div>
      ) : null}
    </div>
  );
}

function VideoBlock({ content }: { content: BlockContent }) {
  const embedUrl = safeString(content.embedUrl);

  if (!embedUrl) {
    return <p className="text-sm text-muted-foreground">Video will be available soon.</p>;
  }

  return (
    <div className="aspect-video overflow-hidden rounded-xl border border-border bg-black">
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
    <div className="grid gap-3 sm:grid-cols-2">
      {images.map((image, index) => (
        <figure key={`${image.imageUrl}-${index}`} className="overflow-hidden rounded-xl border border-border">
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
    <div className="space-y-4">
      {items.map((item, idx) => (
        <blockquote key={`${item.author}-${idx}`} className="rounded-xl border border-border bg-background/70 p-4">
          <p className="text-base text-foreground">&ldquo;{item.text}&rdquo;</p>
          <p className="mt-2 text-sm text-muted-foreground">— {item.author}</p>
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
    <div className="divide-y divide-border rounded-xl border border-border">
      {items.map((item, idx) => (
        <details key={`${item.question}-${idx}`} className="group">
          <summary className="cursor-pointer list-none px-4 py-3 font-medium text-foreground">{item.question}</summary>
          <p className="px-4 pb-4 text-sm text-muted-foreground">{item.answer || 'Details coming soon.'}</p>
        </details>
      ))}
    </div>
  );
}

function EventHighlightBlock({ content }: { content: BlockContent }) {
  const title = safeString(content.title, 'Event highlight');
  const body = safeString(content.body, 'More details coming soon.');

  return (
    <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Highlight</p>
      <h3 className="text-2xl font-semibold">{title}</h3>
      <p className="text-base text-muted-foreground">{body}</p>
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
