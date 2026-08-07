CREATE TABLE "pos_laybys" (
 "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "laybyNumber" TEXT NOT NULL, "customerId" TEXT NOT NULL, "customerName" TEXT NOT NULL,
 "shiftId" TEXT, "status" TEXT NOT NULL DEFAULT 'ACTIVE', "subtotal" DOUBLE PRECISION NOT NULL, "tax" DOUBLE PRECISION NOT NULL,
 "totalAmount" DOUBLE PRECISION NOT NULL, "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "remainingBalance" DOUBLE PRECISION NOT NULL,
 "expiryDate" TIMESTAMP(3) NOT NULL, "notes" TEXT NOT NULL DEFAULT '', "createdByUserId" TEXT NOT NULL, "completedOrderId" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "pos_laybys_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "pos_layby_items" (
 "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "laybyId" TEXT NOT NULL, "productId" TEXT NOT NULL, "productName" TEXT NOT NULL,
 "quantity" INTEGER NOT NULL, "unitPrice" DOUBLE PRECISION NOT NULL, "serialNumbers" TEXT NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "pos_layby_items_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "pos_layby_payments" (
 "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "laybyId" TEXT NOT NULL, "shiftId" TEXT, "amount" DOUBLE PRECISION NOT NULL,
 "method" TEXT NOT NULL, "reference" TEXT, "receiptNumber" TEXT NOT NULL, "receivedByUserId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "pos_layby_payments_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "pos_manager_approvals" (
 "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "action" TEXT NOT NULL, "entityId" TEXT, "amount" DOUBLE PRECISION,
 "reason" TEXT NOT NULL, "requestedByUserId" TEXT NOT NULL, "approvedByUserId" TEXT NOT NULL, "usedAt" TIMESTAMP(3),
 "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "pos_manager_approvals_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "pos_payment_authorizations" (
 "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "shiftId" TEXT NOT NULL, "amount" DOUBLE PRECISION NOT NULL, "method" TEXT NOT NULL,
 "provider" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING', "providerReference" TEXT, "requestedByUserId" TEXT NOT NULL,
 "confirmedByUserId" TEXT, "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "pos_payment_authorizations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pos_laybys_tenantId_laybyNumber_key" ON "pos_laybys"("tenantId", "laybyNumber");
CREATE INDEX "pos_laybys_tenantId_status_expiryDate_idx" ON "pos_laybys"("tenantId", "status", "expiryDate");
CREATE INDEX "pos_laybys_tenantId_customerId_idx" ON "pos_laybys"("tenantId", "customerId");
CREATE INDEX "pos_layby_items_tenantId_laybyId_idx" ON "pos_layby_items"("tenantId", "laybyId");
CREATE INDEX "pos_layby_items_tenantId_productId_idx" ON "pos_layby_items"("tenantId", "productId");
CREATE UNIQUE INDEX "pos_layby_payments_tenantId_receiptNumber_key" ON "pos_layby_payments"("tenantId", "receiptNumber");
CREATE INDEX "pos_layby_payments_tenantId_laybyId_createdAt_idx" ON "pos_layby_payments"("tenantId", "laybyId", "createdAt");
CREATE INDEX "pos_manager_approvals_tenantId_action_expiresAt_idx" ON "pos_manager_approvals"("tenantId", "action", "expiresAt");
CREATE INDEX "pos_payment_authorizations_tenantId_shiftId_status_idx" ON "pos_payment_authorizations"("tenantId", "shiftId", "status");
CREATE INDEX "pos_payment_authorizations_tenantId_providerReference_idx" ON "pos_payment_authorizations"("tenantId", "providerReference");
ALTER TABLE "pos_laybys" ADD CONSTRAINT "pos_laybys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_layby_items" ADD CONSTRAINT "pos_layby_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_layby_items" ADD CONSTRAINT "pos_layby_items_laybyId_fkey" FOREIGN KEY ("laybyId") REFERENCES "pos_laybys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_layby_payments" ADD CONSTRAINT "pos_layby_payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_layby_payments" ADD CONSTRAINT "pos_layby_payments_laybyId_fkey" FOREIGN KEY ("laybyId") REFERENCES "pos_laybys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_manager_approvals" ADD CONSTRAINT "pos_manager_approvals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_payment_authorizations" ADD CONSTRAINT "pos_payment_authorizations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
