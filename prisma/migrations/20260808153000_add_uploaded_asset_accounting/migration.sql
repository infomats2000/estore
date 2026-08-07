CREATE TABLE "uploaded_assets" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL DEFAULT 'image/webp',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uploaded_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uploaded_assets_tenantId_path_key" ON "uploaded_assets"("tenantId", "path");
CREATE INDEX "uploaded_assets_tenantId_createdAt_idx" ON "uploaded_assets"("tenantId", "createdAt");
ALTER TABLE "uploaded_assets" ADD CONSTRAINT "uploaded_assets_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
