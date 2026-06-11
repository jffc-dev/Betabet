-- CreateEnum
CREATE TYPE "TemplateKind" AS ENUM ('LEAGUE', 'TOURNAMENT');

-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "kind" "TemplateKind" NOT NULL DEFAULT 'TOURNAMENT',
    "season" TEXT,
    "provider" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateMatch" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "stage" TEXT,
    "groupName" TEXT,
    "matchday" INTEGER,
    "position" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "TemplateMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Template_slug_key" ON "Template"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Template_provider_externalId_key" ON "Template"("provider", "externalId");

-- CreateIndex
CREATE INDEX "TemplateMatch_templateId_groupName_idx" ON "TemplateMatch"("templateId", "groupName");

-- CreateIndex
CREATE INDEX "TemplateMatch_matchId_idx" ON "TemplateMatch"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateMatch_templateId_matchId_key" ON "TemplateMatch"("templateId", "matchId");

-- CreateIndex
CREATE INDEX "Round_templateId_idx" ON "Round"("templateId");

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateMatch" ADD CONSTRAINT "TemplateMatch_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateMatch" ADD CONSTRAINT "TemplateMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
