import { Server } from "socket.io";
import type http from "http";
import type { TelemetryRaw } from "@prisma/client";
import { prisma } from '../lib/prisma'
import { env } from "../config/env";

// Contrato de dados padronizado para garantir integração segura.
export interface IWebSocketLog {
  socketId: string;
  ip: string;
  event: 'CONNECTION' | 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'ERROR' | 'DISCONNECTING' | 'DISCONNECT';
  payload?: any;
  timestamp: Date;
}

// Função centralizadora de observabilidade.
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

  // Mapeamento nativo do ciclo de vida do WebSocket
  io.on("connection", (socket) => {
    const clientIp = socket.handshake.address || 'IP Desconhecido';

    logWebSocketEvent({
      socketId: socket.id,
      ip: clientIp,
      event: 'CONNECTION',
      timestamp: new Date()
    }, `🔌 Cliente conectado: ID ${socket.id}`);

    socket.on('error', (err) => {
      logWebSocketEvent({
        socketId: socket.id,
        ip: clientIp,
        event: 'ERROR',
        payload: err,
        timestamp: new Date()
      }, `⚠️ Erro interno: ${err.message}`);
    });

    // Captura os dados instantes antes da conexão cair (mantém acesso ao cache de salas/rooms)
    socket.on('disconnecting', (reason) => {
      logWebSocketEvent({
        socketId: socket.id,
        ip: clientIp,
        event: 'DISCONNECTING',
        payload: { rooms: Array.from(socket.rooms) }, 
        timestamp: new Date()
      }, `⏳ Cliente saindo (pré-desconexão). Razão <${reason}>`);
    });

    // Queda definitiva da conexão (transport close, ping timeout, etc)
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
  if (!io) {
    return;
  }
  io.emit("telemetry:new", telemetry);
};

export const getSocket = (): Server => {
  if (!io) {
    throw new Error("Socket server not initialized");
  }
  return io;
};