import {
  consolidateSession,
  resetTelemetryRunContextForTests,
  setActiveRunContextForSimulator,
} from "./telemetry.service";
import { getSocket } from "../websocket/socket";
import {
  findOrCreateSimulatorMaze,
  replaceMazeCells,
  type MazeCellWallInput,
} from "../repositories/maze.repository";
import { deleteOrphanSteps } from "../repositories/session-step.repository";
import { prisma } from "../lib/prisma";

let simulatorInterval: NodeJS.Timeout | null = null;
let isPaused = false;
/** Loop automático desligado no TestView; flag separada para Start/Pause/Stop. */
let isRunning = false;
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
  step: Number(telemetryFake),
  tempoMs: Number(Date.now()),
  modo: liveConfig.modo === "TESTE_SIMULADOR" ? "DFS" : liveConfig.modo,
  estado: liveConfig.estado === "RODANDO" ? "EXPLORANDO" : liveConfig.estado,
  posicao: { x: Number(liveConfig.posX), y: Number(liveConfig.posY) },
  direcao: "norte",
  paredes: {
    norte: Boolean(liveConfig.wallNorth),
    sul: Boolean(liveConfig.wallSouth),
    leste: Boolean(liveConfig.wallEast),
    oeste: Boolean(liveConfig.wallWest),
  },
  motores: { pwmEsquerdo: 0, pwmDireito: 0 },
  sensores: {
    esquerdaCm: Number(liveConfig.sensorLeft),
    frenteCm: Number(liveConfig.sensorFront),
    direitaCm: Number(liveConfig.sensorRight),
  },
  energia: {
    tensaoV: Number(liveConfig.voltage),
    correnteMa: Number(liveConfig.current),
  },
  conclusao: Boolean(liveConfig.conclusao),
  robotId: "mock-simulator",
  sessionName: String(liveConfig.sessionName),
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

  // 🚀 O SEGREDO: Em testes de integração reais (onde o server está desligado), barramos o fetch real.
  // Mas se o teste unitário forneceu um mock (jest.spyOn), nós deixamos prosseguir!
  const isFetchMocked = global.fetch && (global.fetch as any)._isMockFunction;
  if (process.env.NODE_ENV === "test" && !isFetchMocked) {
    return;
  }

  try {
    await fetch("http://127.0.0.1:3000/api/telemetry/ingest-mock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(esp32MockPayload),
    });

    if (liveConfig.conclusao) {
      console.log("[MOCK] 🏁 Conclusão detectada. Salvando sessão...");
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error("[MOCK_INGEST_ERROR] Falha ao enviar para o pipeline oficial:", error);
    }
  }
};

// Dentro de simulator.service.ts
export const startSimulator = () => {
  isPaused = false;
  isRunning = true;

  // Registra a posição atual como primeiro passo do trajeto (largada em qualquer célula).
  if (telemetryFake === 0) {
    void emitTelemetryPulse();
  }

  console.log(
    "[MOCK] 🏎️ Simulador iniciado (passos sob comando do joystick / pulso manual).",
  );
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
  isRunning = false;
  telemetryFake = 0;
  console.log("[MOCK] 🛑 Simulador parado.");
};

export const resetSimulator = async () => {
  stopSimulator();
  telemetryFake = 0;

  liveConfig = {
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

  resetTelemetryRunContextForTests();

  try {
    const removed = await deleteOrphanSteps();
    console.log(`[MOCK] 🧹 ${removed} passo(s) órfão(s) removido(s).`);
  } catch (err) {
    console.error("[MOCK_RESET_ERROR] Falha ao limpar passos órfãos:", err);
  }

  try {
    getSocket().emit("session_reset", { status: "cleared" });
  } catch (err) {
    console.error("[WS_MOCK_ERROR]", err);
  }
  console.log("[MOCK] 🧹 Simulador resetado.");
};

export const updateSimulatorConfig = (newConfig: any) => {
  const shouldEmitNow = newConfig.emitImmediate === true;
  delete newConfig.emitImmediate;

  liveConfig = { ...liveConfig, ...newConfig };
  console.log("[MOCK] 🛠️ Configurações atualizadas.");

  // Grava passo só com emitImmediate explícito E se não estiver pausado
  if ((shouldEmitNow || newConfig.conclusao) && !isPaused) {
    void emitTelemetryPulse();
  }
};

export const commitSimulatorSession = async (options?: {
  mazeCells?: MazeCellWallInput[];
  sessionName?: string;
}) => {
  try {
    const maze = await findOrCreateSimulatorMaze();

    if (options?.mazeCells && options.mazeCells.length > 0) {
      await replaceMazeCells(maze.id, options.mazeCells);
    }

    const modo =
      liveConfig.modo === "TESTE_SIMULADOR" ? "DFS" : liveConfig.modo;
    const estado =
      liveConfig.estado === "RODANDO" ? "EXPLORANDO" : liveConfig.estado;

    setActiveRunContextForSimulator({
      mazeId: maze.id,
      algorithm: modo,
      mode: estado,
    });

    const payload = {
      step: Number(telemetryFake),
      tempoMs: Number(Date.now()),
      modo,
      estado,
      posicao: { x: Number(liveConfig.posX), y: Number(liveConfig.posY) },
      direcao: "norte" as const,
      paredes: {
        norte: Boolean(liveConfig.wallNorth),
        sul: Boolean(liveConfig.wallSouth),
        leste: Boolean(liveConfig.wallEast),
        oeste: Boolean(liveConfig.wallWest),
      },
      motores: { pwmEsquerdo: 0, pwmDireito: 0 },
      sensores: {
        esquerdaCm: Number(liveConfig.sensorLeft),
        frenteCm: Number(liveConfig.sensorFront),
        direitaCm: Number(liveConfig.sensorRight),
      },
      energia: {
        tensaoV: Number(liveConfig.voltage),
        correnteMa: Number(liveConfig.current),
      },
      conclusao: Boolean(liveConfig.conclusao),
      robotId: "mock-simulator",
      sessionName: String(
        options?.sessionName ?? liveConfig.sessionName ?? "Simulação TestView",
      ),
    };

    const sessionId = await consolidateSession(payload as any);
    if (sessionId) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { mazeId: maze.id },
      });

      // Reaplica o labirinto do TestView depois da consolidação para
      // não deixar o último pulso do intervalo apagar paredes pintadas.
      if (options?.mazeCells && options.mazeCells.length > 0) {
        await replaceMazeCells(maze.id, options.mazeCells);
      }

      stopSimulator();
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
    running: isRunning,
    paused: isPaused,
    stepOrder: telemetryFake,
    config: liveConfig,
  };
};