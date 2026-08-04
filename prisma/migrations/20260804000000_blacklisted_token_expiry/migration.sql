ALTER TABLE "BlacklistedToken" ADD COLUMN "expiresAt" TIMESTAMP(3);

UPDATE "BlacklistedToken"
SET "expiresAt" = "createdAt" + INTERVAL '7 days'
WHERE "expiresAt" IS NULL;

ALTER TABLE "BlacklistedToken" ALTER COLUMN "expiresAt" SET NOT NULL;
CREATE INDEX "BlacklistedToken_expiresAt_idx" ON "BlacklistedToken"("expiresAt");
