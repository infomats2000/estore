CREATE TABLE "inbound_jobs" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "jobNumber" TEXT NOT NULL,
  "jobType" TEXT NOT NULL DEFAULT 'SUPPLIER_RECEIPT', "status" TEXT NOT NULL DEFAULT 'RECEIVING',
  "priority" TEXT NOT NULL DEFAULT 'NORMAL', "purchaseOrderRef" TEXT, "supplierName" TEXT NOT NULL,
  "warehouseId" TEXT, "receivingLocation" TEXT NOT NULL DEFAULT 'RECEIVING-QUARANTINE',
  "supplierInvoiceNumber" TEXT, "deliveryDocketNumber" TEXT, "carrier" TEXT, "trackingNumber" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "receivedByUserId" TEXT,
  "assignedToUserId" TEXT, "notes" TEXT NOT NULL DEFAULT '', "holdReason" TEXT,
  "completedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "inbound_jobs_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "inbound_job_items" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "inboundJobId" TEXT NOT NULL,
  "purchaseOrderLineRef" TEXT, "productId" TEXT, "productName" TEXT NOT NULL,
  "itemType" TEXT NOT NULL DEFAULT 'NEW_STOCK', "internalAssetNumber" TEXT,
  "manufacturerSerial" TEXT, "serviceTag" TEXT, "imei" TEXT, "batchNumber" TEXT,
  "expectedQuantity" INTEGER NOT NULL DEFAULT 1, "deliveredQuantity" INTEGER NOT NULL DEFAULT 1,
  "acceptedQuantity" INTEGER NOT NULL DEFAULT 1, "rejectedQuantity" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'AWAITING_IDENTIFICATION', "currentStep" TEXT NOT NULL DEFAULT 'IDENTIFICATION',
  "currentLocation" TEXT NOT NULL DEFAULT 'RECEIVING-QUARANTINE', "destinationWarehouseId" TEXT,
  "destinationBin" TEXT, "purchaseCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "landedCost" DOUBLE PRECISION NOT NULL DEFAULT 0, "grade" TEXT, "sellable" BOOLEAN NOT NULL DEFAULT false,
  "finalDisposition" TEXT, "holdReason" TEXT, "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "inbound_job_items_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "inbound_job_steps" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "inboundJobItemId" TEXT NOT NULL,
  "stepKey" TEXT NOT NULL, "sequence" INTEGER NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING',
  "required" BOOLEAN NOT NULL DEFAULT true, "result" TEXT, "dataJson" TEXT NOT NULL DEFAULT '{}',
  "notes" TEXT NOT NULL DEFAULT '', "completedByUserId" TEXT, "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "inbound_job_steps_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "goods_receipts" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "inboundJobId" TEXT NOT NULL,
  "grnNumber" TEXT NOT NULL, "purchaseOrderRef" TEXT, "supplierInvoiceNumber" TEXT,
  "deliveryDocketNumber" TEXT, "status" TEXT NOT NULL DEFAULT 'POSTED_TO_QUARANTINE',
  "quantitiesJson" TEXT NOT NULL DEFAULT '[]', "receivedByUserId" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "notes" TEXT NOT NULL DEFAULT '',
  CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "inventory_movements" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "inboundJobId" TEXT, "inboundJobItemId" TEXT,
  "productId" TEXT, "movementType" TEXT NOT NULL, "quantity" INTEGER NOT NULL,
  "fromStockType" TEXT, "toStockType" TEXT NOT NULL, "fromLocation" TEXT, "toLocation" TEXT,
  "reference" TEXT, "performedByUserId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "inbound_jobs_tenantId_jobNumber_key" ON "inbound_jobs"("tenantId", "jobNumber");
CREATE INDEX "inbound_jobs_tenantId_status_idx" ON "inbound_jobs"("tenantId", "status");
CREATE INDEX "inbound_jobs_tenantId_purchaseOrderRef_idx" ON "inbound_jobs"("tenantId", "purchaseOrderRef");
CREATE UNIQUE INDEX "inbound_job_items_tenantId_manufacturerSerial_key" ON "inbound_job_items"("tenantId", "manufacturerSerial");
CREATE UNIQUE INDEX "inbound_job_items_tenantId_internalAssetNumber_key" ON "inbound_job_items"("tenantId", "internalAssetNumber");
CREATE INDEX "inbound_job_items_tenantId_inboundJobId_idx" ON "inbound_job_items"("tenantId", "inboundJobId");
CREATE INDEX "inbound_job_items_tenantId_status_idx" ON "inbound_job_items"("tenantId", "status");
CREATE UNIQUE INDEX "inbound_job_steps_inboundJobItemId_stepKey_key" ON "inbound_job_steps"("inboundJobItemId", "stepKey");
CREATE INDEX "inbound_job_steps_tenantId_status_idx" ON "inbound_job_steps"("tenantId", "status");
CREATE UNIQUE INDEX "goods_receipts_tenantId_grnNumber_key" ON "goods_receipts"("tenantId", "grnNumber");
CREATE INDEX "goods_receipts_tenantId_inboundJobId_idx" ON "goods_receipts"("tenantId", "inboundJobId");
CREATE INDEX "inventory_movements_tenantId_productId_idx" ON "inventory_movements"("tenantId", "productId");
CREATE INDEX "inventory_movements_tenantId_inboundJobId_idx" ON "inventory_movements"("tenantId", "inboundJobId");
ALTER TABLE "inbound_jobs" ADD CONSTRAINT "inbound_jobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inbound_job_items" ADD CONSTRAINT "inbound_job_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inbound_job_items" ADD CONSTRAINT "inbound_job_items_inboundJobId_fkey" FOREIGN KEY ("inboundJobId") REFERENCES "inbound_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inbound_job_steps" ADD CONSTRAINT "inbound_job_steps_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inbound_job_steps" ADD CONSTRAINT "inbound_job_steps_inboundJobItemId_fkey" FOREIGN KEY ("inboundJobItemId") REFERENCES "inbound_job_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_inboundJobId_fkey" FOREIGN KEY ("inboundJobId") REFERENCES "inbound_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inboundJobId_fkey" FOREIGN KEY ("inboundJobId") REFERENCES "inbound_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inboundJobItemId_fkey" FOREIGN KEY ("inboundJobItemId") REFERENCES "inbound_job_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
