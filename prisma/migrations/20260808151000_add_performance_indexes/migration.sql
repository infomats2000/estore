CREATE INDEX "products_tenantId_name_idx" ON "products"("tenantId", "name");
CREATE INDEX "customers_tenantId_name_idx" ON "customers"("tenantId", "name");
CREATE INDEX "orders_tenantId_createdAt_idx" ON "orders"("tenantId", "createdAt");
CREATE INDEX "orders_tenantId_status_createdAt_idx" ON "orders"("tenantId", "status", "createdAt");
CREATE INDEX "orders_tenantId_paymentStatus_createdAt_idx" ON "orders"("tenantId", "paymentStatus", "createdAt");
CREATE INDEX "activity_logs_tenantId_createdAt_idx" ON "activity_logs"("tenantId", "createdAt");
CREATE INDEX "pos_payments_tenantId_createdAt_idx" ON "pos_payments"("tenantId", "createdAt");
CREATE INDEX "inventory_movements_tenantId_createdAt_idx" ON "inventory_movements"("tenantId", "createdAt");
