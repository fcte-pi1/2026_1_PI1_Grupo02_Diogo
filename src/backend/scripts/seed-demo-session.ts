/**
 * Popula o banco com uma corrida de demonstração para testar GET/DELETE /api/sessions.
 *
 * Uso: npx tsx scripts/seed-demo-session.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import {
  consolidateSession,
  recordOrphanTelemetryStep,
} from "../src/services/telemetry.service";
import type { TelemetryPayloadDto } from "../src/dtos/telemetry.dto";

const basePayload = (
  step: number,
  conclusao: boolean
): TelemetryPayloadDto => ({
  step,
  tempoMs: step * 500,
  modo: "DFS",
  estado: "EXPLORANDO",
  posicao: { x: step % 8, y: Math.floor(step / 8) },
  direcao: "norte",
  paredes: { norte: false, sul: true, leste: false, oeste: true },
  motores: { pwmEsquerdo: 120, pwmDireito: 118 },
  sensores: { esquerdaCm: 10, frenteCm: 15, direitaCm: 12 },
  energia: {
    tensaoV: 12.0 - step * 0.05,
    correnteMa: 220 + step * 2,
  },
  conclusao,
});

async function main(): Promise<void> {
  console.log("🏁 Gerando corrida de demonstração...\n");

  for (let step = 0; step <= 5; step += 1) {
    const isLast = step === 5;
    await recordOrphanTelemetryStep(basePayload(step, isLast));
    if (isLast) {
      const sessionId = await consolidateSession(basePayload(step, true));
      console.log(`✅ Sessão consolidada: ${sessionId}\n`);
    }
  }

  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { _count: { select: { telemetrySteps: true } } },
  });

  console.log("Sessões no banco:");
  for (const s of sessions) {
    console.log(
      `  - ${s.id} | ${s.sessionName} | ${s._count.telemetrySteps} passos`
    );
  }

  console.log("\nTeste a API:");
  console.log("  curl http://localhost:3000/api/sessions");
  if (sessions[0]) {
    console.log(`  curl http://localhost:3000/api/sessions/${sessions[0].id}`);
  }
}

main()
  .catch((err) => {
    console.error("Erro:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
