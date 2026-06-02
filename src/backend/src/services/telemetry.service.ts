import type { Prisma, TelemetryRaw } from "@prisma/client";
import { emitTelemetry, getSocket } from "../websocket/socket";
import { validateTelemetryPayload } from "../dtos/telemetry.dto";
import { prisma } from "../lib/prisma";
import {
  createTelemetry,
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

export const storeTelemetry = async (
  topic: string,
  payload: Buffer
): Promise<TelemetryRaw> => {
  
  const parsed = parsePayload(payload);
  
  // salva o histórico bruto na tabela TelemetryRaw 
  const created = await createTelemetry({
    topic,
    payload: parsed.payload as Prisma.InputJsonValue,
    robotId: parsed.robotId,
  });

  emitTelemetry(created);

  // Se o payload for válido e não contiver erros de validação, processamos a sessão
  if (parsed.payload && !parsed.payload.validationErrors) {
    try {
      const espData = parsed.payload; // Dados validados vindos da ESP32
      const currentRobotId = parsed.robotId || "UAV-MOUSE-01";

      // Busca se existe uma corrida ativa rolando no PostgreSQL
      let session = await prisma.session.findFirst({
        where: { isCompleted: false },
        orderBy: { createdAt: 'desc' }
      });

      // se o robô mandou o step 0 e não tem sessão aberta, cria uma nova
      if (!session && espData.step === 0) {
        let maze = await prisma.maze.findFirst();
        if (!maze) {
          maze = await prisma.maze.create({
            data: { name: "Labirinto padrão", width: 16, height: 16 }
          });
        }

        session = await prisma.session.create({
          data: {
            sessionName: `Corrida Automática - ${new Date().toLocaleTimeString()}`,
            algorithm: espData.modo || "DFS",
            mode: espData.estado || "Exploração",
            mazeId: maze.id,
            startPosX: espData.posicao?.x || 0,
            startPosY: espData.posicao?.y || 0,
            initialVoltage: espData.energia?.tensaoV || 0
          }
        });
        console.log(`[AUTO-START] 🏁 Nova sessão criada de forma automatizada: ID [${session.id}]`);
      }

      // se uma sessão ativa existe (ou acabou de ser autocriada), grava o Passo Atual (Step)
      if (session) {
        // traduz os campos aninhados da imagem para as colunas planas do Prisma
        const stepRecord = await prisma.sessionStep.create({
          data: {
            sessionId: session.id,
            stepOrder: espData.step,                    // step ➡️ stepOrder
            posX: espData.posicao?.x ?? 0,              // posicao.x ➡️ posX
            posY: espData.posicao?.y ?? 0,              // posicao.y ➡️ posY
            voltage: espData.energia?.tensaoV ?? 0,      // energia.tensaoV ➡️ voltage
            current: espData.energia?.correnteMa ?? 0,  // energia.correnteMa ➡️ current
          }
        });

        // transmissõa para o websocket, envia o passo traduzido e padronizado para o seu hook useWebSocket do React
        try {
          const io = getSocket();
          io.emit("telemetry:step", stepRecord); 
        } catch (wsError) {
          console.error("[WS_STREAM_ERROR] Servidor WS não inicializado ou falhou ao emitir:", wsError);
        }

        // se o robô bater a flag de conclusão, fecha a sessão e calcula métricas
        if (espData.conclusao === true) {
          const durationMs = Date.now() - session.createdAt.getTime();
          await prisma.session.update({
            where: { id: session.id },
            data: { 
              isCompleted: true,
              durationMs: durationMs,
              finalVoltage: espData.energia?.tensaoV || 0
              // TODO: TotalDrain Calc...
              // TODO: Fastest Path...
              // TODO: AvgSpeed...
              // Nos processos de cálculo acima será necessário consultar o baco de dados 
              // nos Steps da sessão.
            }
          });
          console.log(`[AUTO-STOP] 🏁 Robô concluiu o labirinto. Sessão [${session.id}] encerrada.`);
        }
      }
    } catch (dbError) {
      console.error("❌ Erro ao processar regras de Session/SessionStep no banco:", dbError);
    }
  }

  return created;
};

export const getRecentTelemetry = async (
  limit: number
): Promise<TelemetryRaw[]> => listTelemetry(limit);

export const getTelemetryByIdService = async (
  id: string
): Promise<TelemetryRaw | null> => getTelemetryById(id);