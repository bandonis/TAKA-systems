import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getPrisma } from '@/lib/db';
import { BLOCK_VARIANT_IDS, getBlockVariantDefinition } from '@/lib/landings/blocks';
import { withTenantRoute, NotFoundError } from '@/lib/tenants';

export const runtime = "nodejs";

const createBlockSchema = z.object({
  variantId: z.enum(BLOCK_VARIANT_IDS)
});

export const POST = withTenantRoute<{ landingId: string }>(
  async ({ tenant, params, req }) => {
    const { landingId } = params ?? {};
    if (!landingId) {
      throw new NotFoundError('Landing not found');
    }

    const prisma = getPrisma();

    const landing = await prisma.landingPage.findFirst({
      where: { id: landingId, tenantId: tenant.tenantId },
      select: { id: true }
    });

    if (!landing) {
      throw new NotFoundError('Landing not found');
    }

    const payload = await req.json();
    const input = createBlockSchema.parse(payload);

    const definition = getBlockVariantDefinition(input.variantId);
    if (!definition) {
      throw new NotFoundError('Unsupported block type');
    }

    const aggregate = await prisma.landingBlock.aggregate({
      where: { landingId },
      _max: { orderIndex: true }
    });

    const nextOrderIndex = (aggregate._max.orderIndex ?? -1) + 1;

    const block = await prisma.landingBlock.create({
      data: {
        landingId,
        tenantId: tenant.tenantId,
        blockType: definition.blockType,
        content: definition.defaultContent,
        orderIndex: nextOrderIndex,
        visibleMobile: true,
        visibleDesktop: true
      }
    });

    return NextResponse.json({ block });
  },
  { onError: 'Unable to add block' }
);

