-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('Draft', 'Submitted', 'Approved', 'Rejected', 'Signed', 'Archived');

-- CreateTable
CREATE TABLE "FormInstance" (
    "id" SERIAL NOT NULL,
    "data" JSONB NOT NULL,
    "status" "FormStatus" NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "templateId" INTEGER NOT NULL,
    "ownerUserId" INTEGER NOT NULL,

    CONSTRAINT "FormInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormInstance_templateId_idx" ON "FormInstance"("templateId");

-- CreateIndex
CREATE INDEX "FormInstance_ownerUserId_idx" ON "FormInstance"("ownerUserId");

-- CreateIndex
CREATE INDEX "FormInstance_status_idx" ON "FormInstance"("status");

-- AddForeignKey
ALTER TABLE "FormInstance" ADD CONSTRAINT "FormInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormInstance" ADD CONSTRAINT "FormInstance_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
