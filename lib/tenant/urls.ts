export type TenantSlugSource = {
  id: string;
  slug: string | null;
};

export function getTenantPublicSlug(tenant: TenantSlugSource): string {
  const raw = (tenant.slug ?? '').trim();
  if (raw.length > 0) {
    return raw;
  }
  return tenant.id;
}

