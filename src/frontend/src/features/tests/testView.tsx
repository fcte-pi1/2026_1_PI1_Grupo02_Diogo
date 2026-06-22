import { useState, useEffect } from "react";
import { Play, Zap, BatteryCharging, Pause, RotateCcw, Sliders, ShieldAlert, Terminal } from "lucide-react";
import type { SessionStep } from "../../types/session";
import { VisualizeDiv } from "../../components/VisualizeDiv";
import SensorGrid from "../telemetry/components/SensorGrid";
import type { TelemetryData } from "../../hooks/useWebSocket";

interface TestViewProps {
  robotData: TelemetryData | null;
  sessionSteps: TelemetryData[];
  isConnected: boolean;
}

export default function TestView({ robotData, sessionSteps, isConnected }: TestViewProps) {
  const [status, setStatus] = useState({ running: false, paused: false, stepOrder: 0 });
  const [voltage, setVoltage] = useState(12.1);
  const [current] = useState(240);
  const [sensorFront, setSensorFront] = useState(25);
  const [sensorLeft, setSensorLeft] = useState(25);
  const [sensorRight, setSensorRight] = useState(25);
  const [walls, setWalls] = useState({ north: false, south: false, east: false, west: false });
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  // Fallbacks de segurança
  const currentStep = robotData || {
    stepOrder: 0, posX: 0, posY: 0, voltage: 0, current: 0,
    sensors: { front: 0, left: 0, right: 0 },
    walls: { north: false, south: false, east: false, west: false },
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://127.0.0.1:3000/api/telemetry/simulator/status");
      if (res.ok) {
        const data = await res.json();
        setStatus({ running: data.running, paused: data.paused, stepOrder: data.stepOrder });
      }
    } catch (err) {
      console.error("Erro ao buscar status do simulador:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2500);
    return () => clearInterval(interval);
  }, []);

  const syncVariablesToBackend = async (overrides = {}) => {
    const payload = {
      voltage, current, sensorFront, sensorLeft, sensorRight,
      wallNorth: walls.north, wallSouth: walls.south, wallEast: walls.east, wallWest: walls.west,
      posX, posY, ...overrides
    };

    try {
      await fetch("http://127.0.0.1:3000/api/telemetry/simulator/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Falha ao sincronizar variáveis reativas:", err);
    }
  };

  const handleAction = async (action: "start" | "pause" | "stop") => {
    try {
      const response = await fetch("http://127.0.0.1:3000/api/telemetry/simulator", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
      });
      if (response.ok) {
        if (action === "start") setStatus(prev => ({ ...prev, running: true, paused: false }));
        else if (action === "pause") setStatus(prev => ({ ...prev, paused: true }));
        else if (action === "stop") setStatus({ running: false, paused: false, stepOrder: 0 });
      }
    } catch (err) {
      console.error("Erro ao processar ação:", err);
    }
  };

  return (
    <div className="w-full h-full p-6 flex flex-col gap-4 font-mono text-xs overflow-hidden box-border">
      {/* GRID PRINCIPAL SPLIT-SCREEN */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-0 overflow-hidden">
        <div className="xl:col-span-5 flex flex-col gap-4 h-full overflow-y-auto pr-2 custom-scrollbar">
          
          {/* CONTROLE DE FLUXO */}
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col gap-3 shrink-0">
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
              <span className="text-outline uppercase tracking-wider text-[10px]">LOOP DE REPRODUÇÃO:</span>
              <span className={`font-bold tracking-widest px-2 py-0.5 border text-[10px] ${status.running && !status.paused ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 animate-pulse" : status.paused ? "text-amber-400 border-amber-500/30 bg-amber-500/5" : "text-red-400 border-red-500/30 bg-red-500/5"}`}>
                {status.running && !status.paused ? "● EXECUTANDO" : status.paused ? "⏸ PAUSADO" : "○ PARADO"}
              </span>
            </div>
            <div className="flex gap-2 w-full">
              <button onClick={() => handleAction("start")} className="flex-1 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 py-2 font-bold flex items-center justify-center gap-1.5 transition-colors">
                <Play className="w-3 h-3" /> Start
              </button>
              <button onClick={() => handleAction("pause")} disabled={!status.running || status.paused} className="flex-1 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 py-2 font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30">
                <Pause className="w-3 h-3" /> Pause
              </button>
              <button onClick={() => handleAction("stop")} disabled={!status.running && !status.paused} className="flex-1 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 py-2 font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30">
                <RotateCcw className="w-3 h-3" /> Stop
              </button>
            </div>
          </div>

          {/* COORDENADAS E ENERGIA */}
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col gap-3 shrink-0">
            <h2 className="text-label-caps font-bold text-on-surface-variant uppercase border-b border-outline-variant/10 pb-1.5 flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-primary" /> Energia & Posição
            </h2>
            <div className="flex gap-2 text-center">
              <div className="flex-1 bg-surface-container-lowest border border-outline-variant/10 p-2">
                <span className="text-[9px] text-outline block mb-1">COORD_X (0-7)</span>
                <input type="number" min="0" max="7" value={posX} onChange={(e) => { const x = Math.min(7, Math.max(0, Number(e.target.value))); setPosX(x); syncVariablesToBackend({ posX: x }); }} className="w-full bg-surface-container-low border border-outline-variant/30 p-1 text-center text-on-surface focus:border-primary focus:outline-none transition-colors"/>
              </div>
              <div className="flex-1 bg-surface-container-lowest border border-outline-variant/10 p-2">
                <span className="text-[9px] text-outline block mb-1">COORD_Y (0-7)</span>
                <input type="number" min="0" max="7" value={posY} onChange={(e) => { const y = Math.min(7, Math.max(0, Number(e.target.value))); setPosY(y); syncVariablesToBackend({ posY: y }); }} className="w-full bg-surface-container-low border border-outline-variant/30 p-1 text-center text-on-surface focus:border-primary focus:outline-none transition-colors"/>
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/10 p-2">
              <div className="flex justify-between mb-1 text-[9px] text-outline"><span>VOLTAGE:</span><span className="text-primary">{voltage}V</span></div>
              <input type="range" min="9.6" max="12.6" step="0.1" value={voltage} onChange={(e) => { const v = Number(e.target.value); setVoltage(v); syncVariablesToBackend({ voltage: v }); }} className="w-full accent-primary cursor-pointer h-1"/>
            </div>
          </div>

          {/* SENSORES */}
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col gap-3 shrink-0">
            <h2 className="text-label-caps font-bold text-on-surface-variant uppercase border-b border-outline-variant/10 pb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-primary" /> Distâncias
            </h2>
            <div className="bg-surface-container-lowest border border-outline-variant/10 p-2">
              <div className="flex justify-between mb-1 text-[9px] text-outline"><span>FRONT:</span><span className="text-primary">{sensorFront}cm</span></div>
              <input type="range" min="3" max="40" value={sensorFront} onChange={(e) => { const sf = Number(e.target.value); setSensorFront(sf); syncVariablesToBackend({ sensorFront: sf }); }} className="w-full accent-primary h-1"/>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-surface-container-lowest border border-outline-variant/10 p-2">
                <div className="flex justify-between mb-1 text-[9px] text-outline"><span>LEFT:</span><span className="text-primary">{sensorLeft}cm</span></div>
                <input type="range" min="3" max="40" value={sensorLeft} onChange={(e) => { const sl = Number(e.target.value); setSensorLeft(sl); syncVariablesToBackend({ sensorLeft: sl }); }} className="w-full accent-primary h-1"/>
              </div>
              <div className="flex-1 bg-surface-container-lowest border border-outline-variant/10 p-2">
                <div className="flex justify-between mb-1 text-[9px] text-outline"><span>RIGHT:</span><span className="text-primary">{sensorRight}cm</span></div>
                <input type="range" min="3" max="40" value={sensorRight} onChange={(e) => { const sr = Number(e.target.value); setSensorRight(sr); syncVariablesToBackend({ sensorRight: sr }); }} className="w-full accent-primary h-1"/>
              </div>
            </div>
          </div>

          {/* PAREDES E GATILHO */}
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col gap-4 shrink-0">
            <div>
              <h2 className="text-label-caps font-bold text-on-surface-variant uppercase border-b border-outline-variant/10 pb-1.5 flex items-center gap-1.5 mb-3">
                <ShieldAlert className="w-3.5 h-3.5 text-primary" /> Barreiras Físicas
              </h2>
              <div className="grid grid-cols-2 gap-3 bg-surface-container-lowest p-3 border border-outline-variant/10">
                <label className="flex items-center gap-2 text-outline text-[10px] cursor-pointer hover:text-on-surface"><input type="checkbox" checked={walls.north} onChange={(e) => { const w = { ...walls, north: e.target.checked }; setWalls(w); syncVariablesToBackend({ wallNorth: w.north }); }} className="accent-primary"/> WALL_NORTH</label>
                <label className="flex items-center gap-2 text-outline text-[10px] cursor-pointer hover:text-on-surface"><input type="checkbox" checked={walls.south} onChange={(e) => { const w = { ...walls, south: e.target.checked }; setWalls(w); syncVariablesToBackend({ wallSouth: w.south }); }} className="accent-primary"/> WALL_SOUTH</label>
                <label className="flex items-center gap-2 text-outline text-[10px] cursor-pointer hover:text-on-surface"><input type="checkbox" checked={walls.east} onChange={(e) => { const w = { ...walls, east: e.target.checked }; setWalls(w); syncVariablesToBackend({ wallEast: w.east }); }} className="accent-primary"/> WALL_EAST</label>
                <label className="flex items-center gap-2 text-outline text-[10px] cursor-pointer hover:text-on-surface"><input type="checkbox" checked={walls.west} onChange={(e) => { const w = { ...walls, west: e.target.checked }; setWalls(w); syncVariablesToBackend({ wallWest: w.west }); }} className="accent-primary"/> WALL_WEST</label>
              </div>
            </div>
            <button onClick={async () => { await syncVariablesToBackend(); alert("Pulso forçado com sucesso!"); }} className="w-full bg-primary/10 border border-primary text-primary font-bold py-2 flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors uppercase text-[10px] tracking-widest">
              <Zap className="w-3.5 h-3.5" /> Forçar Pulso Instantâneo
            </button>
          </div>

        </div>

        {/* espelho de telemetria... */}
        <div className="xl:col-span-7 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
          
          {/* MAPA EM TEMPO REAL */}
          <div className="flex-1 min-h-\[250px] relative">
            <VisualizeDiv
              activeSession={null} 
              currentView="dashboard" 
              robotData={robotData ? ({ ...robotData, createdAt: new Date().toISOString() } as unknown as SessionStep) : null} // 🚀 FIXADO
              steps={sessionSteps ? (sessionSteps.map(step => ({ ...step, createdAt: new Date().toISOString() })) as unknown as SessionStep[]) : []} // 🚀 FIXADO
              isSocketConnected={isConnected}
              posX={robotData?.posX ?? 0}
              posY={robotData?.posY ?? 0}
              connectionProps={{ latency: "0" }}
            />
          </div>

          {/* SPLIT INFERIOR: SENSORES E RAW JSON */}
          <div className="h-48 shrink-0 flex gap-4">
            
            <div className="flex-1 min-w-0">
              <SensorGrid 
                sensorData={{
                  front: currentStep.sensors?.front ?? 0,
                  left: currentStep.sensors?.left ?? 0,
                  right: currentStep.sensors?.right ?? 0
                }} 
              />
            </div>

            <div className="flex-1 bg-surface-container-low/60 border border-outline-variant/30 flex flex-col min-w-0">
              <div className="border-b border-outline-variant/20 p-2 shrink-0 bg-surface-container-lowest">
                <h2 className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase flex items-center gap-2">
                  <Terminal className="w-3 h-3 text-primary" /> Payload RAW
                </h2>
              </div>
              <div className="flex-1 p-2 overflow-auto bg-black/40 text-[10px] text-emerald-400/90 leading-relaxed custom-scrollbar break-all">
                {robotData ? (
                  <pre>{JSON.stringify(robotData, null, 2)}</pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-outline/40 italic">
                    Aguardando tráfego...
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}