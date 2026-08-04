-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'COURIER';

-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'PREPARING';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'HANDED_TO_COURIER';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'ON_DELIVERY';

-- AlterEnum
ALTER TYPE "TransactionAction" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "TransactionAction" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "TransactionAction" ADD VALUE IF NOT EXISTS 'PREPARING';
ALTER TYPE "TransactionAction" ADD VALUE IF NOT EXISTS 'HANDED_TO_COURIER';
ALTER TYPE "TransactionAction" ADD VALUE IF NOT EXISTS 'ON_DELIVERY';

-- AlterTable
ALTER TABLE "Transaction"
  ADD COLUMN "courierId" TEXT,
  ADD COLUMN "courierLatitude" DOUBLE PRECISION,
  ADD COLUMN "courierLongitude" DOUBLE PRECISION,
  ADD COLUMN "locationUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Transaction_courierId_status_idx" ON "Transaction"("courierId", "status");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_courierId_fkey"
  FOREIGN KEY ("courierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
