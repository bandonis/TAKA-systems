type LandingPublicPathParams = {
  tenantSlug: string;
  landingSlug: string;
};

function encodeSegment(value: string) {
  return encodeURIComponent(value.trim());
}

// tenantSlug should already be normalized via getTenantPublicSlug (falls back to tenant.id if missing)
export function getLandingPublicPath({ tenantSlug, landingSlug }: LandingPublicPathParams) {
  return `/${encodeSegment(tenantSlug)}/go/${encodeSegment(landingSlug)}`;
}


