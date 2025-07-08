-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('PHYSICAL_PERSON', 'LEGAL_ENTITY');

-- CreateEnum
CREATE TYPE "ValuationSource" AS ENUM ('MANUAL', 'API_BANK', 'API_STOCK', 'API_REAL_ESTATE', 'SYSTEM', 'BRIDGE_API', 'YAHOO_FINANCE', 'YAHOO_FINANCE_HISTORICAL');

-- CreateEnum
CREATE TYPE "DebtType" AS ENUM ('LOAN', 'MORTGAGE', 'CREDIT_LINE', 'BOND', 'OTHER');

-- CreateEnum
CREATE TYPE "AmortizationType" AS ENUM ('PROGRESSIVE', 'LINEAR', 'IN_FINE', 'BULLET');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "asset_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "fields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "EntityType" NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "address" JSONB,
    "metadata" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "assetTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ownerships" (
    "id" TEXT NOT NULL,
    "ownerEntityId" TEXT NOT NULL,
    "ownedAssetId" TEXT,
    "ownedEntityId" TEXT,
    "percentage" DECIMAL(5,4) NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valuations" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "valuationDate" TIMESTAMPTZ NOT NULL,
    "source" "ValuationSource" NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bridge_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "bankId" TEXT,
    "bankName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bridge_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bridge_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bridgeAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "type" TEXT NOT NULL,
    "iban" TEXT,
    "bankId" TEXT,
    "bankName" TEXT,
    "lastSyncAt" TIMESTAMPTZ,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bridge_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_type_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "asset_type_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "debtType" "DebtType" NOT NULL DEFAULT 'LOAN',
    "initialAmount" DECIMAL(15,2) NOT NULL,
    "currentAmount" DECIMAL(15,2) NOT NULL,
    "interestRate" DECIMAL(5,4) NOT NULL,
    "duration" INTEGER NOT NULL,
    "amortizationType" "AmortizationType" NOT NULL DEFAULT 'PROGRESSIVE',
    "startDate" TIMESTAMPTZ NOT NULL,
    "endDate" TIMESTAMPTZ NOT NULL,
    "monthlyPayment" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "lender" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_payments" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "paymentNumber" INTEGER NOT NULL,
    "paymentDate" TIMESTAMPTZ NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "principalAmount" DECIMAL(15,2) NOT NULL,
    "interestAmount" DECIMAL(15,2) NOT NULL,
    "remainingBalance" DECIMAL(15,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "actualPaymentDate" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "debt_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "status" TEXT NOT NULL DEFAULT 'new',
    "actions" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMPTZ,
    "snoozedUntil" TIMESTAMPTZ,
    "dismissedAt" TIMESTAMPTZ,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "threshold" DECIMAL(10,4),
    "frequency" TEXT NOT NULL DEFAULT 'immediate',
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "alert_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_actions" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "alert_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tmi" DECIMAL(5,4) NOT NULL,
    "foyer" TEXT NOT NULL,
    "nbParts" DECIMAL(3,2) NOT NULL,
    "income" DECIMAL(15,2) NOT NULL,
    "riskTolerance" TEXT NOT NULL,
    "optimizationGoals" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tax_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_optimizations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "estimatedSavings" DECIMAL(15,2) NOT NULL,
    "actualSavings" DECIMAL(15,2),
    "status" TEXT NOT NULL,
    "data" JSONB,
    "notes" TEXT,
    "proposedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tax_optimizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_simulations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarios" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tax_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_calculations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "IR" DECIMAL(15,2) NOT NULL,
    "IFI" DECIMAL(15,2) NOT NULL,
    "plusValues" DECIMAL(15,2) NOT NULL,
    "prelevementsSociaux" DECIMAL(15,2) NOT NULL,
    "taxeFonciere" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "patrimonySnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tax_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_behaviors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "widgetInteractions" JSONB NOT NULL,
    "sessionDuration" INTEGER NOT NULL DEFAULT 0,
    "mostViewedWidgets" TEXT NOT NULL DEFAULT '[]',
    "leastViewedWidgets" TEXT NOT NULL DEFAULT '[]',
    "preferredLayout" TEXT NOT NULL DEFAULT 'extended',
    "lastActiveDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "averageSessionTime" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "behaviorCluster" TEXT NOT NULL DEFAULT 'beginner',
    "preferences" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_behaviors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_layouts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "widgets" JSONB NOT NULL,
    "breakpoints" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "dashboard_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_suggestions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "data" JSONB,
    "actions" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "dashboard_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widget_interactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "widgetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "duration" INTEGER,
    "metadata" JSONB,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "widget_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_analytics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "averageSessionTime" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "mostUsedWidgets" JSONB NOT NULL,
    "layoutDistribution" JSONB NOT NULL,
    "deviceBreakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "dashboard_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "asset_types_name_key" ON "asset_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "asset_types_code_key" ON "asset_types"("code");

-- CreateIndex
CREATE INDEX "valuations_valuationDate_idx" ON "valuations"("valuationDate");

-- CreateIndex
CREATE INDEX "valuations_assetId_valuationDate_idx" ON "valuations"("assetId", "valuationDate");

-- CreateIndex
CREATE UNIQUE INDEX "valuations_assetId_valuationDate_source_key" ON "valuations"("assetId", "valuationDate", "source");

-- CreateIndex
CREATE UNIQUE INDEX "bridge_accounts_bridgeAccountId_key" ON "bridge_accounts"("bridgeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_type_categories_name_key" ON "asset_type_categories"("name");

-- CreateIndex
CREATE INDEX "alerts_userId_idx" ON "alerts"("userId");

-- CreateIndex
CREATE INDEX "alerts_type_idx" ON "alerts"("type");

-- CreateIndex
CREATE INDEX "alerts_severity_idx" ON "alerts"("severity");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_createdAt_idx" ON "alerts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "alert_preferences_userId_alertType_key" ON "alert_preferences"("userId", "alertType");

-- CreateIndex
CREATE INDEX "alert_actions_alertId_idx" ON "alert_actions"("alertId");

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

-- CreateIndex
CREATE UNIQUE INDEX "user_behaviors_userId_key" ON "user_behaviors"("userId");

-- CreateIndex
CREATE INDEX "dashboard_layouts_userId_isActive_idx" ON "dashboard_layouts"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_layouts_userId_name_key" ON "dashboard_layouts"("userId", "name");

-- CreateIndex
CREATE INDEX "dashboard_suggestions_userId_isDismissed_idx" ON "dashboard_suggestions"("userId", "isDismissed");

-- CreateIndex
CREATE INDEX "dashboard_suggestions_createdAt_idx" ON "dashboard_suggestions"("createdAt");

-- CreateIndex
CREATE INDEX "widget_interactions_userId_widgetId_idx" ON "widget_interactions"("userId", "widgetId");

-- CreateIndex
CREATE INDEX "widget_interactions_timestamp_idx" ON "widget_interactions"("timestamp");

-- CreateIndex
CREATE INDEX "dashboard_analytics_date_idx" ON "dashboard_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_analytics_date_key" ON "dashboard_analytics"("date");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entities" ADD CONSTRAINT "entities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "asset_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_ownerEntityId_fkey" FOREIGN KEY ("ownerEntityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_ownedAssetId_fkey" FOREIGN KEY ("ownedAssetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_ownedEntityId_fkey" FOREIGN KEY ("ownedEntityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valuations" ADD CONSTRAINT "valuations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_connections" ADD CONSTRAINT "bridge_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_accounts" ADD CONSTRAINT "bridge_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_preferences" ADD CONSTRAINT "alert_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_actions" ADD CONSTRAINT "alert_actions_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_profiles" ADD CONSTRAINT "tax_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_optimizations" ADD CONSTRAINT "tax_optimizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_simulations" ADD CONSTRAINT "tax_simulations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_calculations" ADD CONSTRAINT "tax_calculations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_behaviors" ADD CONSTRAINT "user_behaviors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_layouts" ADD CONSTRAINT "dashboard_layouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_suggestions" ADD CONSTRAINT "dashboard_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widget_interactions" ADD CONSTRAINT "widget_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
