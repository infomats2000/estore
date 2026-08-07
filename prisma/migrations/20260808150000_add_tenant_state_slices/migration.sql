CREATE TABLE "tenant_state_slices" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tenant_state_slices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_state_slices_tenantId_key_key"
  ON "tenant_state_slices"("tenantId", "key");

CREATE INDEX "tenant_state_slices_tenantId_updatedAt_idx"
  ON "tenant_state_slices"("tenantId", "updatedAt");

ALTER TABLE "tenant_state_slices"
  ADD CONSTRAINT "tenant_state_slices_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
