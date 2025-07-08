-- CreateTable
CREATE TABLE "user_behaviors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "widgetInteractions" JSONB NOT NULL,
    "sessionDuration" INTEGER NOT NULL DEFAULT 0,
    "mostViewedWidgets" TEXT NOT NULL DEFAULT '[]',
    "leastViewedWidgets" TEXT NOT NULL DEFAULT '[]',
    "preferredLayout" TEXT NOT NULL DEFAULT 'extended',
    "lastActiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "averageSessionTime" REAL NOT NULL DEFAULT 0,
    "behaviorCluster" TEXT NOT NULL DEFAULT 'beginner',
    "preferences" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_behaviors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dashboard_layouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "widgets" JSONB NOT NULL,
    "breakpoints" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dashboard_layouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dashboard_suggestions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impact" TEXT NOT NULL DEFAULT 'medium',
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "data" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dashboard_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "widget_interactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "widgetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "params" JSONB,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "duration" INTEGER,
    "clickX" REAL,
    "clickY" REAL,
    CONSTRAINT "widget_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dashboard_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "widgetUsageStats" JSONB NOT NULL,
    "userClusters" JSONB NOT NULL,
    "suggestionStats" JSONB NOT NULL,
    "performanceMetrics" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "user_behaviors_userId_key" ON "user_behaviors"("userId");

-- CreateIndex
CREATE INDEX "widget_interactions_userId_widgetId_idx" ON "widget_interactions"("userId", "widgetId");

-- CreateIndex
CREATE INDEX "widget_interactions_timestamp_idx" ON "widget_interactions"("timestamp");
