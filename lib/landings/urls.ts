type LandingPublicPathParams = {
  tenantSlug: string;
  landingSlug: string;
};

function encodeSegment(value: string) {
  return encodeURIComponent(value.trim());
}

// tenantSlug currently equals the tenant ID; slugs/custom domains will map here later.
export function getLandingPublicPath({ tenantSlug, landingSlug }: LandingPublicPathParams) {
  return `/${encodeSegment(tenantSlug)}/go/${encodeSegment(landingSlug)}`;
}


