import { Server } from "socket.io";
import type http from "http";
import type { TelemetryRaw } from "@prisma/client";
import { prisma } from '../lib/prisma';
import { env } from "../config/env";

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

export const initSocket = (server: http.Server): Server => {
  io = new Server(server, {
    cors: {
      origin: env.cors.origin,
    },
  });

  // Centralização absoluta do ciclo de vida e das regras do WebSocket
  io.on("connection", (socket) => {
    const clientIp = socket.handshake.address || 'IP Desconhecido';

    logWebSocketEvent({
      socketId: socket.id,
      ip: clientIp,
      event: 'CONNECTION',
      timestamp: new Date()
    }, `🔌 Cliente conectado: ID ${socket.id}`);

    // 🚀 REGRA INTEGRADA: Escuta a subscrição que o Frontend dispara ao abrir a tela
    socket.on("telemetry:subscribe", async (options: { limit?: number } = {}) => {
      const limit = typeof options.limit === "number" ? options.limit : env.telemetry.historyLimit;
      
      await logWebSocketEvent({
        socketId: socket.id,
        ip: clientIp,
        event: 'SUBSCRIBE',
        payload: options,
        timestamp: new Date()
      }, `📡 Subscrição de canal: telemetry:subscribe (Limite: ${limit})`);

      try {
        // Recupera o histórico de passos da sessão que ainda está rolando
        const activeSession = await prisma.session.findFirst({
          where: { isCompleted: false },
          include: {
            telemetrySteps: {
              orderBy: { stepOrder: "asc" },
              take: limit
            }
          }
        });

        if (activeSession) {
          // Envia o rastro para o front desenhar o labirinto de onde parou
          socket.emit("telemetry:history", activeSession.telemetrySteps);
        } else {
          socket.emit("telemetry:history", []);
        }
      } catch (error) {
        console.error("[WS_SERVER_ERROR] Falha ao recuperar histórico ativo:", error);
      }
    });

    socket.on("telemetry:unsubscribe", () => {
      logWebSocketEvent({
        socketId: socket.id,
        ip: clientIp,
        event: 'UNSUBSCRIBE',
        payload: { action: 'leave' },
        timestamp: new Date()
      }, `📡 Cancelamento de canal: telemetry:unsubscribe`);
    });

    socket.on('error', (err) => {
      logWebSocketEvent({
        socketId: socket.id,
        ip: clientIp,
        event: 'ERROR',
        payload: err,
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
  if (!io) {
    throw new Error("Socket server not initialized");
  }
  return io;
};