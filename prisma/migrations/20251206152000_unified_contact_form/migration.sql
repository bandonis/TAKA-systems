-- Unified contact form + payment mode updates
DO $$ BEGIN
    CREATE TYPE "RegistrationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_PAYMENT', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMode" AS ENUM ('STRIPE', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "B2BLeadStatus" AS ENUM ('DRAFT', 'OPEN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "TenantSettings"
    ADD COLUMN IF NOT EXISTS "paymentMode" "PaymentMode",
    ADD COLUMN IF NOT EXISTS "contactFormCopy" JSONB;
ALTER TABLE "TenantSettings" ALTER COLUMN "paymentMode" SET DEFAULT 'STRIPE';
UPDATE "TenantSettings" SET "paymentMode" = 'STRIPE' WHERE "paymentMode" IS NULL;

ALTER TABLE "EventParticipant"
    ADD COLUMN IF NOT EXISTS "priceAtTheMoment" DECIMAL(12, 2),
    ADD COLUMN IF NOT EXISTS "marketingConsent" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN IF NOT EXISTS "comment" TEXT;
ALTER TABLE "EventParticipant" ALTER COLUMN "ticketCount" DROP NOT NULL;

ALTER TABLE "B2BLead"
    ADD COLUMN IF NOT EXISTS "companyPerson" TEXT,
    ADD COLUMN IF NOT EXISTS "companyEmail" TEXT,
    ADD COLUMN IF NOT EXISTS "companyPhone" TEXT,
    ADD COLUMN IF NOT EXISTS "marketingConsent" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "ticketCount" INTEGER,
    ADD COLUMN IF NOT EXISTS "eventTypeId" TEXT,
    ADD COLUMN IF NOT EXISTS "priceAtTheMoment" DECIMAL(12, 2),
    ADD COLUMN IF NOT EXISTS "preferredDate" TEXT,
    ADD COLUMN IF NOT EXISTS "status" "B2BLeadStatus" DEFAULT 'DRAFT';

UPDATE "B2BLead" SET "status" = 'DRAFT' WHERE "status" IS NULL;

DO $$ BEGIN
    ALTER TABLE "B2BLead" ADD CONSTRAINT "B2BLead_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "B2BLead_eventTypeId_idx" ON "B2BLead"("eventTypeId");
