-- CreateTable
CREATE TABLE "Operator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'buyer',
    "name" TEXT,
    "nwcConnection" TEXT,
    "payoutLightningAddress" TEXT,
    "allowAllSellers" BOOLEAN NOT NULL DEFAULT true,
    "spendCapDailySats" INTEGER NOT NULL DEFAULT 0,
    "spendUsedTodaySats" INTEGER NOT NULL DEFAULT 0,
    "spendResetAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apiKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SellerAllowlistEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operatorId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    CONSTRAINT "SellerAllowlistEntry_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "inputSchema" JSONB NOT NULL,
    "outputSchema" JSONB NOT NULL,
    "priceSats" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "successRate" REAL NOT NULL DEFAULT 1.0,
    "avgLatencyMs" INTEGER NOT NULL DEFAULT 0,
    "reputation" REAL NOT NULL DEFAULT 5.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Operator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "amountSats" INTEGER NOT NULL,
    "railInvoiceRef" TEXT NOT NULL,
    "railPaymentHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "output" JSONB,
    "verificationResult" TEXT,
    "failureNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" DATETIME,
    "settledAt" DATETIME,
    CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Operator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Operator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operatorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLogEntry_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InsightsCache" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "content" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Operator_email_key" ON "Operator"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Operator_apiKey_key" ON "Operator"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "SellerAllowlistEntry_operatorId_sellerId_key" ON "SellerAllowlistEntry"("operatorId", "sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_railPaymentHash_key" ON "Order"("railPaymentHash");
