ALTER TABLE "tenant_users" ADD COLUMN "staffRole" TEXT NOT NULL DEFAULT 'Custom Staff';
ALTER TABLE "tenant_users" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "tenant_users" ADD COLUMN "allowedFeaturesJson" TEXT NOT NULL DEFAULT '[]';