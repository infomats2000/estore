CREATE TABLE "tenant_state_records" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tenant_state_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_state_records_tenantId_domain_recordId_key"
  ON "tenant_state_records"("tenantId", "domain", "recordId");

CREATE INDEX "tenant_state_records_tenantId_domain_updatedAt_idx"
  ON "tenant_state_records"("tenantId", "domain", "updatedAt");

ALTER TABLE "tenant_state_records"
  ADD CONSTRAINT "tenant_state_records_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
