-- DropForeignKey
ALTER TABLE "Trajeto" DROP CONSTRAINT "Trajeto_desafioId_fkey";

-- DropForeignKey
ALTER TABLE "Desafio" DROP CONSTRAINT "Desafio_labirintoId_fkey";

-- DropTable
DROP TABLE "Trajeto";

-- DropTable
DROP TABLE "Desafio";

-- DropTable
DROP TABLE "Labirinto";

-- CreateTable
CREATE TABLE "Maze" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Maze_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionName" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER,
    "avgSpeed" DOUBLE PRECISION,
    "batteryDrain" DOUBLE PRECISION,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "mazeId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cell" (
    "id" TEXT NOT NULL,
    "mazeId" TEXT NOT NULL,
    "posX" INTEGER NOT NULL,
    "posY" INTEGER NOT NULL,
    "wallNorth" BOOLEAN NOT NULL DEFAULT false,
    "wallSouth" BOOLEAN NOT NULL DEFAULT false,
    "wallEast" BOOLEAN NOT NULL DEFAULT false,
    "wallWest" BOOLEAN NOT NULL DEFAULT false,
    "isVisited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Cell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelemetryLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logType" TEXT NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "TelemetryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_mazeId_idx" ON "Session"("mazeId");

-- CreateIndex
CREATE INDEX "Session_createdAt_idx" ON "Session"("createdAt");

-- CreateIndex
CREATE INDEX "Cell_mazeId_idx" ON "Cell"("mazeId");

-- CreateIndex
CREATE UNIQUE INDEX "Cell_mazeId_posX_posY_key" ON "Cell"("mazeId", "posX", "posY");

-- CreateIndex
CREATE INDEX "TelemetryLog_sessionId_idx" ON "TelemetryLog"("sessionId");

-- CreateIndex
CREATE INDEX "TelemetryLog_timestamp_idx" ON "TelemetryLog"("timestamp");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_mazeId_fkey" FOREIGN KEY ("mazeId") REFERENCES "Maze"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_mazeId_fkey" FOREIGN KEY ("mazeId") REFERENCES "Maze"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelemetryLog" ADD CONSTRAINT "TelemetryLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
