import type { TelemetryRaw } from "@prisma/client";
import { getSocket } from "../websocket/socket";
import { validateTelemetryPayload } from "../dtos/telemetry.dto";
import { prisma } from "../lib/prisma";
import {
  getTelemetryById,
  listTelemetry,
} from "../repositories/telemetry.repository";

type ParsedTelemetry = {
  payload: any; 
  robotId?: string;
};

const parsePayload = (buffer: Buffer): ParsedTelemetry => {
  const raw = buffer.toString("utf-8");
  try {
    const parsed = JSON.parse(raw) as unknown;
    const robotId =
      typeof parsed === "object" &&
      parsed !== null &&
      "robotId" in parsed &&
      typeof (parsed as { robotId?: unknown }).robotId === "string"
        ? (parsed as { robotId: string }).robotId
        : undefined;
        
    const validation = validateTelemetryPayload(parsed);
    if (!validation.isValid) {
      console.log("❌ ERRO DE VALIDAÇÃO DO DTO:", validation.errors);
      return {
        payload: { validationErrors: validation.errors },
        robotId,
      };
    }
    return { payload: validation.payload, robotId };
  } catch {
    return { payload: { raw } };
  }
};

export const storeTelemetry = async (topic: string, rawPayload: Buffer): Promise<void> => {
  try {
    // Converte o dado bruto da ESP32
    const payload = JSON.parse(rawPayload.toString());
    const robotId = payload.robotId || "UAV-MOUSE-01";

    console.log(`📥 [MQTT] Novo pacote bruto registrado. Passo: #${payload.step} | Conclusão: ${payload.conclusao}`);

    // SEMPRE salva na tabela TelemetryRaw (Sua fonte da verdade para auditoria)
    const rawRecord = await prisma.telemetryRaw.create({
      data: {
        topic: topic,
        robotId: robotId,
        payload: payload
      }
    });

    // streaming direto para o frontend...
    // Mesmo sem ter Session criada ainda, mandamos o formato plano para o cockpit mexer o robô em tempo real
    try {
      const io = getSocket();
      const liveData = {
        id: rawRecord.id,
        stepOrder: Number(payload.step ?? 0),
        posX: Number(payload.posicao?.x || 0),
        posY: Number(payload.posicao?.y || 0),
        voltage: Number(payload.energia?.tensaoV || 0),
        current: Number(payload.energia?.correnteMa || 0),
        timestamp: rawRecord.createdAt
      };
      
      io.emit("telemetry:step", liveData); 
      io.emit("telemetry:subscribe", liveData); // Alinha com o canal de escuta ativo do front
    } catch (wsError) {
      console.error("[WS_STREAM_ERROR] Falha de transmissão WebSocket:", wsError);
    }

    // 4. 🏁 MOMENTO CRÍTICO: O ROBÔ FINALIZOU! (Estratégia de Lote)
    if (payload.conclusao === true) {
      console.log("⚡ [BATCHING] Detectada flag de finalização! Iniciando consolidação da Session...");

      // A. Busca todos os logs brutos (TelemetryRaw) deste robô que ainda não foram consolidados
      // Aqui usamos os pacotes recentes ordenados pelo passo
      const rawSteps = await prisma.telemetryRaw.findMany({
        where: { robotId: robotId },
        orderBy: { createdAt: 'asc' },
        take: 500 // Limite de segurança de amostragem
      });

      if (rawSteps.length === 0) return;

      // B. Extrai dados do primeiro e do último pacote para compor as métricas da sessão
      const firstPayload = rawSteps[0].payload as any;
      let maze = await prisma.maze.findFirst();
      if (!maze) {
        maze = await prisma.maze.create({
          data: { name: "Labirinto Padrão UnB", width: 16, height: 16 }
        });
      }

      // C. Cria o registro PAI (Session) de uma vez só no final
      const newSession = await prisma.session.create({
        data: {
          sessionName: `Corrida Consolidada - ${new Date().toLocaleTimeString()}`,
          algorithm: firstPayload.modo || "DFS",
          mode: firstPayload.estado || "Exploração",
          mazeId: maze.id,
          startPosX: firstPayload.posicao?.x || 0,
          startPosY: firstPayload.posicao?.y || 0,
          initialVoltage: firstPayload.energia?.tensaoV || 0,
          finalVoltage: payload.energia?.tensaoV || 0,
          isCompleted: true,
          durationMs: Date.now() - rawSteps[0].createdAt.getTime()
        }
      });

      // D. Converte o bloco inteiro de TelemetryRaw em SessionSteps em lote
      const stepsToInsert = rawSteps.map((raw) => {
        const p = raw.payload as any;
        return {
          sessionId: newSession.id,
          stepOrder: Number(p.step ?? 0),
          posX: Number(p.posicao?.x || 0),
          posY: Number(p.posicao?.y || 0),
          voltage: Number(p.energia?.tensaoV || 0),
          current: Number(p.energia?.correnteMa || 0),
        };
      });

      // E. Bulk Insert no PostgreSQL via Prisma
      await prisma.sessionStep.createMany({
        data: stepsToInsert
      });

      console.log(`[BATCH_SUCCESS] 💾 Sucesso! ${stepsToInsert.length} passos atrelados à nova Session ID: [${newSession.id}].`);
      
      // Opcional: Limpa os registros brutos antigos para não estourar o banco de dados
      await prisma.telemetryRaw.deleteMany({
        where: { id: { in: rawSteps.map(r => r.id) } }
      });
    }

  } catch (error) {
    console.error("Erro crítico dentro do storeTelemetry service:", error);
    throw error;
  }
};

export const getRecentTelemetry = async (
  limit: number
): Promise<TelemetryRaw[]> => listTelemetry(limit);

export const getTelemetryByIdService = async (
  id: string
): Promise<TelemetryRaw | null> => getTelemetryById(id);