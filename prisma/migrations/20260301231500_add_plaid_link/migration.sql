-- AlterTable
ALTER TABLE "MoneyCopilotAccount" ADD COLUMN "providerAccountId" TEXT;

-- AlterTable
ALTER TABLE "MoneyCopilotTransaction" ADD COLUMN "providerTransactionId" TEXT;

-- CreateTable
CREATE TABLE "PlaidItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plaidItemId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "institutionName" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaidItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MoneyCopilotAccount_providerAccountId_key" ON "MoneyCopilotAccount"("providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "MoneyCopilotTransaction_providerTransactionId_key" ON "MoneyCopilotTransaction"("providerTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaidItem_userId_plaidItemId_key" ON "PlaidItem"("userId", "plaidItemId");

-- CreateIndex
CREATE INDEX "PlaidItem_userId_updatedAt_idx" ON "PlaidItem"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "PlaidItem" ADD CONSTRAINT "PlaidItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
