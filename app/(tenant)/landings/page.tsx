import { randomBytes } from 'crypto';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import type { LandingBlock, LandingStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { getSession } from '@/lib/auth/cookies';
import { getPrisma } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildContactFormContent, getBlockVariantDefinition } from '@/lib/landings/blocks';

import { CreateLandingButton } from './_components/create-landing-button';
import { LandingDeleteButton } from './_components/landing-delete-button';

const LANDING_STATUS_META: Record<LandingStatus, { label: string; variant: 'success' | 'outline' }> = {
  PUBLISHED: { label: 'Published', variant: 'success' },
  DRAFT: { label: 'Draft', variant: 'outline' }
};

async function getTenantLandings() {
  const session = await getSession();

  if (!session?.tenantId) {
    redirect('/');
  }

  const prisma = getPrisma();

  const landings = await prisma.landingPage.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, slug: true, status: true, createdAt: true }
  });

  return landings.map((landing) => ({
    ...landing,
    statusBadge: LANDING_STATUS_META[landing.status]
  }));
}

export default async function LandingsPage() {
  const landings = await getTenantLandings();

  return (
    <section className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Landing pages</p>
          <h1 className="text-3xl font-semibold tracking-tight">Control the public story</h1>
          <p className="text-muted-foreground">Preview, edit, and publish the pages that introduce your adventures.</p>
        </div>
        <form action={createLandingAction} className="w-full sm:w-auto">
          <CreateLandingButton />
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your landing pages</CardTitle>
          <CardDescription>Create new concepts and keep track of every landing scoped to this tenant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {landings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase text-muted-foreground">
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium">Slug</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {landings.map((landing) => (
                    <tr key={landing.id}>
                      <td className="py-3 text-right">
                        <p className="font-medium text-foreground">{landing.title}</p>
                        <p className="text-xs text-muted-foreground">ID · {landing.id.slice(0, 6)}…</p>
                      </td>
                      <td className="py-3">
                        <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">/{landing.slug}</code>
                      </td>
                      <td className="py-3">
                        <Badge variant={landing.statusBadge.variant}>{landing.statusBadge.label}</Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {landing.createdAt.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button size="sm" asChild>
                            <Link href={`/landings/${landing.id}`}>Edit</Link>
                          </Button>
                          <LandingDeleteButton
                            landingId={landing.id}
                            landingTitle={landing.title}
                            buttonLabel="Delete"
                            className="flex-shrink-0"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No landing pages yet. Use the button above to launch your first one.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

async function createLandingAction() {
  'use server';

  const session = await getSession();

  const tenantId = session?.tenantId;

  if (!tenantId) {
    redirect('/');
  }

  const prisma = getPrisma();
  const slug = await generateLandingSlug(prisma, tenantId);

  const heroDefinition = getBlockVariantDefinition('hero');
  const contactDefinition = getBlockVariantDefinition('contactForm');

  if (!heroDefinition || !contactDefinition) {
    throw new Error('Required block definitions are missing.');
  }

  const landing = await prisma.$transaction(async (tx) => {
    const createdLanding = await tx.landingPage.create({
      data: {
        tenantId,
        title: 'New landing page',
        slug,
        status: 'DRAFT'
      }
    });

    await tx.landingBlock.create({
      data: {
        landingId: createdLanding.id,
        tenantId,
        blockType: heroDefinition.blockType,
        content: (heroDefinition.defaultContent ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        orderIndex: 0,
        visibleMobile: true,
        visibleDesktop: true
      }
    });

    const contactContent = buildContactFormContent(
      { content: contactDefinition.defaultContent } as Pick<LandingBlock, 'content'>,
      { allowedEventIds: [] }
    );

    await tx.landingBlock.create({
      data: {
        landingId: createdLanding.id,
        tenantId,
        blockType: contactDefinition.blockType,
        content: (contactContent ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        orderIndex: 1,
        visibleMobile: true,
        visibleDesktop: true
      }
    });

    return createdLanding;
  });

  redirect(`/landings/${landing.id}`);
}

async function generateLandingSlug(prisma: ReturnType<typeof getPrisma>, tenantId: string) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `landing-${randomBytes(3).toString('hex')}`;
    const existing = await prisma.landingPage.findFirst({
      where: { tenantId, slug: candidate },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error('Unable to generate unique slug. Please retry.');
}

