import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <section className="space-y-6 pb-20 lg:pb-0">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Settings</p>
        <h1 className="text-3xl font-semibold tracking-tight">Tenant preferences</h1>
        <p className="text-muted-foreground">Configure branding, default pricing and notification emails (coming soon).</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Keep your look consistent across landing pages and receipts.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Brand presets editing will be available in the next sprint.</p>
        </CardContent>
      </Card>
    </section>
  );
}


