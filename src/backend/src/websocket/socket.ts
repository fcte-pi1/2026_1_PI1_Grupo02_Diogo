import { Server } from "socket.io";
import type http from "http";
import type { TelemetryRaw } from "@prisma/client";
import { env } from "../config/env";

export interface IWebSocketLog {
  socketId: string;
  ip: string;
  event: 'CONNECTION' | 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'ERROR' | 'DISCONNECTING' | 'DISCONNECT';
  payload?: any;
  timestamp: Date;
}

export const logWebSocketEvent = (logData: IWebSocketLog, detalhes: string) => {
  const time = logData.timestamp.toISOString();
  console.log(`[WS] [${time}] [${logData.event}] - ${detalhes}`);
  
  // TO-DO: @Szervinsk - Inserir chamada de banco de dados aqui
};

let io: Server | null = null;

export const initSocket = (server: http.Server): Server => {
  io = new Server(server, {
    cors: {
      origin: env.cors.origin,
    },
  });

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