CREATE TYPE "ExchangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

ALTER TABLE "orders" ADD COLUMN "deliveredAt" TIMESTAMPTZ(3);
UPDATE "orders" SET "deliveredAt" = "updatedAt" WHERE "status" = 'DELIVERED';

ALTER TABLE "order_items" ADD COLUMN "isSaleSnapshot" BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE "order_items" AS item
SET "isSaleSnapshot" = TRUE
FROM "product_skus" AS sku
WHERE item."skuId" = sku."id"
  AND sku."compareAtPrice" IS NOT NULL
  AND sku."compareAtPrice" > item."unitPrice";

CREATE TABLE "exchange_requests" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "requestedQuantity" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "invoiceConfirmed" BOOLEAN NOT NULL,
  "deliveryFeeAccepted" BOOLEAN NOT NULL,
  "status" "ExchangeRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "exchange_requests_requested_quantity_check" CHECK ("requestedQuantity" > 0),
  CONSTRAINT "exchange_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "exchange_requests_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "exchange_requests_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "exchange_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "exchange_requests_orderId_status_createdAt_idx" ON "exchange_requests"("orderId", "status", "createdAt");
CREATE INDEX "exchange_requests_userId_createdAt_idx" ON "exchange_requests"("userId", "createdAt");
CREATE INDEX "exchange_requests_orderItemId_status_idx" ON "exchange_requests"("orderItemId", "status");