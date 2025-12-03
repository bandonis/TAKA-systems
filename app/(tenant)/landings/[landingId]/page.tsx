import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { getSession } from '@/lib/auth/cookies';
import { getPrisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BLOCK_VARIANTS, getContactFormConfig, isContactFormBlock, resolveVariantIdForBlock } from '@/lib/landings/blocks';

import { AddBlockControl } from './_components/add-block-control';
import { BlockCard } from './_components/block-card';
import { LandingHeaderForm } from './_components/landing-header-form';

type EventOption = {
  id: string;
  title: string;
  dateLabel: string;
};

const blockOptionsForAdd = BLOCK_VARIANTS.map((variant) => ({
  id: variant.id,
  label: variant.label,
  description: variant.description
}));

export default async function LandingDetailPage({ params }: { params: Promise<{ landingId: string }> }) {
  const { landingId } = await params;
  const { landing, tenantId } = await getLandingData(landingId);
  const events = await getUpcomingEvents(tenantId);

  return (
    <section className="space-y-6 pb-24 lg:pb-0">
      <div className="flex flex-col gap-3">
        <Button asChild variant="ghost" size="sm" className="w-fit px-0 text-muted-foreground hover:text-foreground">
          <Link href="/landings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Landings
          </Link>
        </Button>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Landing</p>
          <h1 className="text-3xl font-semibold tracking-tight">{landing.title}</h1>
          <p className="text-sm text-muted-foreground">Slug · /{landing.slug}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Header</CardTitle>
          <CardDescription>Control the public title, slug, and publish status.</CardDescription>
        </CardHeader>
        <CardContent>
          <LandingHeaderForm landingId={landing.id} title={landing.title} slug={landing.slug} status={landing.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blocks</CardTitle>
          <CardDescription>Reorder, toggle visibility, and configure each block for this landing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {landing.blocks.length ? (
            landing.blocks.map((block, index) => {
              const variantId = resolveVariantIdForBlock(block);
              const variantDefinition = variantId ? BLOCK_VARIANTS.find((variant) => variant.id === variantId) : null;
              const displayLabel = variantDefinition?.label ?? block.blockType;
              const contactConfig = isContactFormBlock(block) ? getContactFormConfig(block) : { allowedEventIds: [] };

              return (
                <BlockCard
                  key={block.id}
                  landingId={landing.id}
                  blockId={block.id}
                  orderLabel={`Block #${block.orderIndex + 1}`}
                  variantLabel={displayLabel}
                  blockTypeLabel={block.blockType}
                  blockIdentifier={`#${block.id.slice(0, 8)}…`}
                  canMoveUp={index > 0}
                  canMoveDown={index < landing.blocks.length - 1}
                  visibleMobile={block.visibleMobile}
                  visibleDesktop={block.visibleDesktop}
                  isContactForm={isContactFormBlock(block)}
                  contactWarning={isContactFormBlock(block) && contactConfig.allowedEventIds.length === 0}
                  contactConfig={contactConfig}
                  events={events}
                />
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No blocks yet. Use the control below to add your first block.
            </div>
          )}

          <AddBlockControl landingId={landing.id} options={blockOptionsForAdd} />
        </CardContent>
      </Card>
    </section>
  );
}

async function getLandingData(landingId: string) {
  const session = await getSession();

  if (!session?.tenantId) {
    redirect('/');
  }

  const prisma = getPrisma();

  const landing = await prisma.landingPage.findFirst({
    where: { id: landingId, tenantId: session.tenantId },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      blocks: {
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          orderIndex: true,
          blockType: true,
          visibleMobile: true,
          visibleDesktop: true,
          updatedAt: true,
          content: true
        }
      }
    }
  });

  if (!landing) {
    notFound();
  }

  return { landing, tenantId: session.tenantId };
}

async function getUpcomingEvents(tenantId: string): Promise<EventOption[]> {
  const prisma = getPrisma();
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      tenantId,
      date: { gte: now }
    },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      title: true,
      date: true
    }
  });

  const formatter = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric'
  });

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    dateLabel: formatter.format(event.date)
  }));
}

