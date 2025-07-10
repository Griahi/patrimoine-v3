-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "debtType" TEXT NOT NULL DEFAULT 'LOAN',
    "initialAmount" REAL NOT NULL,
    "currentAmount" REAL NOT NULL,
    "interestRate" REAL NOT NULL,
    "duration" INTEGER NOT NULL,
    "amortizationType" TEXT NOT NULL DEFAULT 'PROGRESSIVE',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "monthlyPayment" REAL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "lender" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "debts_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "debt_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "debtId" TEXT NOT NULL,
    "paymentNumber" INTEGER NOT NULL,
    "paymentDate" DATETIME NOT NULL,
    "totalAmount" REAL NOT NULL,
    "principalAmount" REAL NOT NULL,
    "interestAmount" REAL NOT NULL,
    "remainingBalance" REAL NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "actualPaymentDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "debt_payments_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "debts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
