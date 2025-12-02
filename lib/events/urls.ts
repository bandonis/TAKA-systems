type PublicEventPathParams = {
  tenantSlug: string;
  eventSlug: string;
};

function getPublicBaseUrl() {
  const base = process.env.PUBLIC_URL?.trim() || 'http://localhost:3000';
  return base.replace(/\/$/, '');
}

function encodeSegment(value: string) {
  return encodeURIComponent(value.trim());
}

export function getPublicEventPath({ tenantSlug, eventSlug }: PublicEventPathParams) {
  return `/t/${encodeSegment(tenantSlug)}/e/${encodeSegment(eventSlug)}`;
}

export function getPublicEventUrl(params: PublicEventPathParams) {
  return `${getPublicBaseUrl()}${getPublicEventPath(params)}`;
}


