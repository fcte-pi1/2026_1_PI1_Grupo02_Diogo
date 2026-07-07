import { consolidateSession } from "./telemetry.service";
import { getSocket } from "../websocket/socket";

let simulatorInterval: NodeJS.Timeout | null = null;
let isPaused = false;
let telemetryFake = 0;

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
  conclusao: false,
  estado: "EXPLORANDO",
  modo: "DFS",
  sessionName: "Sessão Ativa",
};

const buildTelemetryPayload = () => ({
  step: telemetryFake,
  tempoMs: Date.now(),
  modo: liveConfig.modo === "TESTE_SIMULADOR" ? "DFS" : liveConfig.modo,
  estado: liveConfig.estado === "RODANDO" ? "EXPLORANDO" : liveConfig.estado,
  posicao: { x: liveConfig.posX, y: liveConfig.posY },
  direcao: "norte",
  paredes: {
    norte: liveConfig.wallNorth,
    sul: liveConfig.wallSouth,
    leste: liveConfig.wallEast,
    oeste: liveConfig.wallWest,
  },
  motores: { pwmEsquerdo: 0, pwmDireito: 0 },
  sensores: {
    esquerdaCm: liveConfig.sensorLeft,
    frenteCm: liveConfig.sensorFront,
    direitaCm: liveConfig.sensorRight,
  },
  energia: {
    tensaoV: liveConfig.voltage,
    correnteMa: liveConfig.current,
  },
  conclusao: liveConfig.conclusao,
  robotId: "mock-simulator",
  sessionName: liveConfig.sessionName,
});

/**
 * Função central de pulso: Monta o DTO que a ESP32 enviaria e injeta no sistema
 */
const emitTelemetryPulse = async () => {
  const esp32MockPayload = buildTelemetryPayload();

  const wsPayload = {
    id: `mock-step-${telemetryFake}`,
    sessionId: "mock-session-active",
    timestamp: new Date().toISOString(),
    stepOrder: telemetryFake,
    posX: liveConfig.posX,
    posY: liveConfig.posY,
    voltage: liveConfig.voltage,
    current: liveConfig.current,
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
    },
    conclusao: liveConfig.conclusao,
    estado: liveConfig.estado,
    modo: liveConfig.modo,
  };

  telemetryFake += 1;

  try {
    getSocket().emit("telemetry:step", wsPayload);
  } catch (error) {
    console.error("[MOCK_WS_ERROR] Falha ao emitir telemetria via socket:", error);
  }

  try {
    // Usamos fetch nativo (Node 18+) para chamar o endpoint de ingestão criado no controller
    await fetch("http://127.0.0.1:3000/api/telemetry/ingest-mock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(esp32MockPayload),
    });

    if (liveConfig.conclusao) {
      console.log("[MOCK] 🏁 Conclusão detectada. Salvando sessão...");
    }
  } catch (error) {
    console.error("[MOCK_INGEST_ERROR] Falha ao enviar para o pipeline oficial:", error);
  }
};

export const startSimulator = () => {
  isPaused = false;
  if (simulatorInterval) {
    return;
  }

  console.log("[MOCK] 🏎️ Simulador iniciado.");
  simulatorInterval = setInterval(() => {
    if (!isPaused) {
      void emitTelemetryPulse();
    }
  }, 1500);

  void emitTelemetryPulse();
};

export const pauseSimulator = () => {
  isPaused = true;
  console.log("[MOCK] ⏸️ Simulador pausado.");
};

export const stopSimulator = () => {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
  }
  isPaused = false;
  telemetryFake = 0;
  console.log("[MOCK] 🛑 Simulador parado.");
};

export const resetSimulator = () => {
  stopSimulator();
  telemetryFake = 0; 
  
  liveConfig = {
    voltage: 12.1, current: 240, sensorFront: 25, sensorLeft: 25, sensorRight: 25,
    wallNorth: false, wallSouth: false, wallEast: false, wallWest: false,
    posX: 0, posY: 0, conclusao: false, estado: "EXPLORANDO", modo: "DFS", sessionName: "Sessão Ativa",
  };

  try {
    getSocket().emit("session_reset", { status: "cleared" });
  } catch (err) {
    console.error("[WS_MOCK_ERROR]", err);
  }
  console.log("[MOCK] 🧹 Simulador resetado.");
};

/**
 * Atualiza o estado interno e, se necessário, força a emissão imediata
 */
export const updateSimulatorConfig = (newConfig: any) => {
  const shouldEmitNow = newConfig.emitImmediate === true;
  delete newConfig.emitImmediate;

  liveConfig = { ...liveConfig, ...newConfig };

  // Se o frontend pediu para atualizar (Joystick/Checkboxes), forçamos o pulso
  if (shouldEmitNow || newConfig.conclusao) {
    void emitTelemetryPulse();
  }
};

export const commitSimulatorSession = async () => {
  try {
    const payload = {
      step: telemetryFake,
      tempoMs: Date.now(),
      modo: liveConfig.modo,
      estado: liveConfig.estado,
      posicao: { x: liveConfig.posX, y: liveConfig.posY },
      direcao: "norte",
      paredes: {
        norte: liveConfig.wallNorth,
        sul: liveConfig.wallSouth,
        leste: liveConfig.wallEast,
        oeste: liveConfig.wallWest,
      },
      motores: { pwmEsquerdo: 0, pwmDireito: 0 },
      sensores: {
        esquerdaCm: liveConfig.sensorLeft,
        frenteCm: liveConfig.sensorFront,
        direitaCm: liveConfig.sensorRight,
      },
      energia: {
        tensaoV: liveConfig.voltage,
        correnteMa: liveConfig.current,
      },
      conclusao: liveConfig.conclusao,
      robotId: "mock-simulator",
      sessionName: liveConfig.sessionName,
    } as any;

    const sessionId = await consolidateSession(payload);
    if (sessionId) {
      console.log(`[MOCK] 📝 Sessão consolidada no histórico: ${sessionId}`);
    }
    return sessionId;
  } catch (error) {
    console.error("[MOCK_COMMIT_ERROR] Falha ao consolidar sessão:", error);
    return null;
  }
};

export const getSimulatorStatus = () => {
  return { 
    running: simulatorInterval !== null, 
    paused: isPaused, 
    stepOrder: telemetryFake, 
    config: liveConfig 
  };
};