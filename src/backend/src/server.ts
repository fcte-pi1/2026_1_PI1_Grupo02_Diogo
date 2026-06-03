import http from "http";
import { app } from "./app";
import { env } from "./config/env";
import { getSocket, initSocket, logWebSocketEvent } from "./websocket/socket";
import { prisma } from "./lib/prisma";
import { getOrphanStepsForReplay } from "./services/telemetry.service";
import { startMqtt } from "./services/mqtt.service";

const server = http.createServer(app);
const io = initSocket(server);

io.on("connection", (socket) => {
  const clientIp = socket.handshake.address || "IP Desconhecido";

  socket.on("telemetry:subscribe", async (options: { limit?: number } = {}) => {
    const limit =
      typeof options.limit === "number"
        ? options.limit
        : env.telemetry.historyLimit;

    logWebSocketEvent(
      {
        socketId: socket.id,
        ip: clientIp,
        event: "SUBSCRIBE",
        payload: options,
        timestamp: new Date(),
      },
      `📡 Subscrição de canal: telemetry:subscribe (Limite: ${limit})`
    );

    try {
      const orphanSteps = await getOrphanStepsForReplay(limit);
      socket.emit("telemetry:history", orphanSteps);
    } catch (error) {
      console.error(
        "[WS_SERVER_ERROR] Falha ao recuperar histórico da sessão ativa:",
        error
      );
    }
  });

  socket.on("telemetry:unsubscribe", () => {
    logWebSocketEvent(
      {
        socketId: socket.id,
        ip: clientIp,
        event: "UNSUBSCRIBE",
        payload: { action: "leave" },
        timestamp: new Date(),
      },
      `📡 Cancelamento de canal: telemetry:unsubscribe`
    );
  });
});

if (env.telemetry.mockEnabled) {
  let telemetryFake = 0;
  setInterval(() => {
    try {
      const socketIo = getSocket();

      socketIo.emit("telemetry:new", {
        stepOrder: telemetryFake,
        posX: Math.floor(Math.random() * 16),
        posY: Math.floor(Math.random() * 16),
        voltage: Number((11.1 - telemetryFake * 0.015).toFixed(2)),
        current: Math.floor(Math.random() * 50) + 200,
      });

      console.log(
        `[TEST_TRIGGER] Nova telemetria fake #${telemetryFake} via WS.`
      );
      telemetryFake += 1;
    } catch {
      // socket ainda não inicializado
    }
  }, 1500);
}

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
