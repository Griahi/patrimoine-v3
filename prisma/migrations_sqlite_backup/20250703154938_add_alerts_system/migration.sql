-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "status" TEXT NOT NULL DEFAULT 'new',
    "actions" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    "snoozedUntil" DATETIME,
    "dismissedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alert_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "threshold" REAL,
    "frequency" TEXT NOT NULL DEFAULT 'immediate',
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "alert_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alert_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    CONSTRAINT "alert_actions_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
