import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function PublicHomePage() {
  return (
    <section className="flex flex-col gap-8">
      <div className="space-y-4 text-balance">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Tenant landing</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Showcase signature adventures.</h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          This area renders tenant-specific public experiences powered by the landing builder. Each block remains modular so
          organizers can reorder and A/B test their funnel with zero engineering help.
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
