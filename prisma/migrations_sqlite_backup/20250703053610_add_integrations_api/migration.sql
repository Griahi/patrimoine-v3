-- AlterTable
ALTER TABLE "valuations" ADD COLUMN "metadata" JSONB;

-- CreateTable
CREATE TABLE "bridge_connections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "bankId" TEXT,
    "bankName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bridge_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bridge_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bridgeAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" REAL NOT NULL,
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

-- CreateTable
CREATE TABLE "asset_type_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_asset_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "fields" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_asset_types" ("code", "color", "createdAt", "description", "icon", "id", "name", "updatedAt") SELECT "code", "color", "createdAt", "description", "icon", "id", "name", "updatedAt" FROM "asset_types";
DROP TABLE "asset_types";
ALTER TABLE "new_asset_types" RENAME TO "asset_types";
CREATE UNIQUE INDEX "asset_types_name_key" ON "asset_types"("name");
CREATE UNIQUE INDEX "asset_types_code_key" ON "asset_types"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "bridge_accounts_bridgeAccountId_key" ON "bridge_accounts"("bridgeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_type_categories_name_key" ON "asset_type_categories"("name");
