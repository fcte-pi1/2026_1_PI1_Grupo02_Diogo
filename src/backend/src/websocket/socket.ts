import { Server } from "socket.io";
import type http from "http";
import type { TelemetryRaw } from "@prisma/client";
import { prisma } from '../lib/prisma';
import { env } from "../config/env";
import { getOrphanStepsForReplay, clearLiveOrphanRun } from "../services/telemetry.service";

export interface IWebSocketLog {
  socketId: string;
  ip: string;
  event: 'CONNECTION' | 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'ERROR' | 'DISCONNECTING' | 'DISCONNECT';
  payload?: any;
  timestamp: Date;
}

export const logWebSocketEvent = async (
  logData: IWebSocketLog, 
  detalhes: string, 
  activeSessionId?: string
) => {
  const time = logData.timestamp.toISOString();
  console.log(`[WS] [${time}] [${logData.event}] - ${detalhes}`);
  
  if (activeSessionId) {
    try {
      await prisma.telemetryLog.create({
        data: {
          sessionId: activeSessionId,
          timestamp: logData.timestamp,
          logType: logData.event,
          message: detalhes
        }
      });
    } catch (error) {
      console.error(`[WS_ERROR] Falha ao salvar log no PostgreSQL:`, error);
    }
  }
};

let io: Server | null = null;

export const resetSocketForTests = (): void => {
  io = null;
};

export const initSocket = (server: http.Server): Server => {
  io = new Server(server, {
    cors: {
      // 🚀 CORS ESPELHADO: Aceita conexões de desenvolvimento rebatendo a origem
      origin: (origin, callback) => {
        if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1")) {
          callback(null, origin);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true,
    transports: ["polling", "websocket"] // Garante upgrade suave de transporte no Firefox
  });

  io.on("connection", (socket) => {
    const clientIp = socket.handshake.address || 'IP Desconhecido';

    logWebSocketEvent({
      socketId: socket.id,
      ip: clientIp,
      event: 'CONNECTION',
      timestamp: new Date()
    }, `🔌 Cliente conectado: ID ${socket.id}`);

    socket.on("telemetry:subscribe", async (options: { limit?: number; fresh?: boolean } = {}) => {
      const limit = typeof options.limit === "number" ? options.limit : env.telemetry.historyLimit;
      const fresh = options.fresh === true;

      logWebSocketEvent({
        socketId: socket.id,
        ip: clientIp,
        event: "SUBSCRIBE",
        payload: options,
        timestamp: new Date(),
      }, `📡 Subscrição de canal: telemetry:subscribe (Limite: ${limit}, fresh: ${fresh})`);

      try {
        if (fresh) {
          await clearLiveOrphanRun();
          socket.emit("telemetry:history", []);
          return;
        }

        const orphanSteps = await getOrphanStepsForReplay(limit);
        socket.emit("telemetry:history", orphanSteps);
      } catch (error) {
        console.error("[WS_SERVER_ERROR] Falha ao recuperar histórico:", error);
      }
    });

    socket.on("telemetry:unsubscribe", () => {
      logWebSocketEvent({
        socketId: socket.id,
        ip: clientIp,
        event: "UNSUBSCRIBE",
        payload: { action: "leave" },
        timestamp: new Date(),
      }, `📡 Cancelamento de canal: telemetry:unsubscribe`);
    });

    socket.on('error', (err) => {
      logWebSocketEvent({
        socketId: socket.id,
        ip: clientIp,
        event: 'ERROR',
        payload: { message: err.message }, 
        timestamp: new Date()
      }, `⚠️ Erro interno: ${err.message}`);
    });

    socket.on('disconnecting', (reason) => {
      logWebSocketEvent({
        socketId: socket.id,
        ip: clientIp,
        event: 'DISCONNECTING',
        payload: { rooms: Array.from(socket.rooms) }, 
        timestamp: new Date()
      }, `⏳ Cliente saindo (pré-desconexão). Razão <${reason}>`);
    });

    socket.on('disconnect', (reason) => {
      logWebSocketEvent({
        socketId: socket.id,
        ip: clientIp,
        event: 'DISCONNECT',
        payload: { reason },
        timestamp: new Date()
      }, `❌ Cliente desconectado: ID ${socket.id}`);
    });
  });

  return io;
};

export const emitTelemetry = (telemetry: TelemetryRaw): void => {
  if (!io) return;
  io.emit("telemetry:new", telemetry);
};

export const getSocket = (): Server => {
  if (!io) throw new Error("Socket server not initialized");
  return io;
};