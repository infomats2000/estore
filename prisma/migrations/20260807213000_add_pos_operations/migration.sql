CREATE TABLE "pos_register_shifts" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "registerId" TEXT NOT NULL,
  "openedByUserId" TEXT NOT NULL, "closedByUserId" TEXT, "status" TEXT NOT NULL DEFAULT 'OPEN',
  "openingFloat" DOUBLE PRECISION NOT NULL DEFAULT 0, "expectedCash" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "countedCash" DOUBLE PRECISION, "variance" DOUBLE PRECISION, "varianceReason" TEXT NOT NULL DEFAULT '',
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "closedAt" TIMESTAMP(3),
  CONSTRAINT "pos_register_shifts_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "pos_cash_movements" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "shiftId" TEXT NOT NULL, "type" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL, "reason" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pos_cash_movements_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "pos_payments" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "shiftId" TEXT, "orderId" TEXT NOT NULL,
  "method" TEXT NOT NULL, "amount" DOUBLE PRECISION NOT NULL, "reference" TEXT, "status" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pos_payments_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "pos_returns" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "returnNumber" TEXT NOT NULL, "orderId" TEXT NOT NULL,
  "shiftId" TEXT, "status" TEXT NOT NULL DEFAULT 'COMPLETED', "refundMethod" TEXT NOT NULL,
  "refundAmount" DOUBLE PRECISION NOT NULL, "reason" TEXT NOT NULL, "processedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pos_returns_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "pos_return_items" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "returnId" TEXT NOT NULL, "orderItemId" TEXT NOT NULL,
  "productId" TEXT NOT NULL, "quantity" INTEGER NOT NULL, "serialNumber" TEXT, "unitRefund" DOUBLE PRECISION NOT NULL,
  "disposition" TEXT NOT NULL, "restocked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pos_return_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "pos_register_shifts_tenantId_registerId_status_idx" ON "pos_register_shifts"("tenantId", "registerId", "status");
CREATE INDEX "pos_register_shifts_tenantId_openedAt_idx" ON "pos_register_shifts"("tenantId", "openedAt");
CREATE INDEX "pos_cash_movements_tenantId_shiftId_createdAt_idx" ON "pos_cash_movements"("tenantId", "shiftId", "createdAt");
CREATE UNIQUE INDEX "pos_payments_tenantId_idempotencyKey_method_key" ON "pos_payments"("tenantId", "idempotencyKey", "method");
CREATE INDEX "pos_payments_tenantId_orderId_idx" ON "pos_payments"("tenantId", "orderId");
CREATE INDEX "pos_payments_tenantId_shiftId_idx" ON "pos_payments"("tenantId", "shiftId");
CREATE UNIQUE INDEX "pos_returns_tenantId_returnNumber_key" ON "pos_returns"("tenantId", "returnNumber");
CREATE INDEX "pos_returns_tenantId_orderId_idx" ON "pos_returns"("tenantId", "orderId");
CREATE INDEX "pos_returns_tenantId_createdAt_idx" ON "pos_returns"("tenantId", "createdAt");
CREATE INDEX "pos_return_items_tenantId_returnId_idx" ON "pos_return_items"("tenantId", "returnId");
CREATE INDEX "pos_return_items_tenantId_orderItemId_idx" ON "pos_return_items"("tenantId", "orderItemId");
CREATE INDEX "pos_return_items_tenantId_serialNumber_idx" ON "pos_return_items"("tenantId", "serialNumber");
ALTER TABLE "pos_register_shifts" ADD CONSTRAINT "pos_register_shifts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_cash_movements" ADD CONSTRAINT "pos_cash_movements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_cash_movements" ADD CONSTRAINT "pos_cash_movements_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "pos_register_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_payments" ADD CONSTRAINT "pos_payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_payments" ADD CONSTRAINT "pos_payments_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "pos_register_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pos_returns" ADD CONSTRAINT "pos_returns_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_returns" ADD CONSTRAINT "pos_returns_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "pos_register_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pos_return_items" ADD CONSTRAINT "pos_return_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_return_items" ADD CONSTRAINT "pos_return_items_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "pos_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
