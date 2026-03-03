-- CreateEnum
CREATE TYPE "TransactionAction" AS ENUM ('CREATED', 'ITEM_ADD', 'PAYMENT_STARTED', 'PAID', 'PAYMENT_FAILED', 'CANCELLED', 'STOCK_DEDUCTED');

-- CreateTable
CREATE TABLE "TransactionLog" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "action" "TransactionAction" NOT NULL,
    "message" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionLog_transactionId_idx" ON "TransactionLog"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionLog_action_idx" ON "TransactionLog"("action");

-- CreateIndex
CREATE INDEX "TransactionLog_createdAt_idx" ON "TransactionLog"("createdAt");

-- AddForeignKey
ALTER TABLE "TransactionLog" ADD CONSTRAINT "TransactionLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
