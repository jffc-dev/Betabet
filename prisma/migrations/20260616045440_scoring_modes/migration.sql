-- CreateEnum
CREATE TYPE "ScoringMode" AS ENUM ('FLAT', 'UNIQUE_BONUS');

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "defaultScoringMode" "ScoringMode" NOT NULL DEFAULT 'FLAT',
ADD COLUMN     "defaultUniqueHitPoints" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "scoringMode" "ScoringMode" NOT NULL DEFAULT 'FLAT';

-- AlterTable
ALTER TABLE "RoundMatch" ADD COLUMN     "uniqueHitPoints" INTEGER NOT NULL DEFAULT 2;
