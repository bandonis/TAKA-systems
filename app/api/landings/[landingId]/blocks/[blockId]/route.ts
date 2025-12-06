import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { getPrisma } from '@/lib/db';
import { buildContactFormContent, isContactFormBlock } from '@/lib/landings/blocks';
import { withTenantRoute, BadRequestError, NotFoundError } from '@/lib/tenants';

export const runtime = "nodejs";

const testimonialSchema = z.object({
  id: z.string().optional(),
  author: z.string().min(1),
  quote: z.string().min(1),
  rating: z.number().min(1).max(5).optional()
});

const updateBlockSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('move'),
    direction: z.enum(['up', 'down'])
  }),
  z.object({
    action: z.literal('visibility'),
    visibleMobile: z.boolean(),
    visibleDesktop: z.boolean()
  }),
  z.object({
    action: z.literal('contactConfig'),
    mode: z.enum(['b2c', 'b2b']),
    allowedEventIds: z.array(z.string()),
    showHikeTypeField: z.boolean().optional(),
    hikeTypeLabel: z.string().max(80).optional(),
    hikeTypeOptions: z.array(z.string()),
    testimonials: z.array(testimonialSchema)
  })
]);

export const PATCH = withTenantRoute<{ landingId: string; blockId: string }>(
  async ({ tenant, params, req }) => {
    const { landingId, blockId } = params ?? {};

    if (!landingId || !blockId) {
      throw new NotFoundError('Block not found');
    }

    const prisma = getPrisma();

    const block = await prisma.landingBlock.findFirst({
      where: { id: blockId, landingId, tenantId: tenant.tenantId }
    });

    if (!block) {
      throw new NotFoundError('Block not found');
    }

    const payload = await req.json();
    const input = updateBlockSchema.parse(payload);

    if (input.action === 'visibility') {
      await prisma.landingBlock.update({
        where: { id: block.id },
        data: {
          visibleMobile: input.visibleMobile,
          visibleDesktop: input.visibleDesktop
        }
      });

      return NextResponse.json({ blockId: block.id });
    }

    if (input.action === 'move') {
      return moveBlock(prisma, {
        tenantId: tenant.tenantId,
        landingId,
        blockId: block.id,
        orderIndex: block.orderIndex,
        direction: input.direction
      });
    }

    if (!isContactFormBlock(block)) {
      throw new BadRequestError('Only contact form blocks support this configuration');
    }

    const uniqueEventIds = Array.from(new Set(input.allowedEventIds));
    const showHikeTypeField = input.showHikeTypeField === true;
    const hikeTypeLabel = (input.hikeTypeLabel ?? 'Hike type').trim() || 'Hike type';
    const hikeTypeOptions = Array.from(
      new Set(
        input.hikeTypeOptions
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      )
    );

    if (uniqueEventIds.length > 0) {
      const validCount = await prisma.event.count({
        where: {
          tenantId: tenant.tenantId,
          id: { in: uniqueEventIds }
        }
      });

      if (validCount !== uniqueEventIds.length) {
        throw new BadRequestError('One or more events are invalid.');
      }
    }

    if (showHikeTypeField && hikeTypeOptions.length === 0) {
      throw new BadRequestError('At least one hike type option is required when the field is enabled.');
    }

    const testimonials = input.testimonials.map((item, index) => ({
      id: item.id ?? `testimonial-${index}`,
      author: item.author,
      quote: item.quote,
      rating: item.rating
    }));

    await prisma.landingBlock.update({
      where: { id: block.id },
      data: {
        content: (buildContactFormContent(block, {
          mode: input.mode,
          allowedEventIds: uniqueEventIds,
          showHikeTypeField,
          hikeTypeLabel,
          hikeTypeOptions,
          testimonials
        }) ?? Prisma.JsonNull) as Prisma.InputJsonValue
      }
    });

    return NextResponse.json({ blockId: block.id });
  },
  { onError: 'Unable to update block' }
);

export const DELETE = withTenantRoute<{ landingId: string; blockId: string }>(
  async ({ tenant, params }) => {
    const { landingId, blockId } = params ?? {};

    if (!landingId || !blockId) {
      throw new NotFoundError('Block not found');
    }

    const prisma = getPrisma();

    const block = await prisma.landingBlock.findFirst({
      where: { id: blockId, landingId, tenantId: tenant.tenantId },
      select: { id: true, orderIndex: true }
    });

    if (!block) {
      throw new NotFoundError('Block not found');
    }

    await prisma.$transaction([
      prisma.landingBlock.delete({ where: { id: block.id } }),
      prisma.landingBlock.updateMany({
        where: {
          landingId,
          tenantId: tenant.tenantId,
          orderIndex: { gt: block.orderIndex }
        },
        data: { orderIndex: { decrement: 1 } }
      })
    ]);

    return NextResponse.json({ blockId: block.id });
  },
  { onError: 'Unable to delete block' }
);

async function moveBlock(
  prisma: ReturnType<typeof getPrisma>,
  args: { tenantId: string; landingId: string; blockId: string; orderIndex: number; direction: 'up' | 'down' }
) {
  const neighbor = await prisma.landingBlock.findFirst({
    where: {
      landingId: args.landingId,
      tenantId: args.tenantId,
      orderIndex: args.direction === 'up' ? { lt: args.orderIndex } : { gt: args.orderIndex }
    },
    orderBy: { orderIndex: args.direction === 'up' ? 'desc' : 'asc' }
  });

  if (!neighbor) {
    return NextResponse.json({ blockId: args.blockId, swapped: false });
  }

  await prisma.$transaction([
    prisma.landingBlock.update({
      where: { id: args.blockId },
      data: { orderIndex: neighbor.orderIndex }
    }),
    prisma.landingBlock.update({
      where: { id: neighbor.id },
      data: { orderIndex: args.orderIndex }
    })
  ]);

  return NextResponse.json({ blockId: args.blockId, swapped: true });
}

