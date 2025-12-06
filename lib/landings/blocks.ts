import type { LandingBlock, LandingBlockType, Prisma } from '@prisma/client';

export const BLOCK_VARIANT_IDS = [
  'hero',
  'textImage',
  'video',
  'gallery',
  'testimonials',
  'faq',
  'eventHighlight',
  'contactForm'
] as const;

export type BlockVariantId = (typeof BLOCK_VARIANT_IDS)[number];

type BlockVariantDefinition = {
  id: BlockVariantId;
  label: string;
  description: string;
  blockType: LandingBlockType;
  variant?: string;
  defaultContent: Prisma.JsonValue;
};

export type BlockContent = Record<string, unknown> & {
  variant?: string;
  config?: Record<string, unknown>;
};

export type ContactFormTestimonial = {
  id: string;
  author: string;
  quote: string;
  rating?: number;
};

export type ContactFormMode = 'b2c' | 'b2b';

export type ContactFormConfig = {
  mode: ContactFormMode;
  allowedEventIds: string[];
  allowedEventTypeIds: string[];
  testimonials: ContactFormTestimonial[];
};

export const CONTACT_FORM_VARIANT = 'contactForm';

export const BLOCK_VARIANTS: BlockVariantDefinition[] = [
  {
    id: 'hero',
    label: 'Hero',
    description: 'Top-fold section with heading, subheading, and CTA.',
    blockType: 'HERO',
    defaultContent: {
      heading: 'Headline for your adventure',
      subheading: 'Describe why this experience matters.',
      ctaLabel: 'Register now',
      ctaHref: '#contact',
      variant: 'hero'
    }
  },
  {
    id: 'textImage',
    label: 'Text & image',
    description: 'Split layout highlighting details with imagery.',
    blockType: 'IMAGE_LEFT',
    defaultContent: {
      title: 'Immersive experience',
      body: 'Share what participants can expect. Keep it short.',
      imageUrl: null,
      variant: 'textImage'
    }
  },
  {
    id: 'video',
    label: 'Video',
    description: 'Embed a teaser video or recap.',
    blockType: 'CUSTOM_HTML',
    defaultContent: {
      variant: 'video',
      embedUrl: ''
    }
  },
  {
    id: 'gallery',
    label: 'Gallery',
    description: 'Grid of highlight images.',
    blockType: 'GALLERY',
    defaultContent: {
      images: [],
      variant: 'gallery'
    }
  },
  {
    id: 'testimonials',
    label: 'Testimonials',
    description: 'Quotes from past participants.',
    blockType: 'TESTIMONIALS',
    defaultContent: {
      items: [],
      variant: 'testimonials'
    }
  },
  {
    id: 'faq',
    label: 'FAQ',
    description: 'Frequently asked questions.',
    blockType: 'FAQ',
    defaultContent: {
      items: [],
      variant: 'faq'
    }
  },
  {
    id: 'eventHighlight',
    label: 'Event highlight',
    description: 'Spotlight a specific date or feature.',
    blockType: 'BENEFITS',
    defaultContent: {
      title: 'Upcoming highlight',
      body: 'Use this to spotlight a key moment.',
      variant: 'eventHighlight'
    }
  },
  {
    id: 'contactForm',
    label: 'Contact form',
    description: 'Capture registrations for events or business inquiries.',
    blockType: 'CUSTOM_HTML',
    variant: CONTACT_FORM_VARIANT,
    defaultContent: {
      heading: 'Ready to join?',
      description: 'Pick a date and tell us a bit about you.',
      config: {
        mode: 'b2c',
        allowedEventIds: [],
        allowedEventTypeIds: [],
        testimonials: []
      },
      variant: CONTACT_FORM_VARIANT
    }
  }
];

const BLOCK_VARIANT_MAP = new Map<BlockVariantId, BlockVariantDefinition>(BLOCK_VARIANTS.map((variant) => [variant.id, variant]));

export function isBlockVariantId(value: string): value is BlockVariantId {
  return BLOCK_VARIANT_MAP.has(value as BlockVariantId);
}

export function getBlockVariantDefinition(id: BlockVariantId) {
  return BLOCK_VARIANT_MAP.get(id) ?? null;
}

export function parseBlockContent(content: Prisma.JsonValue | null | undefined): BlockContent {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return {};
  }
  return content as BlockContent;
}

export function resolveVariantIdForBlock(block: Pick<LandingBlock, 'blockType' | 'content'>): BlockVariantId | null {
  const parsed = parseBlockContent(block.content);
  const variantKey = parsed.variant;

  if (variantKey && isBlockVariantId(variantKey)) {
    return variantKey;
  }

  const fallback = BLOCK_VARIANTS.find(
    (definition) => definition.blockType === block.blockType && definition.variant === undefined
  );

  return fallback?.id ?? null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeTestimonials(value: unknown): ContactFormTestimonial[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item, index) => {
      if (!isPlainObject(item) || typeof item.quote !== 'string' || typeof item.author !== 'string') {
        return null;
      }
      const ratingValue = typeof item.rating === 'number' ? item.rating : undefined;
      const idValue = typeof item.id === 'string' && item.id.length > 0 ? item.id : `testimonial-${index}`;
      return { id: idValue, author: item.author, quote: item.quote, rating: ratingValue };
    })
    .filter((item): item is ContactFormTestimonial => item !== null);
}

export function getContactFormConfig(block: Pick<LandingBlock, 'content'>): ContactFormConfig {
  const parsed = parseBlockContent(block.content);
  const maybeConfig = parsed.config;

  if (isPlainObject(maybeConfig)) {
    return {
      mode: maybeConfig.mode === 'b2b' ? 'b2b' : 'b2c',
      allowedEventIds: Array.isArray(maybeConfig.allowedEventIds)
        ? (maybeConfig.allowedEventIds as string[]).filter((id): id is string => typeof id === 'string')
        : [],
      allowedEventTypeIds: Array.isArray(maybeConfig.allowedEventTypeIds)
        ? (maybeConfig.allowedEventTypeIds as string[]).filter((id): id is string => typeof id === 'string')
        : [],
      testimonials: normalizeTestimonials(maybeConfig.testimonials)
    };
  }

  return {
    mode: 'b2c',
    allowedEventIds: [],
    allowedEventTypeIds: [],
    testimonials: []
  };
}

export function buildContactFormContent(block: Pick<LandingBlock, 'content'>, config: ContactFormConfig) {
  const parsed = parseBlockContent(block.content);
  const nextConfig = {
    ...(isPlainObject(parsed.config) ? parsed.config : {}),
    mode: config.mode,
    allowedEventIds: config.allowedEventIds,
    allowedEventTypeIds: config.allowedEventTypeIds,
    testimonials: config.testimonials
  };

  return {
    ...parsed,
    variant: CONTACT_FORM_VARIANT,
    config: nextConfig
  };
}

export function isContactFormBlock(block: Pick<LandingBlock, 'blockType' | 'content'>) {
  return resolveVariantIdForBlock(block) === 'contactForm';
}

