import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth/cookies';
import { getPrisma } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const statusMeta = {
  published: { label: 'Published', variant: 'success' as const },
  draft: { label: 'Draft', variant: 'outline' as const }
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
    select: {
      id: true,
      title: true,
      slug: true,
      publishedVersionId: true,
      createdAt: true
    }
  });

  return landings.map((landing) => ({
    ...landing,
    status: landing.publishedVersionId ? statusMeta.published : statusMeta.draft
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
        <Button variant="outline" disabled>
          Coming soon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your landing pages</CardTitle>
          <CardDescription>Each page is scoped to this tenant and listed newest first.</CardDescription>
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
                      <td className="py-3">
                        <p className="font-medium text-foreground">{landing.title}</p>
                        <p className="text-xs text-muted-foreground">ID · {landing.id.slice(0, 6)}…</p>
                      </td>
                      <td className="py-3">
                        <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">/{landing.slug}</code>
                      </td>
                      <td className="py-3">
                        <Badge variant={landing.status.variant}>{landing.status.label}</Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {landing.createdAt.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 text-right">
                        <Button size="sm" asChild>
                          <Link href={`/landings/${landing.id}`}>Edit</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No landing pages yet. You’ll be able to create one soon.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

