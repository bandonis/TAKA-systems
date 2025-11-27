import React from 'react';

export const runtime = "nodejs";

export default function SuperadminHomePage() {
  return (
    <section className="space-y-4">
      <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Superadmin</p>
      <h1 className="text-3xl font-semibold tracking-tight">Platform control center</h1>
      <p className="text-muted-foreground">
        This placeholder confirms the superadmin dashboard route loads while the full experience is built.
      </p>
    </section>
  );
}


