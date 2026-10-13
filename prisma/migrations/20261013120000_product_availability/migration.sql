CREATE TYPE "ProductAvailability" AS ENUM ('AVAILABLE', 'IN_TRANSIT');

ALTER TABLE "products"
  ADD COLUMN "availability" "ProductAvailability" NOT NULL DEFAULT 'AVAILABLE',
  ADD COLUMN "shippingDurationDays" INTEGER,
  ADD CONSTRAINT "products_shipping_duration_days_check"
    CHECK ("shippingDurationDays" IS NULL OR "shippingDurationDays" BETWEEN 1 AND 365);