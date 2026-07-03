// src/services/simulator.service.ts
import { getSocket } from "../websocket/socket";

let simulatorInterval: NodeJS.Timeout | null = null;
let isPaused = false;
let telemetryFake = 0;

// Estado dinâmico modificado pelo Frontend para moldar o comportamento do robô
let liveConfig = {
  voltage: 12.1,
  current: 240,
  sensorFront: 25,
  sensorLeft: 25,
  sensorRight: 25,
  wallNorth: false,
  wallSouth: false,
  wallEast: false,
  wallWest: false,
  posX: 0,
  posY: 0,
};

export const startSimulator = () => {
  isPaused = false;
  if (simulatorInterval) return;

  console.log("[MOCK] 🏎️ Simulador iniciado/retomado via API HTTP.");

  simulatorInterval = setInterval(() => {
    if (isPaused) return; // Se pausado, o loop continua rodando mas não emite novos passos

    try {
      const ioInstance = getSocket();

      const mockStepData = {
        id: `mock-uuid-${telemetryFake}`,
        sessionId: "mock-session-active",
        timestamp: new Date().toISOString(),
        stepOrder: telemetryFake,
        // Usa as coordenadas fixadas pelo usuário ou caminha aleatoriamente se estiverem zeradas
        posX: liveConfig.posX,
        posY: liveConfig.posY,
        voltage: Number((liveConfig.voltage - telemetryFake * 0.01).toFixed(2)),
        current: Math.floor(Math.random() * 20) + liveConfig.current,
        consumption: 0.05,
        // Sensores e paredes customizadas injetados ativamente na transmissão reativa
        sensors: {
          front: liveConfig.sensorFront,
          left: liveConfig.sensorLeft,
          right: liveConfig.sensorRight,
        },
        walls: {
          north: liveConfig.wallNorth,
          south: liveConfig.wallSouth,
          east: liveConfig.wallEast,
          west: liveConfig.wallWest,
        }
      };

      ioInstance.emit("telemetry:step", mockStepData);
      telemetryFake += 1;

    } catch (error) {
      console.error("[WS_MOCK_ERROR] Falha na transmissão direta do mock:", error);
    }
  }, 1500);
};

export const pauseSimulator = () => {
  isPaused = true;
  console.log("[MOCK] ⏸️ Loop de transmissão pausado (passo atual mantido).");
};

export const stopSimulator = () => {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
  }
  isPaused = false;
  telemetryFake = 0; // Zera a contagem de iterações/passos
  console.log("[MOCK] 🛑 Simulador totalmente resetado e desligado.");
};

export const updateSimulatorConfig = (newConfig: Partial<typeof liveConfig>) => {
  liveConfig = { ...liveConfig, ...newConfig };
  console.log("[MOCK] 🛠️ Configurações de injeção atualizadas em tempo de execução.");
};

export const getSimulatorStatus = () => {
  return {
    running: simulatorInterval !== null,
    paused: isPaused,
    stepOrder: telemetryFake,
    config: liveConfig
  };
};