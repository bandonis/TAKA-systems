import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';

import { getSession } from '@/lib/auth/cookies';
import { getPrisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BLOCK_VARIANTS, getContactFormConfig, isContactFormBlock, resolveVariantIdForBlock } from '@/lib/landings/blocks';
import { getLandingPublicPath } from '@/lib/landings/urls';

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
  const { landing, tenantId, tenantSlug } = await getLandingData(landingId);
  const events = await getUpcomingEvents(tenantId);
  const publicPath = getLandingPublicPath({ tenantSlug, landingSlug: landing.slug });

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
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Header</CardTitle>
            <CardDescription>Control the public title, slug, and publish status.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={publicPath} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Preview
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <LandingHeaderForm landingId={landing.id} title={landing.title} slug={landing.slug} status={landing.status} />
          <p className="mt-4 text-xs text-muted-foreground">
            Public URL: <code className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{publicPath}</code>
          </p>
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
              const isContactForm = isContactFormBlock(block);
              const contactConfig = isContactForm ? getContactFormConfig(block) : { allowedEventIds: [] };

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
                  isContactForm={isContactForm}
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

  const tenantId = session.tenantId;
  const tenantSlug = tenantId; // TODO: replace with real slug / custom domain mapping later
  const prisma = getPrisma();

  const landing = await prisma.landingPage.findFirst({
    where: { id: landingId, tenantId },
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

  return { landing, tenantId, tenantSlug };
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

