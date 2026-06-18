ALTER TABLE "MoneyCopilotAccount"
ADD COLUMN "accountMask" TEXT,
ADD COLUMN "routingNumberSuffix" TEXT,
ADD COLUMN "bankVerificationStatus" TEXT,
ADD COLUMN "verificationName" TEXT,
ADD COLUMN "persistentAccountId" TEXT,
ADD COLUMN "holderCategory" TEXT,
ADD COLUMN "isTokenizedAccountNumber" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "PlaidItem"
ADD COLUMN "authMethod" TEXT;

CREATE INDEX "MoneyCopilotAccount_userId_bankVerificationStatus_idx"
ON "MoneyCopilotAccount"("userId", "bankVerificationStatus");
