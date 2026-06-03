-- Reverte schema incorreto (categorias/produtos) e recria tabelas do robô

DROP TABLE IF EXISTS "estoque" CASCADE;
DROP TABLE IF EXISTS "produtos" CASCADE;
DROP TABLE IF EXISTS "categorias" CASCADE;

-- TelemetryRaw
CREATE TABLE IF NOT EXISTS "TelemetryRaw" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "topic" TEXT NOT NULL,
    "robotId" TEXT,
    "payload" JSONB NOT NULL,
    CONSTRAINT "TelemetryRaw_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TelemetryRaw_createdAt_idx" ON "TelemetryRaw"("createdAt");
CREATE INDEX IF NOT EXISTS "TelemetryRaw_robotId_idx" ON "TelemetryRaw"("robotId");

-- Maze
CREATE TABLE IF NOT EXISTS "Maze" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 16,
    "height" INTEGER NOT NULL DEFAULT 16,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Maze_pkey" PRIMARY KEY ("id")
);

-- Session
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "sessionName" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER,
    "avgSpeed" DOUBLE PRECISION,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "startPosX" INTEGER,
    "startPosY" INTEGER,
    "initialVoltage" DOUBLE PRECISION,
    "finalVoltage" DOUBLE PRECISION,
    "totalDrainMah" DOUBLE PRECISION,
    "fastestPath" JSONB,
    "mazeId" TEXT NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Session_mazeId_idx" ON "Session"("mazeId");
CREATE INDEX IF NOT EXISTS "Session_createdAt_idx" ON "Session"("createdAt");

-- Cell
CREATE TABLE IF NOT EXISTS "Cell" (
    "id" TEXT NOT NULL,
    "mazeId" TEXT NOT NULL,
    "posX" INTEGER NOT NULL,
    "posY" INTEGER NOT NULL,
    "wallNorth" BOOLEAN NOT NULL DEFAULT false,
    "wallSouth" BOOLEAN NOT NULL DEFAULT false,
    "wallEast" BOOLEAN NOT NULL DEFAULT false,
    "wallWest" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Cell_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Cell_mazeId_idx" ON "Cell"("mazeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Cell_mazeId_posX_posY_key" ON "Cell"("mazeId", "posX", "posY");

-- SessionStep
CREATE TABLE IF NOT EXISTS "SessionStep" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stepOrder" INTEGER NOT NULL,
    "posX" INTEGER NOT NULL,
    "posY" INTEGER NOT NULL,
    "voltage" DOUBLE PRECISION NOT NULL,
    "current" DOUBLE PRECISION NOT NULL,
    "consumption" DOUBLE PRECISION,
    CONSTRAINT "SessionStep_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SessionStep_sessionId_idx" ON "SessionStep"("sessionId");
CREATE INDEX IF NOT EXISTS "SessionStep_stepOrder_idx" ON "SessionStep"("stepOrder");

-- TelemetryLog
CREATE TABLE IF NOT EXISTS "TelemetryLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    CONSTRAINT "TelemetryLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TelemetryLog_sessionId_idx" ON "TelemetryLog"("sessionId");
CREATE INDEX IF NOT EXISTS "TelemetryLog_timestamp_idx" ON "TelemetryLog"("timestamp");

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "Session" ADD CONSTRAINT "Session_mazeId_fkey" FOREIGN KEY ("mazeId") REFERENCES "Maze"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Cell" ADD CONSTRAINT "Cell_mazeId_fkey" FOREIGN KEY ("mazeId") REFERENCES "Maze"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SessionStep" ADD CONSTRAINT "SessionStep_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "TelemetryLog" ADD CONSTRAINT "TelemetryLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "SessionStep" ALTER COLUMN "sessionId" DROP NOT NULL;
