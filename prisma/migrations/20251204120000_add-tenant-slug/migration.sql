-- Add nullable slug column for tenant public paths.
ALTER TABLE "Tenant" ADD COLUMN "slug" TEXT;

-- Ensure tenant slugs remain unique when present.
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

