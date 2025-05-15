-- CreateEnum
CREATE TYPE "Role" AS ENUM ('User', 'QuickFiller', 'SyncManager', 'QuickBuilder', 'DocBuilder', 'SyncMaster', 'Admin');

-- AlterTable
ALTER TABLE "FormTemplate" ADD COLUMN     "createdById" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'User';

-- CreateIndex
CREATE INDEX "FormTemplate_createdById_idx" ON "FormTemplate"("createdById");

-- AddForeignKey
ALTER TABLE "FormTemplate" ADD CONSTRAINT "FormTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
