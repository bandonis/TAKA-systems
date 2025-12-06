import type { PrismaClient } from '@prisma/client';

import { getContactFormConfig, isContactFormBlock } from '@/lib/landings/blocks';

export async function getLandingContactContext(prisma: PrismaClient, landingId: string) {
  const landing = await prisma.landingPage.findUnique({
    where: { id: landingId },
    select: {
      id: true,
      slug: true,
      tenantId: true,
      tenant: { select: { slug: true } },
      blocks: {
        select: {
          id: true,
          blockType: true,
          content: true
        }
      }
    }
  });

  if (!landing) {
    return null;
  }

  const contactBlock = landing.blocks.find((block) => isContactFormBlock(block));

  if (!contactBlock) {
    return null;
  }

  return {
    landingId: landing.id,
    landingSlug: landing.slug,
    tenantId: landing.tenantId,
    tenantSlug: landing.tenant?.slug ?? landing.tenantId,
    blockId: contactBlock.id,
    config: getContactFormConfig(contactBlock)
  };
}
