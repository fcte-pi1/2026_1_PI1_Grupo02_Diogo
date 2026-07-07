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

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000").replace("http://localhost:3000", "http://127.0.0.1:3000");

interface TestViewProps {
  robotData: TelemetryData | null;
  sessionSteps: TelemetryData[];
  isConnected: boolean;
}

type RightTab = "map" | "payload" | "sensors" | "steps";

export default function TestView({ robotData, sessionSteps, isConnected }: TestViewProps) {
  const [status, setStatus] = useState({ running: false, paused: false, stepOrder: 0 });
  const [voltage, setVoltage] = useState(12.1);
  const [current, setCurrent] = useState(240);
  const [sensorFront, setSensorFront] = useState(25);
  const [sensorLeft, setSensorLeft] = useState(25);
  const [sensorRight, setSensorRight] = useState(25);
  const [walls, setWalls] = useState({ north: false, south: false, east: false, west: false });
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [activeRightTab, setActiveRightTab] = useState<RightTab>("map");
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  const clampPosition = (value: number) => Math.min(7, Math.max(0, value));

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
        north: walls.north,
        south: walls.south,
        east: walls.east,
        west: walls.west,
      },
    };
  }, [robotData, status.stepOrder, posX, posY, voltage, current, sensorFront, sensorLeft, sensorRight, walls]);

  useEffect(() => {
    if (sessionSteps.length > 0) {
      setSelectedStepIndex((prev) => {
        if (prev === null || prev >= sessionSteps.length) {
          return sessionSteps.length - 1;
        }
        return prev;
      });
    } else {
      setSelectedStepIndex(null);
    }
  }, [sessionSteps.length]);

  const selectedStep = selectedStepIndex !== null && sessionSteps[selectedStepIndex]
    ? sessionSteps[selectedStepIndex]
    : currentStep;

  const selectedVoltage = selectedStep?.voltage ?? currentStep.voltage ?? 0;
  const batteryPercentage = Math.max(0, Math.min(100, Math.round((selectedVoltage / 12.6) * 100)));

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/telemetry/simulator/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus({ running: data.running, paused: data.paused, stepOrder: data.stepOrder });

        if (data?.config) {
          setVoltage(Number(data.config.voltage ?? 12.1));
          setCurrent(Number(data.config.current ?? 240));
          setSensorFront(Number(data.config.sensorFront ?? 25));
          setSensorLeft(Number(data.config.sensorLeft ?? 25));
          setSensorRight(Number(data.config.sensorRight ?? 25));
          setWalls({
            north: Boolean(data.config.wallNorth),
            south: Boolean(data.config.wallSouth),
            east: Boolean(data.config.wallEast),
            west: Boolean(data.config.wallWest),
          });
          setPosX(Number(data.config.posX ?? 0));
          setPosY(Number(data.config.posY ?? 0));
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

  const syncVariablesToBackend = async (overrides: Record<string, unknown> = {}) => {
    const payload = {
      voltage, current, sensorFront, sensorLeft, sensorRight,
      wallNorth: walls.north, wallSouth: walls.south, wallEast: walls.east, wallWest: walls.west,
      posX, posY, emitImmediate: true, ...overrides,
    };

    try {
      await fetch(`${API_BASE_URL}/api/telemetry/simulator/update`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Falha ao sincronizar variáveis reativas:", err);
    }
  };

  const handleJoystickMove = (dx: number, dy: number) => {
    const nextX = clampPosition(posX + dx);
    const nextY = clampPosition(posY + dy);
    setPosX(nextX);
    setPosY(nextY);
    void syncVariablesToBackend({ posX: nextX, posY: nextY });
  };

  const handleAction = async (action: "start" | "pause" | "stop" | "reset" | "commit") => {
    try {
      if (action === "commit") {
        await syncVariablesToBackend({ emitImmediate: true });
      }

      if (action === "reset") {
        setVoltage(12.1); setCurrent(240); setSensorFront(25); setSensorLeft(25); setSensorRight(25);
        setWalls({ north: false, south: false, east: false, west: false });
        setPosX(0); setPosY(0);
        await syncVariablesToBackend({
          voltage: 12.1, current: 240, sensorFront: 25, sensorLeft: 25, sensorRight: 25,
          wallNorth: false, wallSouth: false, wallEast: false, wallWest: false,
          posX: 0, posY: 0, emitImmediate: true,
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/telemetry/simulator`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
      });

      if (response.ok) {
        if (action === "start") setStatus((prev) => ({ ...prev, running: true, paused: false }));
        else if (action === "pause") setStatus((prev) => ({ ...prev, paused: true }));
        else if (action === "stop") setStatus({ running: false, paused: false, stepOrder: 0 });
        else if (action === "reset") setStatus({ running: false, paused: false, stepOrder: 0 });
        else if (action === "commit") setStatus((prev) => ({ ...prev, running: false, paused: false }));
      }
    } catch (err) {
      console.error("Erro ao processar ação:", err);
    }
  };

  const handleResetPosition = () => {
    setPosX(0);
    setPosY(0);
    void syncVariablesToBackend({ posX: 0, posY: 0 });
  };

  const rightTabs: { id: RightTab; label: string }[] = [
    { id: "map", label: "Labirinto" },
    { id: "payload", label: "API" },
    { id: "sensors", label: "Sensores" },
    { id: "steps", label: "Steps" },
  ];

  const toggleWall = (dir: 'north' | 'south' | 'east' | 'west') => {
    const newWalls = { ...walls, [dir]: !walls[dir] };
    setWalls(newWalls);
    void syncVariablesToBackend({ 
      wallNorth: newWalls.north, wallSouth: newWalls.south,
      wallEast: newWalls.east, wallWest: newWalls.west
    });
  };

  return (
    <div className="w-full h-full p-6 flex flex-col gap-4 font-mono text-xs overflow-hidden box-border">
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-0 overflow-hidden">
        
        {/* COLUNA ESQUERDA: CONTROLES */}
        <div className="xl:col-span-5 flex flex-col gap-4 h-full overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Loop de Reprodução */}
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col gap-3 shrink-0">
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
              <span className="text-outline uppercase tracking-wider text-[10px]">LOOP DE REPRODUÇÃO:</span>
              <span className={`font-bold tracking-widest px-2 py-0.5 border text-[10px] ${status.running && !status.paused ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 animate-pulse" : status.paused ? "text-amber-400 border-amber-500/30 bg-amber-500/5" : "text-red-400 border-red-500/30 bg-red-500/5"}`}>
                {status.running && !status.paused ? "● EXECUTANDO" : status.paused ? "⏸ PAUSADO" : "○ PARADO"}
              </span>
            </div>
            <div className="flex gap-2 w-full">
              <button onClick={() => void handleAction("start")} className="flex-1 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 py-2 font-bold flex items-center justify-center gap-1.5 transition-colors">
                <Play className="w-3 h-3" /> Start
              </button>
              <button onClick={() => void handleAction("pause")} disabled={!status.running || status.paused} className="flex-1 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 py-2 font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30">
                <Pause className="w-3 h-3" /> Pause
              </button>
              <button onClick={() => void handleAction("stop")} disabled={!status.running && !status.paused} className="flex-1 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 py-2 font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30">
                <RotateCcw className="w-3 h-3" /> Stop
              </button>
            </div>
          </div>

          {/* Entradas Físicas (Joystick e Cubo) */}
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col gap-3 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-3">
                <h2 className="text-label-caps font-bold text-on-surface-variant uppercase border-b border-outline-variant/10 pb-1.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" /> Joystick
                </h2>
                <div className="flex justify-center">
                  <div className="flex flex-col items-center gap-1 bg-surface-container-lowest p-2 border border-outline-variant/10 rounded-full shadow-inner">
                    <button onClick={() => handleJoystickMove(0, 1)} className="p-3 bg-surface-container-low hover:bg-primary/20 hover:text-primary transition-colors border border-outline-variant/10 rounded-t-full">
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => handleJoystickMove(-1, 0)} className="p-3 bg-surface-container-low hover:bg-primary/20 hover:text-primary transition-colors border border-outline-variant/10 rounded-l-full">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      {/* Inputs minúsculos quebrados removidos. Apenas display limpo. */}
                      <div className="w-16 h-11 flex flex-col items-center justify-center font-bold text-primary bg-black/20 border border-outline-variant/10 shadow-inner px-2" title="Posição Atual">
                        <span className="text-[14px]">{posX},{posY}</span>
                      </div>
                      
                      <button onClick={() => handleJoystickMove(1, 0)} className="p-3 bg-surface-container-low hover:bg-primary/20 hover:text-primary transition-colors border border-outline-variant/10 rounded-r-full">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    <button onClick={() => handleJoystickMove(0, -1)} className="p-3 bg-surface-container-low hover:bg-primary/20 hover:text-primary transition-colors border border-outline-variant/10 rounded-b-full">
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h2 className="text-label-caps font-bold text-on-surface-variant uppercase border-b border-outline-variant/10 pb-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-primary" /> Cubo de paredes
                </h2>
                <div className="flex justify-center mt-2">
                  <div className="relative w-20 h-20 bg-surface-container-high flex items-center justify-center">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                    <button aria-label="WALL_NORTH" title="WALL_NORTH" type="button" onClick={() => toggleWall('north')} className={`absolute -top-3 left-0 w-full h-4 cursor-pointer ${walls.north ? 'bg-red-500' : 'bg-outline-variant/20'}`} />
                    <button aria-label="WALL_SOUTH" title="WALL_SOUTH" type="button" onClick={() => toggleWall('south')} className={`absolute -bottom-3 left-0 w-full h-4 cursor-pointer ${walls.south ? 'bg-red-500' : 'bg-outline-variant/20'}`} />
                    <button aria-label="WALL_WEST" title="WALL_WEST" type="button" onClick={() => toggleWall('west')} className={`absolute top-0 -left-3 w-4 h-full cursor-pointer ${walls.west ? 'bg-red-500' : 'bg-outline-variant/20'}`} />
                    <button aria-label="WALL_EAST" title="WALL_EAST" type="button" onClick={() => toggleWall('east')} className={`absolute top-0 -right-3 w-4 h-full cursor-pointer ${walls.east ? 'bg-red-500' : 'bg-outline-variant/20'}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sensores e Energia */}
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col gap-3 shrink-0">
            <h2 className="text-label-caps font-bold text-on-surface-variant uppercase border-b border-outline-variant/10 pb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-primary" /> Distâncias & Tensão
            </h2>
            <div className="bg-surface-container-lowest border border-outline-variant/10 p-2">
              <div className="flex justify-between mb-1 text-[9px] text-outline"><span>VOLTAGE:</span><span className="text-primary">{voltage.toFixed(1)}V</span></div>
              <input type="range" min="9" max="13" step="0.1" value={voltage} onChange={(e) => { const nextVoltage = Number(e.target.value); setVoltage(nextVoltage); void syncVariablesToBackend({ voltage: nextVoltage }); }} className="w-full accent-primary h-1" />
            </div>
            
            <div className="bg-surface-container-lowest border border-outline-variant/10 p-2 mt-2">
              <div className="flex justify-between mb-1 text-[9px] text-outline"><span>FRONT:</span><span className="text-primary">{sensorFront}cm</span></div>
              <input type="range" min="3" max="40" value={sensorFront} onChange={(e) => { const sf = Number(e.target.value); setSensorFront(sf); void syncVariablesToBackend({ sensorFront: sf }); }} className="w-full accent-primary h-1" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-surface-container-lowest border border-outline-variant/10 p-2">
                <div className="flex justify-between mb-1 text-[9px] text-outline"><span>LEFT:</span><span className="text-primary">{sensorLeft}cm</span></div>
                <input type="range" min="3" max="40" value={sensorLeft} onChange={(e) => { const sl = Number(e.target.value); setSensorLeft(sl); void syncVariablesToBackend({ sensorLeft: sl }); }} className="w-full accent-primary h-1" />
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/10 p-2">
                <div className="flex justify-between mb-1 text-[9px] text-outline"><span>RIGHT:</span><span className="text-primary">{sensorRight}cm</span></div>
                <input type="range" min="3" max="40" value={sensorRight} onChange={(e) => { const sr = Number(e.target.value); setSensorRight(sr); void syncVariablesToBackend({ sensorRight: sr }); }} className="w-full accent-primary h-1" />
              </div>
            </div>
          </div>

          {/* Ações de Comando e Limpeza */}
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col gap-3 shrink-0">
            <div className="flex gap-2">
              <button onClick={() => void handleAction("commit")} className="flex-1 bg-primary/10 border border-primary text-primary font-bold py-2 flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors uppercase text-[10px] tracking-widest">
                <History className="w-3.5 h-3.5" /> Enviar fluxo p/ histórico
              </button>
              <button onClick={() => void handleAction("reset")} className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 font-bold py-2 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors uppercase text-[10px] tracking-widest">
                <RotateCcw className="w-3.5 h-3.5" /> Zerar sessão
              </button>
            </div>
            <button onClick={() => {
              void syncVariablesToBackend({ emitImmediate: true });
              window.alert("Pulso instantâneo enviado");
            }} className="w-full bg-surface-container-lowest border border-outline-variant/20 text-outline py-2 flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors uppercase text-[10px] tracking-widest">
              <Zap className="w-3.5 h-3.5" /> Forçar Pulso Instantâneo
            </button>
          </div>
        </div>

        {/* COLUNA DIREITA: TABS DE VISUALIZAÇÃO */}
        <div className="xl:col-span-7 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
          <div className="flex items-center justify-between bg-surface-container-low/60 border border-outline-variant/30 px-3 py-2 shrink-0">
            <div className="flex gap-2">
              {rightTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRightTab(tab.id)}
                  className={`px-3 py-1.5 border text-[10px] uppercase tracking-wider transition-colors ${activeRightTab === tab.id ? "border-primary bg-primary/10 text-primary" : "border-outline-variant/20 bg-surface-container-lowest text-outline hover:text-on-surface"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-outline">
              <span>Step:</span>
              <span className="text-primary font-bold">{selectedStep?.stepOrder ?? 0}</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[15.625rem] relative bg-surface-container-low/40 border border-outline-variant/30 overflow-hidden">
            
            {/* Visualizador oculto para uso em testes Vitest */}
            <div className="hidden" data-testid="mock-visualize">
              <VisualizeDiv
                activeSession={null}
                currentView="dashboard"
                robotData={selectedStep ? ({ ...selectedStep, createdAt: new Date().toISOString() } as unknown as SessionStep) : null}
                steps={sessionSteps ? (sessionSteps.map((step) => ({ ...step, createdAt: new Date().toISOString() })) as unknown as SessionStep[]) : []}
                isSocketConnected={isConnected}
                posX={selectedStep?.posX ?? 0}
                posY={selectedStep?.posY ?? 0}
                connectionProps={{ latency: "0" }}
              />
            </div>

            {/* CONTEÚDO DAS ABAS */}
            {activeRightTab === "map" && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between border-b border-outline-variant/20 px-3 py-2 shrink-0">
                  <div className="text-[10px] text-outline uppercase tracking-wider">Mapa em tempo real</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedStepIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : 0))}
                      disabled={sessionSteps.length === 0 || selectedStepIndex === 0 || selectedStepIndex === null}
                      className="px-2 py-1 border border-outline-variant/20 bg-surface-container-lowest disabled:opacity-30 transition-colors"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setSelectedStepIndex((prev) => (prev !== null && prev < sessionSteps.length - 1 ? prev + 1 : sessionSteps.length - 1))}
                      disabled={sessionSteps.length === 0 || selectedStepIndex === null || selectedStepIndex >= sessionSteps.length - 1}
                      className="px-2 py-1 border border-outline-variant/20 bg-surface-container-lowest disabled:opacity-30 transition-colors"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
                <div className="flex-1 w-full relative">
                  <VisualizeDiv
                    activeSession={null}
                    currentView="dashboard"
                    robotData={selectedStep ? ({ ...selectedStep, createdAt: new Date().toISOString() } as unknown as SessionStep) : null}
                    steps={sessionSteps ? (sessionSteps.map((step) => ({ ...step, createdAt: new Date().toISOString() })) as unknown as SessionStep[]) : []}
                    isSocketConnected={isConnected}
                    posX={selectedStep?.posX ?? 0}
                    posY={selectedStep?.posY ?? 0}
                    connectionProps={{ latency: "0" }}
                  />
                </div>
              </div>
            )}

            {activeRightTab === "payload" && (
              <div className="h-full p-4 overflow-auto bg-black/40 text-[10px] text-emerald-400/90 leading-relaxed custom-scrollbar break-all">
                {!robotData && sessionSteps.length === 0 && !isConnected ? (
                  <div className="text-outline text-center mt-10 italic">Aguardando tráfego...</div>
                ) : (
                  <pre>{JSON.stringify(selectedStep ?? currentStep, null, 2)}</pre>
                )}
              </div>
            )}

            {activeRightTab === "sensors" && (
              <div className="h-full p-6 flex flex-col gap-6 overflow-auto">
                <SensorGrid
                  sensorData={{
                    front: selectedStep?.sensors?.front ?? currentStep.sensors?.front ?? 0,
                    left: selectedStep?.sensors?.left ?? currentStep.sensors?.left ?? 0,
                    right: selectedStep?.sensors?.right ?? currentStep.sensors?.right ?? 0,
                  }}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
                  <BatteryWidget voltage={selectedVoltage} percentage={batteryPercentage} isCritical={selectedVoltage < 10.5} />
                  <EngineTelemetryWidget velocity={0} />
                </div>
              </div>
            )}

            {activeRightTab === "steps" && (
              <div className="h-full p-4 overflow-auto custom-scrollbar">
                <div className="flex flex-col gap-2">
                  {sessionSteps.length === 0 ? (
                    <div className="p-3 border border-outline-variant/20 bg-surface-container-lowest text-outline text-center italic mt-10">Nenhum step registrado ainda.</div>
                  ) : (
                    sessionSteps.map((step, index) => (
                      <button
                        key={`${step.id}-${index}`}
                        onClick={() => setSelectedStepIndex(index)}
                        className={`text-left border px-3 py-2 transition-colors ${selectedStepIndex === index ? "border-primary bg-primary/10 text-primary" : "border-outline-variant/20 bg-surface-container-lowest text-on-surface hover:border-primary/40"}`}
                      >
                        <div className="flex justify-between">
                          <span className="font-bold">Step {step.stepOrder}</span>
                          <span className="text-[9px] text-outline bg-black/20 px-2 rounded-full">({step.posX},{step.posY})</span>
                        </div>
                        <div className="text-[10px] text-outline mt-1">
                          V: {step.voltage?.toFixed(1)}V &bull; F: {step.sensors?.front ?? 0}cm
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