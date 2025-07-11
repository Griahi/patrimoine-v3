/*
  Warnings:

  - You are about to alter the column `threshold` on the `alert_preferences` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `balance` on the `bridge_accounts` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to drop the column `performanceMetrics` on the `dashboard_analytics` table. All the data in the column will be lost.
  - You are about to drop the column `suggestionStats` on the `dashboard_analytics` table. All the data in the column will be lost.
  - You are about to drop the column `userClusters` on the `dashboard_analytics` table. All the data in the column will be lost.
  - You are about to drop the column `widgetUsageStats` on the `dashboard_analytics` table. All the data in the column will be lost.
  - You are about to alter the column `confidence` on the `dashboard_suggestions` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `interestAmount` on the `debt_payments` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `principalAmount` on the `debt_payments` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `remainingBalance` on the `debt_payments` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `totalAmount` on the `debt_payments` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `currentAmount` on the `debts` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `initialAmount` on the `debts` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `interestRate` on the `debts` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `monthlyPayment` on the `debts` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `percentage` on the `ownerships` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `IFI` on the `tax_calculations` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `IR` on the `tax_calculations` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `plusValues` on the `tax_calculations` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `prelevementsSociaux` on the `tax_calculations` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `taxeFonciere` on the `tax_calculations` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `total` on the `tax_calculations` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `actualSavings` on the `tax_optimizations` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `estimatedSavings` on the `tax_optimizations` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `income` on the `tax_profiles` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `nbParts` on the `tax_profiles` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `tmi` on the `tax_profiles` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `averageSessionTime` on the `user_behaviors` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `value` on the `valuations` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to drop the column `clickX` on the `widget_interactions` table. All the data in the column will be lost.
  - You are about to drop the column `clickY` on the `widget_interactions` table. All the data in the column will be lost.
  - You are about to drop the column `params` on the `widget_interactions` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `widget_interactions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,name]` on the table `dashboard_layouts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deviceBreakdown` to the `dashboard_analytics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `layoutDistribution` to the `dashboard_analytics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mostUsedWidgets` to the `dashboard_analytics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `dashboard_analytics` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "dashboard_layouts_userId_isActive_key";

-- CreateTable
CREATE TABLE "projection_scenarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "baselineSnapshot" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "projection_scenarios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "projection_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "executionDate" DATETIME NOT NULL,
    "targetAssetId" TEXT,
    "assetType" TEXT,
    "amount" DECIMAL NOT NULL,
    "parameters" JSONB NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "projection_actions_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "projection_scenarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "projection_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeHorizon" TEXT NOT NULL,
    "projectionData" JSONB NOT NULL,
    "metrics" JSONB NOT NULL,
    "insights" JSONB,
    CONSTRAINT "projection_results_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "projection_scenarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_alert_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "threshold" DECIMAL,
    "frequency" TEXT NOT NULL DEFAULT 'immediate',
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "alert_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_alert_preferences" ("alertType", "createdAt", "emailEnabled", "enabled", "frequency", "id", "pushEnabled", "threshold", "updatedAt", "userId") SELECT "alertType", "createdAt", "emailEnabled", "enabled", "frequency", "id", "pushEnabled", "threshold", "updatedAt", "userId" FROM "alert_preferences";
DROP TABLE "alert_preferences";
ALTER TABLE "new_alert_preferences" RENAME TO "alert_preferences";
CREATE UNIQUE INDEX "alert_preferences_userId_alertType_key" ON "alert_preferences"("userId", "alertType");
CREATE TABLE "new_bridge_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bridgeAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "type" TEXT NOT NULL,
    "iban" TEXT,
    "bankId" TEXT,
    "bankName" TEXT,
    "lastSyncAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bridge_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_bridge_accounts" ("balance", "bankId", "bankName", "bridgeAccountId", "createdAt", "currency", "iban", "id", "isActive", "lastSyncAt", "name", "type", "updatedAt", "userId") SELECT "balance", "bankId", "bankName", "bridgeAccountId", "createdAt", "currency", "iban", "id", "isActive", "lastSyncAt", "name", "type", "updatedAt", "userId" FROM "bridge_accounts";
DROP TABLE "bridge_accounts";
ALTER TABLE "new_bridge_accounts" RENAME TO "bridge_accounts";
CREATE UNIQUE INDEX "bridge_accounts_bridgeAccountId_key" ON "bridge_accounts"("bridgeAccountId");
CREATE TABLE "new_dashboard_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "averageSessionTime" DECIMAL NOT NULL DEFAULT 0,
    "mostUsedWidgets" JSONB NOT NULL,
    "layoutDistribution" JSONB NOT NULL,
    "deviceBreakdown" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_dashboard_analytics" ("activeUsers", "createdAt", "date", "id", "totalUsers") SELECT "activeUsers", "createdAt", "date", "id", "totalUsers" FROM "dashboard_analytics";
DROP TABLE "dashboard_analytics";
ALTER TABLE "new_dashboard_analytics" RENAME TO "dashboard_analytics";
CREATE INDEX "dashboard_analytics_date_idx" ON "dashboard_analytics"("date");
CREATE UNIQUE INDEX "dashboard_analytics_date_key" ON "dashboard_analytics"("date");
CREATE TABLE "new_dashboard_suggestions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "confidence" DECIMAL NOT NULL,
    "data" JSONB,
    "actions" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dashboard_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_dashboard_suggestions" ("actions", "confidence", "createdAt", "data", "description", "id", "impact", "isDismissed", "isRead", "title", "type", "updatedAt", "userId") SELECT "actions", "confidence", "createdAt", "data", "description", "id", "impact", "isDismissed", "isRead", "title", "type", "updatedAt", "userId" FROM "dashboard_suggestions";
DROP TABLE "dashboard_suggestions";
ALTER TABLE "new_dashboard_suggestions" RENAME TO "dashboard_suggestions";
CREATE INDEX "dashboard_suggestions_userId_isDismissed_idx" ON "dashboard_suggestions"("userId", "isDismissed");
CREATE INDEX "dashboard_suggestions_createdAt_idx" ON "dashboard_suggestions"("createdAt");
CREATE TABLE "new_debt_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "debtId" TEXT NOT NULL,
    "paymentNumber" INTEGER NOT NULL,
    "paymentDate" DATETIME NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "principalAmount" DECIMAL NOT NULL,
    "interestAmount" DECIMAL NOT NULL,
    "remainingBalance" DECIMAL NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "actualPaymentDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "debt_payments_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "debts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_debt_payments" ("actualPaymentDate", "createdAt", "debtId", "id", "interestAmount", "isPaid", "paymentDate", "paymentNumber", "principalAmount", "remainingBalance", "totalAmount", "updatedAt") SELECT "actualPaymentDate", "createdAt", "debtId", "id", "interestAmount", "isPaid", "paymentDate", "paymentNumber", "principalAmount", "remainingBalance", "totalAmount", "updatedAt" FROM "debt_payments";
DROP TABLE "debt_payments";
ALTER TABLE "new_debt_payments" RENAME TO "debt_payments";
CREATE TABLE "new_debts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "debtType" TEXT NOT NULL DEFAULT 'LOAN',
    "initialAmount" DECIMAL NOT NULL,
    "currentAmount" DECIMAL NOT NULL,
    "interestRate" DECIMAL NOT NULL,
    "duration" INTEGER NOT NULL,
    "amortizationType" TEXT NOT NULL DEFAULT 'PROGRESSIVE',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "monthlyPayment" DECIMAL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "lender" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "debts_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_debts" ("amortizationType", "assetId", "createdAt", "currency", "currentAmount", "debtType", "duration", "endDate", "id", "initialAmount", "interestRate", "lender", "monthlyPayment", "name", "notes", "startDate", "updatedAt") SELECT "amortizationType", "assetId", "createdAt", "currency", "currentAmount", "debtType", "duration", "endDate", "id", "initialAmount", "interestRate", "lender", "monthlyPayment", "name", "notes", "startDate", "updatedAt" FROM "debts";
DROP TABLE "debts";
ALTER TABLE "new_debts" RENAME TO "debts";
CREATE TABLE "new_ownerships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerEntityId" TEXT NOT NULL,
    "ownedAssetId" TEXT,
    "ownedEntityId" TEXT,
    "percentage" DECIMAL NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ownerships_ownerEntityId_fkey" FOREIGN KEY ("ownerEntityId") REFERENCES "entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ownerships_ownedAssetId_fkey" FOREIGN KEY ("ownedAssetId") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ownerships_ownedEntityId_fkey" FOREIGN KEY ("ownedEntityId") REFERENCES "entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ownerships" ("createdAt", "endDate", "id", "ownedAssetId", "ownedEntityId", "ownerEntityId", "percentage", "startDate", "updatedAt") SELECT "createdAt", "endDate", "id", "ownedAssetId", "ownedEntityId", "ownerEntityId", "percentage", "startDate", "updatedAt" FROM "ownerships";
DROP TABLE "ownerships";
ALTER TABLE "new_ownerships" RENAME TO "ownerships";
CREATE TABLE "new_tax_calculations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "IR" DECIMAL NOT NULL,
    "IFI" DECIMAL NOT NULL,
    "plusValues" DECIMAL NOT NULL,
    "prelevementsSociaux" DECIMAL NOT NULL,
    "taxeFonciere" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "patrimonySnapshot" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tax_calculations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tax_calculations" ("IFI", "IR", "createdAt", "id", "patrimonySnapshot", "plusValues", "prelevementsSociaux", "taxYear", "taxeFonciere", "total", "updatedAt", "userId") SELECT "IFI", "IR", "createdAt", "id", "patrimonySnapshot", "plusValues", "prelevementsSociaux", "taxYear", "taxeFonciere", "total", "updatedAt", "userId" FROM "tax_calculations";
DROP TABLE "tax_calculations";
ALTER TABLE "new_tax_calculations" RENAME TO "tax_calculations";
CREATE INDEX "tax_calculations_userId_taxYear_idx" ON "tax_calculations"("userId", "taxYear");
CREATE TABLE "new_tax_optimizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "estimatedSavings" DECIMAL NOT NULL,
    "actualSavings" DECIMAL,
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
INSERT INTO "new_tax_optimizations" ("actualSavings", "category", "completedAt", "createdAt", "data", "estimatedSavings", "id", "name", "notes", "proposedAt", "startedAt", "status", "strategyId", "updatedAt", "userId") SELECT "actualSavings", "category", "completedAt", "createdAt", "data", "estimatedSavings", "id", "name", "notes", "proposedAt", "startedAt", "status", "strategyId", "updatedAt", "userId" FROM "tax_optimizations";
DROP TABLE "tax_optimizations";
ALTER TABLE "new_tax_optimizations" RENAME TO "tax_optimizations";
CREATE INDEX "tax_optimizations_userId_idx" ON "tax_optimizations"("userId");
CREATE INDEX "tax_optimizations_category_idx" ON "tax_optimizations"("category");
CREATE INDEX "tax_optimizations_status_idx" ON "tax_optimizations"("status");
CREATE TABLE "new_tax_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tmi" DECIMAL NOT NULL,
    "foyer" TEXT NOT NULL,
    "nbParts" DECIMAL NOT NULL,
    "income" DECIMAL NOT NULL,
    "riskTolerance" TEXT NOT NULL,
    "optimizationGoals" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tax_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tax_profiles" ("createdAt", "foyer", "id", "income", "nbParts", "optimizationGoals", "riskTolerance", "tmi", "updatedAt", "userId") SELECT "createdAt", "foyer", "id", "income", "nbParts", "optimizationGoals", "riskTolerance", "tmi", "updatedAt", "userId" FROM "tax_profiles";
DROP TABLE "tax_profiles";
ALTER TABLE "new_tax_profiles" RENAME TO "tax_profiles";
CREATE UNIQUE INDEX "tax_profiles_userId_key" ON "tax_profiles"("userId");
CREATE TABLE "new_user_behaviors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "widgetInteractions" JSONB NOT NULL,
    "sessionDuration" INTEGER NOT NULL DEFAULT 0,
    "mostViewedWidgets" TEXT NOT NULL DEFAULT '[]',
    "leastViewedWidgets" TEXT NOT NULL DEFAULT '[]',
    "preferredLayout" TEXT NOT NULL DEFAULT 'extended',
    "lastActiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "averageSessionTime" DECIMAL NOT NULL DEFAULT 0,
    "behaviorCluster" TEXT NOT NULL DEFAULT 'beginner',
    "preferences" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_behaviors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_behaviors" ("averageSessionTime", "behaviorCluster", "createdAt", "id", "lastActiveDate", "leastViewedWidgets", "mostViewedWidgets", "preferences", "preferredLayout", "sessionDuration", "totalSessions", "updatedAt", "userId", "widgetInteractions") SELECT "averageSessionTime", "behaviorCluster", "createdAt", "id", "lastActiveDate", "leastViewedWidgets", "mostViewedWidgets", "preferences", "preferredLayout", "sessionDuration", "totalSessions", "updatedAt", "userId", "widgetInteractions" FROM "user_behaviors";
DROP TABLE "user_behaviors";
ALTER TABLE "new_user_behaviors" RENAME TO "user_behaviors";
CREATE UNIQUE INDEX "user_behaviors_userId_key" ON "user_behaviors"("userId");
CREATE TABLE "new_valuations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "value" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "valuationDate" DATETIME NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "valuations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_valuations" ("assetId", "createdAt", "currency", "id", "metadata", "notes", "source", "updatedAt", "valuationDate", "value") SELECT "assetId", "createdAt", "currency", "id", "metadata", "notes", "source", "updatedAt", "valuationDate", "value" FROM "valuations";
DROP TABLE "valuations";
ALTER TABLE "new_valuations" RENAME TO "valuations";
CREATE INDEX "valuations_valuationDate_idx" ON "valuations"("valuationDate");
CREATE INDEX "valuations_assetId_valuationDate_idx" ON "valuations"("assetId", "valuationDate");
CREATE UNIQUE INDEX "valuations_assetId_valuationDate_source_key" ON "valuations"("assetId", "valuationDate", "source");
CREATE TABLE "new_widget_interactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "widgetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "duration" INTEGER,
    "metadata" JSONB,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "widget_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_widget_interactions" ("action", "duration", "id", "timestamp", "userId", "widgetId") SELECT "action", "duration", "id", "timestamp", "userId", "widgetId" FROM "widget_interactions";
DROP TABLE "widget_interactions";
ALTER TABLE "new_widget_interactions" RENAME TO "widget_interactions";
CREATE INDEX "widget_interactions_userId_widgetId_idx" ON "widget_interactions"("userId", "widgetId");
CREATE INDEX "widget_interactions_timestamp_idx" ON "widget_interactions"("timestamp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "projection_scenarios_userId_idx" ON "projection_scenarios"("userId");

-- CreateIndex
CREATE INDEX "projection_actions_scenarioId_idx" ON "projection_actions"("scenarioId");

-- CreateIndex
CREATE INDEX "projection_results_scenarioId_idx" ON "projection_results"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "projection_results_scenarioId_timeHorizon_key" ON "projection_results"("scenarioId", "timeHorizon");

-- CreateIndex
CREATE INDEX "dashboard_layouts_userId_isActive_idx" ON "dashboard_layouts"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_layouts_userId_name_key" ON "dashboard_layouts"("userId", "name");
