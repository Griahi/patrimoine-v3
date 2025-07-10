/*
  Warnings:

  - A unique constraint covering the columns `[userId,isActive]` on the table `dashboard_layouts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "dashboard_layouts_userId_isActive_key" ON "dashboard_layouts"("userId", "isActive");
