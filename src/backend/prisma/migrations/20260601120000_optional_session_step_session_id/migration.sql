-- Permite gravar passos de telemetria antes da consolidação da sessão
ALTER TABLE "SessionStep" ALTER COLUMN "sessionId" DROP NOT NULL;
