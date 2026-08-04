ALTER TABLE "Transaction"
  ADD COLUMN "deliveryAddress" TEXT,
  ADD COLUMN "deliveryLatitude" DOUBLE PRECISION,
  ADD COLUMN "deliveryLongitude" DOUBLE PRECISION;

-- Existing orders predate delivery tracking and cannot be geocoded reliably.
UPDATE "Transaction"
SET "deliveryAddress" = 'Alamat tidak tersedia', "deliveryLatitude" = 0, "deliveryLongitude" = 0
WHERE "deliveryAddress" IS NULL;

ALTER TABLE "Transaction"
  ALTER COLUMN "deliveryAddress" SET NOT NULL,
  ALTER COLUMN "deliveryLatitude" SET NOT NULL,
  ALTER COLUMN "deliveryLongitude" SET NOT NULL;
