import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function PublicHomePage() {
  return (
    <section className="flex flex-col gap-8">
      <div className="space-y-4 text-balance">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Welcome to TAKA</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Showcase your adventures with beautiful landings.</h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          Spin up branded landing pages for every retreat, hike, or corporate offsite. Publish in minutes, capture sign-ups, and
          keep every tenant experience consistent.
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/auth/register-tenant">Create your tenant</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/auth/login">Already have an account? Log in</Link>
        </Button>
      </div>
    </section>
  );
}
