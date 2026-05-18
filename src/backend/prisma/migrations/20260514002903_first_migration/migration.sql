-- CreateTable
CREATE TABLE "Telemetry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "topic" TEXT NOT NULL,
    "robotId" TEXT,
    "payload" JSONB NOT NULL,

    CONSTRAINT "Telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Labirinto" (
    "id" SERIAL NOT NULL,
    "tipoMatriz" TEXT NOT NULL,
    "tamanhoCelulaCm" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Labirinto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Desafio" (
    "id" SERIAL NOT NULL,
    "dataHoraExecucao" TIMESTAMP(3) NOT NULL,
    "consumoBateria" DOUBLE PRECISION NOT NULL,
    "velocidadeMedia" DOUBLE PRECISION NOT NULL,
    "tempoConclusao" INTEGER NOT NULL,
    "desafioCumprido" BOOLEAN NOT NULL,
    "labirintoId" INTEGER NOT NULL,

    CONSTRAINT "Desafio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trajeto" (
    "id" SERIAL NOT NULL,
    "ordemMovimento" INTEGER NOT NULL,
    "posicaoX" INTEGER NOT NULL,
    "posicaoY" INTEGER NOT NULL,
    "desafioId" INTEGER NOT NULL,

    CONSTRAINT "Trajeto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Telemetry_createdAt_idx" ON "Telemetry"("createdAt");

-- CreateIndex
CREATE INDEX "Telemetry_robotId_idx" ON "Telemetry"("robotId");

-- CreateIndex
CREATE INDEX "Desafio_labirintoId_idx" ON "Desafio"("labirintoId");

-- CreateIndex
CREATE INDEX "Trajeto_desafioId_idx" ON "Trajeto"("desafioId");

-- AddForeignKey
ALTER TABLE "Desafio" ADD CONSTRAINT "Desafio_labirintoId_fkey" FOREIGN KEY ("labirintoId") REFERENCES "Labirinto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trajeto" ADD CONSTRAINT "Trajeto_desafioId_fkey" FOREIGN KEY ("desafioId") REFERENCES "Desafio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
