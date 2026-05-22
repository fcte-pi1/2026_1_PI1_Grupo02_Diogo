/*
  Warnings:

  - You are about to drop the column `isVisited` on the `Cell` table. All the data in the column will be lost.
  - You are about to drop the column `batteryDrain` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the `Telemetry` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Cell" DROP COLUMN "isVisited";

-- AlterTable
ALTER TABLE "Maze" ADD COLUMN     "height" INTEGER NOT NULL DEFAULT 16,
ADD COLUMN     "width" INTEGER NOT NULL DEFAULT 16;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "batteryDrain",
ADD COLUMN     "fastestPath" JSONB,
ADD COLUMN     "finalVoltage" DOUBLE PRECISION,
ADD COLUMN     "initialVoltage" DOUBLE PRECISION,
ADD COLUMN     "startPosX" INTEGER,
ADD COLUMN     "startPosY" INTEGER,
ADD COLUMN     "totalDrainMah" DOUBLE PRECISION;

-- DropTable
DROP TABLE "Telemetry";

-- CreateTable
CREATE TABLE "TelemetryRaw" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "topic" TEXT NOT NULL,
    "robotId" TEXT,
    "payload" JSONB NOT NULL,

    CONSTRAINT "TelemetryRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionStep" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stepOrder" INTEGER NOT NULL,
    "posX" INTEGER NOT NULL,
    "posY" INTEGER NOT NULL,
    "voltage" DOUBLE PRECISION NOT NULL,
    "current" DOUBLE PRECISION NOT NULL,
    "consumption" DOUBLE PRECISION,

    CONSTRAINT "SessionStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TelemetryRaw_createdAt_idx" ON "TelemetryRaw"("createdAt");

-- CreateIndex
CREATE INDEX "TelemetryRaw_robotId_idx" ON "TelemetryRaw"("robotId");

-- CreateIndex
CREATE INDEX "SessionStep_sessionId_idx" ON "SessionStep"("sessionId");

-- CreateIndex
CREATE INDEX "SessionStep_stepOrder_idx" ON "SessionStep"("stepOrder");

-- AddForeignKey
ALTER TABLE "SessionStep" ADD CONSTRAINT "SessionStep_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
