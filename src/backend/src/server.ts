import http from "http";
import { app } from "./app";
import { env } from "./config/env";
import { initSocket, logWebSocketEvent } from "./websocket/socket";
import { startMqtt } from "./services/mqtt.service";
import { getRecentTelemetry } from "./services/telemetry.service";
import { prisma } from "./lib/prisma";

const server = http.createServer(app);
const io = initSocket(server);

io.on("connection", (socket) => {
  const clientIp = socket.handshake.address || 'IP Desconhecido';

  socket.on("telemetry:subscribe", async (options: { limit?: number } = {}) => {
    const limit = typeof options.limit === "number" ? options.limit : env.telemetry.historyLimit;
    
    logWebSocketEvent({
      socketId: socket.id,
      ip: clientIp,
      event: 'SUBSCRIBE',
      payload: options,
      timestamp: new Date()
    }, `📡 Subscrição de canal: telemetry:subscribe (Limite: ${limit})`);

    const items = await getRecentTelemetry(limit);
    socket.emit("telemetry:history", items);
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
});

server.listen(env.port, () => {
  console.log(`API listening on :${env.port}`);
});

const mqttClient = startMqtt();

const shutdown = async () => {
  console.log("Shutting down");
  mqttClient.end(true);
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);