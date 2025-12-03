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

export type ContactFormConfig = {
  allowedEventIds: string[];
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
    description: 'Capture registrations tied to events.',
    blockType: 'CUSTOM_HTML',
    variant: CONTACT_FORM_VARIANT,
    defaultContent: {
      heading: 'Ready to join?',
      description: 'Pick a date and tell us a bit about you.',
      config: {
        allowedEventIds: []
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

export function getContactFormConfig(block: Pick<LandingBlock, 'content'>): ContactFormConfig {
  const parsed = parseBlockContent(block.content);
  const maybeConfig = parsed.config;

  if (isPlainObject(maybeConfig)) {
    const allowed = maybeConfig.allowedEventIds;
    if (Array.isArray(allowed) && allowed.every((item) => typeof item === 'string')) {
      return { allowedEventIds: allowed as string[] };
    }
  }

  return { allowedEventIds: [] };
}

export function buildContactFormContent(block: Pick<LandingBlock, 'content'>, config: ContactFormConfig) {
  const parsed = parseBlockContent(block.content);
  const nextConfig = {
    ...(isPlainObject(parsed.config) ? parsed.config : {}),
    allowedEventIds: config.allowedEventIds
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

