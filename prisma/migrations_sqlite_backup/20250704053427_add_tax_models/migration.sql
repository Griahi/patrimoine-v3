-- CreateTable
CREATE TABLE "tax_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tmi" REAL NOT NULL,
    "foyer" TEXT NOT NULL,
    "nbParts" REAL NOT NULL,
    "income" REAL NOT NULL,
    "riskTolerance" TEXT NOT NULL,
    "optimizationGoals" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tax_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tax_optimizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "estimatedSavings" REAL NOT NULL,
    "actualSavings" REAL,
    "status" TEXT NOT NULL,
    "data" JSONB,
    "notes" TEXT,
    "proposedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tax_optimizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tax_simulations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "scenarios" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tax_simulations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tax_calculations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "IR" REAL NOT NULL,
    "IFI" REAL NOT NULL,
    "plusValues" REAL NOT NULL,
    "prelevementsSociaux" REAL NOT NULL,
    "taxeFonciere" REAL NOT NULL,
    "total" REAL NOT NULL,
    "patrimonySnapshot" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tax_calculations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tax_profiles_userId_key" ON "tax_profiles"("userId");

-- CreateIndex
CREATE INDEX "tax_optimizations_userId_idx" ON "tax_optimizations"("userId");

-- CreateIndex
CREATE INDEX "tax_optimizations_category_idx" ON "tax_optimizations"("category");

-- CreateIndex
CREATE INDEX "tax_optimizations_status_idx" ON "tax_optimizations"("status");

-- CreateIndex
CREATE INDEX "tax_simulations_userId_idx" ON "tax_simulations"("userId");

-- CreateIndex
CREATE INDEX "tax_calculations_userId_taxYear_idx" ON "tax_calculations"("userId", "taxYear");
