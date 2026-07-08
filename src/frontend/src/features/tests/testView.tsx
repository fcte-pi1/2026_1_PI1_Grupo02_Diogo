import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Zap,
  History,
} from "lucide-react";
import type { SessionStep } from "../../types/session";
import { VisualizeDiv } from "../../components/VisualizeDiv";
import SensorGrid from "../telemetry/components/SensorGrid";
import BatteryWidget from "../telemetry/components/BatteryWidget";
import EngineTelemetryWidget from "../telemetry/components/EngineTelemetryWidget";
import type { TelemetryData } from "../../hooks/useWebSocket";
import { MazeEditor } from "../../components/MazeEditor";
import type { MazeCellWalls } from "../../types/maze";
import {
  canMove,
  createEmptyCell,
  getCellKey,
  getNeighbor,
  getWallField,
  type Direction,
} from "../../utils/verificarColisao";
import { lerSensoresProximidade, leituraFromCm } from "../../utils/sensorRaycast";
import type { SensorReading } from "../telemetry/components/SensorGrid";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000"
).replace("http://localhost:3000", "http://127.0.0.1:3000");

const GRID_SIZE = 16;

interface TestViewProps {
  robotData: TelemetryData | null;
  sessionSteps: TelemetryData[];
  isConnected: boolean;
}

type RightTab = "map" | "payload" | "sensors" | "steps";

function sortMazeCells(cells: MazeCellWalls[]): MazeCellWalls[] {
  return [...cells].sort((a, b) => {
    if (a.posY !== b.posY) return b.posY - a.posY;
    return a.posX - b.posX;
  });
}

function normalizeMazeCells(
  cells: MazeCellWalls[],
  width: number,
  height: number,
): MazeCellWalls[] {
  const map = new Map<string, MazeCellWalls>();

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      map.set(getCellKey(x, y), createEmptyCell(x, y));
    }
  }

  cells.forEach((cell) => {
    map.set(getCellKey(cell.posX, cell.posY), {
      posX: cell.posX,
      posY: cell.posY,
      wallNorth: cell.wallNorth ?? false,
      wallSouth: cell.wallSouth ?? false,
      wallEast: cell.wallEast ?? false,
      wallWest: cell.wallWest ?? false,
    });
  });

  return sortMazeCells(Array.from(map.values()));
}

export default function TestView({
  robotData,
  sessionSteps,
  isConnected,
}: TestViewProps) {
  const [status, setStatus] = useState({
    running: false,
    paused: false,
    stepOrder: 0,
  });

  const [voltage, setVoltage] = useState(12.1);
  const [current, setCurrent] = useState(240);
  // Origem (0,0) olhando Norte: Oeste=parede(borda), Norte/Leste=livres no alcance
  const [sensorFront, setSensorFront] = useState(40);
  const [sensorLeft, setSensorLeft] = useState(4);
  const [sensorRight, setSensorRight] = useState(40);
  const [posX, setPosX] = useState(7);
  const [posY, setPosY] = useState(7);
  const [robotRotation, setRobotRotation] = useState(0);
  const [activeRightTab, setActiveRightTab] = useState<RightTab>("map");
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(
    null,
  );
  const [mazeCells, setMazeCells] = useState<MazeCellWalls[]>(() =>
    normalizeMazeCells([], GRID_SIZE, GRID_SIZE),
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  /** Dispara o ping visual dos sensores a cada leitura/movimento. */
  const [sensorScanTick, setSensorScanTick] = useState(0);

  const clampPosition = (value: number) =>
    Math.min(GRID_SIZE - 1, Math.max(0, value));

  const mazeMap = useMemo(() => {
    const map = new Map<string, MazeCellWalls>();
    normalizeMazeCells(mazeCells, GRID_SIZE, GRID_SIZE).forEach((cell) => {
      map.set(getCellKey(cell.posX, cell.posY), cell);
    });
    return map;
  }, [mazeCells]);

  // 🧠 Raycast: distância real até a parede (passos livres) em FRENTE / ESQ / DIR
  useEffect(() => {
    const readings = lerSensoresProximidade(
      mazeMap,
      posX,
      posY,
      robotRotation,
      GRID_SIZE,
      GRID_SIZE,
    );

    const newSf = readings.front.cm;
    const newSl = readings.left.cm;
    const newSr = readings.right.cm;

    if (newSf !== sensorFront || newSl !== sensorLeft || newSr !== sensorRight) {
      setSensorFront(newSf);
      setSensorLeft(newSl);
      setSensorRight(newSr);
      setSensorScanTick((n) => n + 1);

      void syncVariablesToBackend({
        sensorFront: newSf,
        sensorLeft: newSl,
        sensorRight: newSr,
      });
    }
  }, [mazeMap, posX, posY, robotRotation]);

  const sensorReadings = useMemo(() => {
    return lerSensoresProximidade(
      mazeMap,
      posX,
      posY,
      robotRotation,
      GRID_SIZE,
      GRID_SIZE,
    );
  }, [mazeMap, posX, posY, robotRotation]);

  const toReading = (
    channel: "front" | "left" | "right",
    fallbackCm: number,
  ): SensorReading => {
    const live = sensorReadings[channel];
    // Se o usuário forçou override no slider, mantém cm mas recalcula label aproximado
    if (fallbackCm !== live.cm) {
      if (fallbackCm <= 8) {
        return { cm: fallbackCm, label: "PAREDE", detalhe: "Override manual" };
      }
      if (fallbackCm <= 20) {
        return { cm: fallbackCm, label: "PERTO", detalhe: "Override manual" };
      }
      return { cm: fallbackCm, label: "LIVRE", detalhe: "Override manual" };
    }
    return live;
  };

  const currentMazeCell = useMemo(() => {
    return mazeMap.get(getCellKey(posX, posY)) ?? createEmptyCell(posX, posY);
  }, [mazeMap, posX, posY]);

  const canMoveFrom = (x: number, y: number, dx: number, dy: number): boolean =>
    canMove(mazeMap, x, y, dx, dy, GRID_SIZE, GRID_SIZE);

  const currentStep = useMemo<TelemetryData>(() => {
    const baseStep = robotData ?? {
      id: "live",
      sessionId: "live-session",
      timestamp: new Date().toISOString(),
      stepOrder: status.stepOrder,
      posX,
      posY,
      voltage: 0,
      current: 0,
      sensors: { front: 0, left: 0, right: 0 },
      walls: { north: false, south: false, east: false, west: false },
    };

    return {
      ...baseStep,
      stepOrder: baseStep.stepOrder ?? status.stepOrder,
      posX,
      posY,
      voltage: voltage ?? baseStep.voltage ?? 0,
      current: current ?? baseStep.current ?? 0,
      sensors: {
        front: sensorFront,
        left: sensorLeft,
        right: sensorRight,
      },
      walls: {
        north: currentMazeCell.wallNorth,
        south: currentMazeCell.wallSouth,
        east: currentMazeCell.wallEast,
        west: currentMazeCell.wallWest,
      },
    };
  }, [
    robotData,
    status.stepOrder,
    posX,
    posY,
    voltage,
    current,
    sensorFront,
    sensorLeft,
    sensorRight,
    currentMazeCell,
  ]);

  // CORREÇÃO: Lógica para o índice seguir sempre o passo mais recente, 
  // caso contrário o robô ficaria congelado na posição 0,0 do histórico.
  useEffect(() => {
    if (sessionSteps.length > 0) {
      setSelectedStepIndex((prev) => {
        // Se estava nulo (tempo real) ou acompanhando o último passo anterior, atualiza pro novo
        if (prev === null || prev === sessionSteps.length - 2) {
          return sessionSteps.length - 1;
        }
        return prev;
      });
    } else {
      setSelectedStepIndex(null);
    }
  }, [sessionSteps.length]);

  const selectedStep =
    selectedStepIndex !== null && sessionSteps[selectedStepIndex]
      ? sessionSteps[selectedStepIndex]
      : currentStep;

  const displaySessionSteps = useMemo(
    () =>
      sessionSteps.map((step) => ({
        ...step,
        createdAt: step.timestamp ?? new Date().toISOString(),
      })) as unknown as SessionStep[],
    [sessionSteps],
  );

  const selectedVoltage = selectedStep?.voltage ?? currentStep.voltage ?? 0;

  const batteryPercentage = Math.max(
    0,
    Math.min(100, Math.round((selectedVoltage / 12.6) * 100)),
  );

  const syncVariablesToBackend = async (
    overrides: Record<string, unknown> = {},
  ) => {
    const payload = {
      voltage,
      current,
      sensorFront,
      sensorLeft,
      sensorRight,
      wallNorth: currentMazeCell.wallNorth,
      wallSouth: currentMazeCell.wallSouth,
      wallEast: currentMazeCell.wallEast,
      wallWest: currentMazeCell.wallWest,
      posX,
      posY,
      // emitImmediate: true foi removido daqui!
      ...overrides,
    };

    try {
      await fetch(`${API_BASE_URL}/api/telemetry/simulator/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Falha ao sincronizar variáveis reativas:", err);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/telemetry/simulator/status`);

      if (res.ok) {
        const data = await res.json();

        setStatus({
          running: data.running,
          paused: data.paused,
          stepOrder: data.stepOrder,
        });

        if (data?.config) {
          // Não sobrescreve posX/posY: o joystick / editor é a fonte da verdade.
          // O poll antigo teletransportava o rato e gravava saltos no histórico.
          setVoltage(Number(data.config.voltage ?? 12.1));
          setCurrent(Number(data.config.current ?? 240));
        }
      }
    } catch (err) {
      console.error("Erro ao buscar status do simulador:", err);
    }
  };

  useEffect(() => {
    void fetchStatus();

    const interval = setInterval(() => {
      void fetchStatus();
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const toggleWall = (x: number, y: number, dir: Direction) => {
    setMazeCells((prev) => {
      const map = new Map<string, MazeCellWalls>(
        normalizeMazeCells(prev, GRID_SIZE, GRID_SIZE).map((cell) => [
          getCellKey(cell.posX, cell.posY),
          { ...cell },
        ]),
      );

      const currentKey = getCellKey(x, y);
      const currentCell = map.get(currentKey) ?? createEmptyCell(x, y);

      const currentField = getWallField(dir);
      const nextValue = !currentCell[currentField];

      currentCell[currentField] = nextValue;
      map.set(currentKey, currentCell);

      const neighbor = getNeighbor(x, y, dir);
      const isInsideGrid =
        neighbor.x >= 0 &&
        neighbor.x < GRID_SIZE &&
        neighbor.y >= 0 &&
        neighbor.y < GRID_SIZE;

      if (isInsideGrid) {
        const neighborKey = getCellKey(neighbor.x, neighbor.y);
        const neighborCell =
          map.get(neighborKey) ?? createEmptyCell(neighbor.x, neighbor.y);
        const oppositeField = getWallField(neighbor.opposite);

        neighborCell[oppositeField] = nextValue;
        map.set(neighborKey, neighborCell);
      }

      const nextCells = sortMazeCells(Array.from(map.values()));

      const activeCell =
        nextCells.find((cell) => cell.posX === posX && cell.posY === posY) ??
        createEmptyCell(posX, posY);

      void syncVariablesToBackend({
        wallNorth: activeCell.wallNorth,
        wallSouth: activeCell.wallSouth,
        wallEast: activeCell.wallEast,
        wallWest: activeCell.wallWest,
      });

      return nextCells;
    });
  };

  const handleJoystickMove = (dx: number, dy: number) => {
    setSelectedStepIndex(null); 

    // 1. Vira o focinho do rato
    let newRot = robotRotation;
    if (dx === 0 && dy === 1) newRot = 0;
    if (dx === 1 && dy === 0) newRot = 90;
    if (dx === 0 && dy === -1) newRot = 180;
    if (dx === -1 && dy === 0) newRot = 270; // Usando 270 em vez de -90
    setRobotRotation(newRot);

    // 2. Colisão: só aborta — não grava passo (evita teleporte / passo fantasma no histórico)
    if (!canMoveFrom(posX, posY, dx, dy)) {
      return;
    }

    // 3. Se o caminho está livre, anda pra frente
    const nextX = clampPosition(posX + dx);
    const nextY = clampPosition(posY + dy);

    setPosX(nextX);
    setPosY(nextY);
    setSensorScanTick((n) => n + 1);

    const nextCell =
      mazeMap.get(getCellKey(nextX, nextY)) ?? createEmptyCell(nextX, nextY);

    void syncVariablesToBackend({
      posX: nextX,
      posY: nextY,
      wallNorth: nextCell.wallNorth,
      wallSouth: nextCell.wallSouth,
      wallEast: nextCell.wallEast,
      wallWest: nextCell.wallWest,
      // Só grava passo no histórico depois do Start
      ...(status.running ? { emitImmediate: true } : {}),
    });
  };

  const handleAction = async (
    action: "start" | "pause" | "stop" | "reset" | "commit",
  ) => {
    setActionBusy(true);
    setActionError(null);

    try {
      if (action === "commit") {
        // Emite um último pulso só se já houver movimento (running) — senão não inventa passo.
        if (status.running) {
          await syncVariablesToBackend({ emitImmediate: true });
        }
      }

      if (action === "reset") {
        setSelectedStepIndex(null);
        setRobotRotation(0);
        setVoltage(12.1);
        setCurrent(240);
        setSensorFront(25);
        setSensorLeft(25);
        setSensorRight(25);
        setPosX(7);
        setPosY(7);
        setMazeCells(normalizeMazeCells([], GRID_SIZE, GRID_SIZE));
        setStatus({ running: false, paused: false, stepOrder: 0 });

        // Sem emitImmediate: reset não deve criar passo órfão nem iniciar o cronômetro.
        await syncVariablesToBackend({
          voltage: 12.1,
          current: 240,
          sensorFront: 25,
          sensorLeft: 25,
          sensorRight: 25,
          wallNorth: false,
          wallSouth: false,
          wallEast: false,
          wallWest: false,
          posX: 7,
          posY: 7,
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/telemetry/simulator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "commit"
            ? {
                action,
                width: GRID_SIZE,
                height: GRID_SIZE,
                sessionName: `Simulação TestView - ${new Date().toLocaleString("pt-BR")}`,
                mazeCells: mazeCells.map((cell) => ({
                  posX: cell.posX,
                  posY: cell.posY,
                  wallNorth: cell.wallNorth,
                  wallSouth: cell.wallSouth,
                  wallEast: cell.wallEast,
                  wallWest: cell.wallWest,
                })),
              }
            : { action },
        ),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
          message?: string;
        } | null;
        throw new Error(
          payload?.error ??
            payload?.message ??
            `Backend respondeu ${response.status} em ${API_BASE_URL}`,
        );
      }

      const payload = (await response.json().catch(() => null)) as {
        sessionId?: string | null;
        message?: string;
      } | null;

      if (action === "start") {
        setStatus((prev) => ({ ...prev, running: true, paused: false }));
      } else if (action === "pause") {
        setStatus((prev) => ({ ...prev, paused: true }));
      } else if (action === "stop") {
        setStatus({ running: false, paused: false, stepOrder: 0 });
      } else if (action === "reset") {
        setStatus({ running: false, paused: false, stepOrder: 0 });
      } else if (action === "commit") {
        setStatus((prev) => ({ ...prev, running: false, paused: false }));
        if (!payload?.sessionId) {
          setActionError(
            "Nenhum passo órfão para consolidar. Use Start + joystick (ou Forçar Pulso) antes de enviar ao histórico.",
          );
        }
      }
    } catch (err) {
      const message =
        err instanceof TypeError
          ? `Backend offline em ${API_BASE_URL}. Suba a API (porta 3000) e tente de novo.`
          : err instanceof Error
            ? err.message
            : "Falha ao processar ação do simulador.";
      console.error("Erro ao processar ação:", err);
      setActionError(message);
    } finally {
      setActionBusy(false);
    }
  };

  const rightTabs: { id: RightTab; label: string }[] = [
    { id: "map", label: "Labirinto" },
    { id: "payload", label: "API" },
    { id: "sensors", label: "Sensores" },
    { id: "steps", label: "Steps" },
  ];

  return (
    <div className="w-full h-full p-6 flex flex-col gap-4 font-mono text-xs overflow-hidden box-border">
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-0 overflow-hidden">
        <div className="xl:col-span-5 flex flex-col gap-4 h-full overflow-y-auto pr-2 custom-scrollbar">
          {/* PAINEL LOOP E STATUS */}
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col gap-3 shrink-0">
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
              <span className="text-outline uppercase tracking-wider text-[10px]">
                LOOP DE REPRODUÇÃO:
              </span>
              <span
                className={`font-bold tracking-widest px-2 py-0.5 border text-[10px] ${
                  status.running && !status.paused
                    ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 animate-pulse"
                    : status.paused
                      ? "text-amber-400 border-amber-500/30 bg-amber-500/5"
                      : "text-red-400 border-red-500/30 bg-red-500/5"
                }`}
              >
                {status.running && !status.paused
                  ? "● EXECUTANDO"
                  : status.paused
                    ? "⏸ PAUSADO"
                    : "○ PARADO"}
              </span>
            </div>

            <div className="flex gap-2 w-full">
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => void handleAction("start")}
                className="flex-1 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 py-2 font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Play className="w-3 h-3" /> Start
              </button>

              <button
                type="button"
                onClick={() => void handleAction("pause")}
                disabled={actionBusy || !status.running || status.paused}
                className="flex-1 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 py-2 font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30"
              >
                <Pause className="w-3 h-3" /> Pause
              </button>

              <button
                type="button"
                onClick={() => void handleAction("stop")}
                disabled={actionBusy || (!status.running && !status.paused)}
                className="flex-1 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 py-2 font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30"
              >
                <RotateCcw className="w-3 h-3" /> Stop
              </button>
            </div>

            {actionError && (
              <div
                data-testid="simulator-action-error"
                className="mt-2 border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-[10px] leading-relaxed text-red-300"
              >
                {actionError}
              </div>
            )}
          </div>

          {/* PAINEL JOYSTICK */}
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col gap-3 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-3">
                <h2 className="text-label-caps font-bold text-on-surface-variant uppercase border-b border-outline-variant/10 pb-1.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" /> Joystick
                </h2>

                <div className="flex justify-center">
                  <div className="flex flex-col items-center gap-1 bg-surface-container-lowest p-2 border border-outline-variant/10 rounded-full shadow-inner">
                    <button
                      type="button"
                      aria-label="Mover para norte"
                      onClick={() => handleJoystickMove(0, 1)}
                      className="p-3 bg-surface-container-low hover:bg-primary/20 hover:text-primary transition-colors border border-outline-variant/10 rounded-t-full"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        aria-label="Mover para oeste"
                        onClick={() => handleJoystickMove(-1, 0)}
                        className="p-3 bg-surface-container-low hover:bg-primary/20 hover:text-primary transition-colors border border-outline-variant/10 rounded-l-full"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <div
                        className="w-16 h-11 flex flex-col items-center justify-center font-bold text-primary bg-black/20 border border-outline-variant/10 shadow-inner px-2"
                        title="Posição Atual"
                        data-testid="joystick-position"
                      >
                        <span className="text-[14px]">
                          {posX},{posY}
                        </span>
                      </div>

                      <button
                        type="button"
                        aria-label="Mover para leste"
                        onClick={() => handleJoystickMove(1, 0)}
                        className="p-3 bg-surface-container-low hover:bg-primary/20 hover:text-primary transition-colors border border-outline-variant/10 rounded-r-full"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      aria-label="Mover para sul"
                      onClick={() => handleJoystickMove(0, -1)}
                      className="p-3 bg-surface-container-low hover:bg-primary/20 hover:text-primary transition-colors border border-outline-variant/10 rounded-b-full"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h2 className="text-label-caps font-bold text-on-surface-variant uppercase border-b border-outline-variant/10 pb-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-primary" /> Editor no
                  mapa
                </h2>

                <div className="text-[10px] text-outline leading-relaxed">
                  Clique nas bordas das células no labirinto à direita para
                  criar ou remover paredes.
                </div>
              </div>
            </div>
          </div>

          {/* PAINEL SENSORES & ENERGIA */}
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col gap-3 shrink-0">
            <h2 className="text-label-caps font-bold text-on-surface-variant uppercase border-b border-outline-variant/10 pb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-primary" /> Distâncias &
              Tensão
            </h2>

            <div className="bg-surface-container-lowest border border-outline-variant/10 p-2">
              <div className="flex justify-between mb-1 text-[9px] text-outline">
                <span>VOLTAGE:</span>
                <span className="text-primary">{voltage.toFixed(1)}V</span>
              </div>
              <input
                type="range"
                min="9"
                max="13"
                step="0.1"
                value={voltage}
                onChange={(e) => {
                  const nextVoltage = Number(e.target.value);
                  setVoltage(nextVoltage);
                  void syncVariablesToBackend({ voltage: nextVoltage });
                }}
                className="w-full accent-primary h-1"
              />
            </div>

            <div className="mt-3 min-h-[14rem]">
              <SensorGrid
                sensorData={{
                  front: toReading("front", sensorFront),
                  left: toReading("left", sensorLeft),
                  right: toReading("right", sensorRight),
                }}
                scanTick={sensorScanTick}
                interactive
              />
            </div>

            <details className="mt-2 border border-outline-variant/20 bg-surface-container-lowest/60 p-2">
              <summary className="cursor-pointer text-[9px] uppercase tracking-wider text-outline">
                Ajuste manual (override)
              </summary>
              <div className="mt-2 space-y-2">
                <div>
                  <div className="flex justify-between mb-1 text-[9px] text-outline">
                    <span>FRONT:</span>
                    <span className="text-primary">
                      {toReading("front", sensorFront).label}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="40"
                    value={sensorFront}
                    onChange={(e) => {
                      const sf = Number(e.target.value);
                      setSensorFront(sf);
                      setSensorScanTick((n) => n + 1);
                      void syncVariablesToBackend({ sensorFront: sf });
                    }}
                    className="w-full accent-primary h-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between mb-1 text-[9px] text-outline">
                      <span>LEFT:</span>
                      <span className="text-primary">
                        {toReading("left", sensorLeft).label}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="40"
                      value={sensorLeft}
                      onChange={(e) => {
                        const sl = Number(e.target.value);
                        setSensorLeft(sl);
                        setSensorScanTick((n) => n + 1);
                        void syncVariablesToBackend({ sensorLeft: sl });
                      }}
                      className="w-full accent-primary h-1"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-[9px] text-outline">
                      <span>RIGHT:</span>
                      <span className="text-primary">
                        {toReading("right", sensorRight).label}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="40"
                      value={sensorRight}
                      onChange={(e) => {
                        const sr = Number(e.target.value);
                        setSensorRight(sr);
                        setSensorScanTick((n) => n + 1);
                        void syncVariablesToBackend({ sensorRight: sr });
                      }}
                      className="w-full accent-primary h-1"
                    />
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* PAINEL DE AÇÕES */}
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col gap-3 shrink-0">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => void handleAction("commit")}
                className="flex-1 bg-primary/10 border border-primary text-primary font-bold py-2 flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors uppercase text-[10px] tracking-widest disabled:opacity-50"
              >
                <History className="w-3.5 h-3.5" /> Enviar fluxo p/ histórico
              </button>

              <button
                type="button"
                disabled={actionBusy}
                onClick={() => void handleAction("reset")}
                className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 font-bold py-2 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors uppercase text-[10px] tracking-widest disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Zerar sessão
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!status.running) {
                  setActionError(
                    "Inicie com Start antes de forçar um pulso (evita passos fantasmas no histórico).",
                  );
                  return;
                }
                void syncVariablesToBackend({ emitImmediate: true });
                window.alert("Pulso instantâneo enviado");
              }}
              className="w-full bg-surface-container-lowest border border-outline-variant/20 text-outline py-2 flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors uppercase text-[10px] tracking-widest"
            >
              <Zap className="w-3.5 h-3.5" /> Forçar Pulso Instantâneo
            </button>
          </div>
        </div>

        <div className="xl:col-span-7 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
          <div className="flex items-center justify-between bg-surface-container-low/60 border border-outline-variant/30 px-3 py-2 shrink-0">
            <div className="flex gap-2">
              {rightTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRightTab(tab.id)}
                  className={`px-3 py-1.5 border text-[10px] uppercase tracking-wider transition-colors ${
                    activeRightTab === tab.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-outline-variant/20 bg-surface-container-lowest text-outline hover:text-on-surface"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-outline">
              <span>Step:</span>
              <span className="text-primary font-bold">
                {selectedStep?.stepOrder ?? 0}
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[15.625rem] relative bg-surface-container-low/40 border border-outline-variant/30 overflow-hidden">
            <div className="hidden" data-testid="mock-visualize">
              <VisualizeDiv
                activeSession={null}
                currentView="dashboard"
                robotData={
                  selectedStep
                    ? ({
                        ...selectedStep,
                        createdAt: new Date().toISOString(),
                      } as unknown as SessionStep)
                    : null
                }
                steps={displaySessionSteps}
                isSocketConnected={isConnected}
                posX={selectedStep?.posX ?? 7}
                posY={selectedStep?.posY ?? 7}
                connectionProps={{ latency: "0" }}
              />
            </div>

            {activeRightTab === "map" && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between border-b border-outline-variant/20 px-3 py-2 shrink-0">
                  <div className="text-[10px] text-outline uppercase tracking-wider">
                    Mapa em tempo real
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setSelectedStepIndex((prev) =>
                          prev !== null && prev > 0 ? prev - 1 : 0,
                        )
                      }
                      disabled={
                        sessionSteps.length === 0 ||
                        selectedStepIndex === 0 ||
                        selectedStepIndex === null
                      }
                      className="px-2 py-1 border border-outline-variant/20 bg-surface-container-lowest disabled:opacity-30 transition-colors"
                    >
                      Anterior
                    </button>

                    <button
                      onClick={() =>
                        setSelectedStepIndex((prev) =>
                          prev !== null && prev < sessionSteps.length - 1
                            ? prev + 1
                            : sessionSteps.length - 1,
                        )
                      }
                      disabled={
                        sessionSteps.length === 0 ||
                        selectedStepIndex === null ||
                        selectedStepIndex >= sessionSteps.length - 1
                      }
                      className="px-2 py-1 border border-outline-variant/20 bg-surface-container-lowest disabled:opacity-30 transition-colors"
                    >
                      Próximo
                    </button>
                  </div>
                </div>

                <div className="flex-1 w-full relative p-4 flex items-center justify-center overflow-auto">
                  <MazeEditor
                    cells={mazeCells}
                    steps={displaySessionSteps}
                    currentX={selectedStep?.posX ?? posX}
                    currentY={selectedStep?.posY ?? posY}
                    robotRotation={robotRotation}
                    width={GRID_SIZE}
                    height={GRID_SIZE}
                    onToggleWall={toggleWall}
                  />
                </div>
              </div>
            )}

            {activeRightTab === "payload" && (
              <div className="h-full p-4 overflow-auto bg-black/40 text-[10px] text-emerald-400/90 leading-relaxed custom-scrollbar break-all">
                {!robotData && sessionSteps.length === 0 && !isConnected ? (
                  <div className="text-outline text-center mt-10 italic">
                    Aguardando tráfego...
                  </div>
                ) : (
                  <pre>
                    {JSON.stringify(selectedStep ?? currentStep, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {activeRightTab === "sensors" && (
              <div className="h-full p-6 flex flex-col gap-6 overflow-auto">
                <SensorGrid
                  sensorData={{
                    front: toReading(
                      "front",
                      selectedStep?.sensors?.front ??
                        currentStep.sensors?.front ??
                        sensorFront,
                    ),
                    left: toReading(
                      "left",
                      selectedStep?.sensors?.left ??
                        currentStep.sensors?.left ??
                        sensorLeft,
                    ),
                    right: toReading(
                      "right",
                      selectedStep?.sensors?.right ??
                        currentStep.sensors?.right ??
                        sensorRight,
                    ),
                  }}
                  scanTick={sensorScanTick}
                  interactive
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
                  <BatteryWidget
                    voltage={selectedVoltage}
                    percentage={batteryPercentage}
                    isCritical={selectedVoltage < 10.5}
                  />
                  <EngineTelemetryWidget velocity={0} />
                </div>
              </div>
            )}

            {activeRightTab === "steps" && (
              <div className="h-full p-4 overflow-auto custom-scrollbar">
                <div className="flex flex-col gap-2">
                  {sessionSteps.length === 0 ? (
                    <div className="p-3 border border-outline-variant/20 bg-surface-container-lowest text-outline text-center italic mt-10">
                      Nenhum step registrado ainda.
                    </div>
                  ) : (
                    sessionSteps.map((step, index) => (
                      <button
                        key={`${step.id}-${index}`}
                        onClick={() => setSelectedStepIndex(index)}
                        className={`text-left border px-3 py-2 transition-colors ${
                          selectedStepIndex === index
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-outline-variant/20 bg-surface-container-lowest text-on-surface hover:border-primary/40"
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="font-bold">
                            Step {step.stepOrder}
                          </span>
                          <span className="text-[9px] text-outline bg-black/20 px-2 rounded-full">
                            ({step.posX},{step.posY})
                          </span>
                        </div>

                        <div className="text-[10px] text-outline mt-1">
                          V: {step.voltage?.toFixed(1)}V &bull; F:{" "}
                          {leituraFromCm(step.sensors?.front ?? 0).label}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}