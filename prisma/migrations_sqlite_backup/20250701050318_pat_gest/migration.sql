-- CreateTable
CREATE TABLE "asset_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "entities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "address" JSONB,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "entities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "externalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assets_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "asset_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ownerships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerEntityId" TEXT NOT NULL,
    "ownedAssetId" TEXT,
    "ownedEntityId" TEXT,
    "percentage" REAL NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ownerships_ownerEntityId_fkey" FOREIGN KEY ("ownerEntityId") REFERENCES "entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ownerships_ownedAssetId_fkey" FOREIGN KEY ("ownedAssetId") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ownerships_ownedEntityId_fkey" FOREIGN KEY ("ownedEntityId") REFERENCES "entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "valuations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "valuationDate" DATETIME NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "valuations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "emailVerified", "id", "image", "name", "password", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", "password", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "asset_types_name_key" ON "asset_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "asset_types_code_key" ON "asset_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "valuations_assetId_valuationDate_source_key" ON "valuations"("assetId", "valuationDate", "source");
