-- CreateTable
CREATE TABLE "SquareConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "merchantName" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenType" TEXT,
    "scopes" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "status" TEXT NOT NULL DEFAULT 'connected',
    "expiresAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SquareConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SquareLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "squareConnectionId" TEXT NOT NULL,
    "squareLocationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SquareLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SquareBankAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "squareConnectionId" TEXT NOT NULL,
    "squareBankAccountId" TEXT NOT NULL,
    "bankName" TEXT,
    "accountType" TEXT,
    "routingSuffix" TEXT,
    "accountSuffix" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SquareBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SquarePayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "squareConnectionId" TEXT NOT NULL,
    "squarePaymentId" TEXT NOT NULL,
    "squareLocationId" TEXT,
    "orderId" TEXT,
    "customerId" TEXT,
    "status" TEXT NOT NULL,
    "sourceType" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "tipAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "processingFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "approvedAt" TIMESTAMP(3),
    "createdAtSquare" TIMESTAMP(3) NOT NULL,
    "updatedAtSquare" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SquarePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SquareRefund" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "squareConnectionId" TEXT NOT NULL,
    "squarePaymentId" TEXT,
    "squareRefundId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAtSquare" TIMESTAMP(3) NOT NULL,
    "updatedAtSquare" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SquareRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SquarePayout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "squareConnectionId" TEXT NOT NULL,
    "squarePayoutId" TEXT NOT NULL,
    "squareBankAccountId" TEXT,
    "squareLocationId" TEXT,
    "status" TEXT NOT NULL,
    "payoutType" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "feeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "arrivalDate" TIMESTAMP(3),
    "paidOutAt" TIMESTAMP(3),
    "createdAtSquare" TIMESTAMP(3) NOT NULL,
    "updatedAtSquare" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SquarePayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SquareTransferRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "squareConnectionId" TEXT,
    "fromSource" TEXT NOT NULL,
    "toSource" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "executionRail" TEXT NOT NULL DEFAULT 'manual',
    "squareReferenceId" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SquareTransferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SquareConnection_userId_merchantId_key" ON "SquareConnection"("userId", "merchantId");

-- CreateIndex
CREATE INDEX "SquareConnection_userId_status_updatedAt_idx" ON "SquareConnection"("userId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SquareLocation_squareConnectionId_squareLocationId_key" ON "SquareLocation"("squareConnectionId", "squareLocationId");

-- CreateIndex
CREATE INDEX "SquareLocation_userId_updatedAt_idx" ON "SquareLocation"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SquareBankAccount_squareConnectionId_squareBankAccountId_key" ON "SquareBankAccount"("squareConnectionId", "squareBankAccountId");

-- CreateIndex
CREATE INDEX "SquareBankAccount_userId_updatedAt_idx" ON "SquareBankAccount"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SquarePayment_squareConnectionId_squarePaymentId_key" ON "SquarePayment"("squareConnectionId", "squarePaymentId");

-- CreateIndex
CREATE INDEX "SquarePayment_userId_approvedAt_idx" ON "SquarePayment"("userId", "approvedAt");

-- CreateIndex
CREATE INDEX "SquarePayment_squareConnectionId_createdAtSquare_idx" ON "SquarePayment"("squareConnectionId", "createdAtSquare");

-- CreateIndex
CREATE UNIQUE INDEX "SquareRefund_squareConnectionId_squareRefundId_key" ON "SquareRefund"("squareConnectionId", "squareRefundId");

-- CreateIndex
CREATE INDEX "SquareRefund_userId_createdAtSquare_idx" ON "SquareRefund"("userId", "createdAtSquare");

-- CreateIndex
CREATE UNIQUE INDEX "SquarePayout_squareConnectionId_squarePayoutId_key" ON "SquarePayout"("squareConnectionId", "squarePayoutId");

-- CreateIndex
CREATE INDEX "SquarePayout_userId_arrivalDate_idx" ON "SquarePayout"("userId", "arrivalDate");

-- CreateIndex
CREATE INDEX "SquarePayout_squareConnectionId_createdAtSquare_idx" ON "SquarePayout"("squareConnectionId", "createdAtSquare");

-- CreateIndex
CREATE INDEX "SquareTransferRequest_userId_status_createdAt_idx" ON "SquareTransferRequest"("userId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "SquareConnection" ADD CONSTRAINT "SquareConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquareLocation" ADD CONSTRAINT "SquareLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquareLocation" ADD CONSTRAINT "SquareLocation_squareConnectionId_fkey" FOREIGN KEY ("squareConnectionId") REFERENCES "SquareConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquareBankAccount" ADD CONSTRAINT "SquareBankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquareBankAccount" ADD CONSTRAINT "SquareBankAccount_squareConnectionId_fkey" FOREIGN KEY ("squareConnectionId") REFERENCES "SquareConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquarePayment" ADD CONSTRAINT "SquarePayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquarePayment" ADD CONSTRAINT "SquarePayment_squareConnectionId_fkey" FOREIGN KEY ("squareConnectionId") REFERENCES "SquareConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquareRefund" ADD CONSTRAINT "SquareRefund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquareRefund" ADD CONSTRAINT "SquareRefund_squareConnectionId_fkey" FOREIGN KEY ("squareConnectionId") REFERENCES "SquareConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquareRefund" ADD CONSTRAINT "SquareRefund_squarePaymentId_fkey" FOREIGN KEY ("squarePaymentId") REFERENCES "SquarePayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquarePayout" ADD CONSTRAINT "SquarePayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquarePayout" ADD CONSTRAINT "SquarePayout_squareConnectionId_fkey" FOREIGN KEY ("squareConnectionId") REFERENCES "SquareConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquarePayout" ADD CONSTRAINT "SquarePayout_squareBankAccountId_fkey" FOREIGN KEY ("squareBankAccountId") REFERENCES "SquareBankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquareTransferRequest" ADD CONSTRAINT "SquareTransferRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquareTransferRequest" ADD CONSTRAINT "SquareTransferRequest_squareConnectionId_fkey" FOREIGN KEY ("squareConnectionId") REFERENCES "SquareConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
