import http from "http";
import { app } from "./app";
import { env } from "./config/env";
import { getSocket, initSocket, logWebSocketEvent } from "./websocket/socket";
import { prisma } from "./lib/prisma"; // 🚀 Mantém o prisma para alimentar o cockpit no F5
import { startMqtt } from "./services/mqtt.service";

const server = http.createServer(app);
const io = initSocket(server);

// Camada de Regras de Negócio do WebSocket
io.on("connection", (socket) => {
  const clientIp = socket.handshake.address || 'IP Desconhecido';

  // Regra 1: O frontend pede para ver a telemetria do robô (Cockpit Passivo)
  socket.on("telemetry:subscribe", async (options: { limit?: number } = {}) => {
    const limit = typeof options.limit === "number" ? options.limit : env.telemetry.historyLimit;
    
    logWebSocketEvent({
      socketId: socket.id,
      ip: clientIp,
      event: 'SUBSCRIBE',
      payload: options,
      timestamp: new Date()
    }, `📡 Subscrição de canal: telemetry:subscribe (Limite: ${limit})`);

    try {
      // Procura se existe uma corrida acontecendo agora no PostgreSQL
      const activeSession = await prisma.session.findFirst({
        where: { isCompleted: false },
        include: {
          telemetrySteps: {
            orderBy: { stepOrder: "asc" }, // Traz o trajeto ordenado do passo 0 até o atual
            take: limit
          }
        }
      });

      if (activeSession) {
        // Envia os passos salvos para o front recuperar o mapa onde o robô parou
        socket.emit("telemetry:history", activeSession.telemetrySteps);
      } else {
        // Se não tiver corrida ativa, manda uma lista vazia
        socket.emit("telemetry:history", []);
      }
    } catch (error) {
      console.error("[WS_SERVER_ERROR] Falha ao recuperar histórico da sessão ativa:", error);
    }
  });

  // Regra 2: O frontend avisa explicitamente que saiu da tela de telemetria
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

// SIMULADORES WEBSOCKET 
// para envio de dados sem a esp... Descomente para ativar o envio automático de passos falsos a cada 3 segundos, 
// simulando a ESP32 em ação. Útil para desenvolvimento do frontend sem precisar da parte física do robô.

// SIMULADOR WEBSOCKET (1.5s)
// Envia telemetrias novas em intervalos de 1,5 segundos para testes do frontend
// quando a ESP32 nao estiver disponivel.
if (env.telemetry.mockEnabled) {
  let telemetryFake = 0;
  setInterval(() => {
    try {
      const io = getSocket();

      io.emit("telemetry:new", {
        stepOrder: telemetryFake,
        posX: Math.floor(Math.random() * 16),
        posY: Math.floor(Math.random() * 16),
        voltage: Number((11.1 - telemetryFake * 0.015).toFixed(2)),
        current: Math.floor(Math.random() * 50) + 200,
      });

      console.log(
        `[TEST_TRIGGER] Nova telemetria fake #${telemetryFake} via WS.`,
      );
      telemetryFake++;
    } catch (e) {
      // Ignora se o socket ainda nao tiver subido
    }
  }, 1500);
  // SIMULADOR WEBSOCKET (3s) para steps
  // let passoFake = 0;
  // setInterval(() => {
  //   try {
  //     const io = getSocket();

  //     // Finge que a ESP32 mandou um pacote e envia pro seu hook useWebSocket
  //     io.emit("telemetry:step", {
  //       stepOrder: passoFake,
  //       posX: Math.floor(Math.random() * 16),
  //       posY: Math.floor(Math.random() * 16),
  //       voltage: (11.1 - (passoFake * 0.02)).toFixed(2), // Bateria caindo devagar
  //       current: Math.floor(Math.random() * 50) + 200     // Consumo oscilando entre 200mA e 250mA
  //     });

  //     console.log(`[TEST_TRIGGER] Disparado passo fake #${passoFake} via WS para o Frontend.`);
  //     passoFake++;
  //   } catch (e) {
  //     // Ignora se o socket ainda não tiver subido
  //   }
  // }, 3000); // dspara a cada 3 segundos sozinho!
}


server.listen(env.port, () => {
  console.log(`API listening on :${env.port}`);
});

const mqttClient = startMqtt();

// Encerramento limpo e seguro do servidor
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