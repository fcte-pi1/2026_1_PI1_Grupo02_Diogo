import { useState, useEffect } from "react";
import { VisualizeDiv } from "../../components/VisualizeDiv";
import type { SessionStep } from "../../types/session";
import {
  Wifi,
  WifiOff,
  HeartPulse,
  ShieldCheck,
  AlertTriangle,
  Terminal,
  Server,
} from "lucide-react";
import { useWebSocket, TelemetryData } from "../../hooks/useWebSocket";

interface ConnectViewProps {
  currentView: string;
  connectionProps: {
    latency: string;
  } | null;
  isConnected: boolean;
}

interface HealthStatus {
  api: "ok" | "error" | "loading";
  database: "ok" | "error" | "loading";
  broker: "ok" | "error" | "loading";
}

export default function ConnectView({
  currentView,
  connectionProps,
  isConnected,
}: ConnectViewProps) {
  const currentLatency = isConnected ? 42 : 99;
  const { robotData } = useWebSocket();

  const [servicesHealth, setServicesHealth] = useState<HealthStatus>({
    api: "loading",
    database: "loading",
    broker: "loading",
  });

  const [inspectData, setInspectData] = useState<unknown>(null);
  const [inspectTarget, setInspectTarget] = useState<
    "none" | "health" | "telemetry"
  >("none");

  const x = robotData?.posX ?? 0;
  const y = robotData?.posY ?? 0;

  const checkInfrastructureHealth = async () => {
    try {
      const response = await fetch("http://127.0.0.1:3000/api/health");
      if (response.ok) {
        const data = await response.json();
        setServicesHealth({
          api: data.status === "ok" ? "ok" : "error",
          database: isConnected ? "ok" : "error",
          broker: isConnected ? "ok" : "error",
        });
        if (inspectTarget === "health") setInspectData(data);
      } else {
        throw new Error();
      }
    } catch {
      setServicesHealth({ api: "error", database: "error", broker: "error" });
    }
  };

  useEffect(() => {
    checkInfrastructureHealth();
    const interval = setInterval(checkInfrastructureHealth, 10000);
    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    if (inspectTarget === "telemetry" && robotData) {
      setInspectData(robotData);
    }
  }, [robotData, inspectTarget]);

  const handleInspect = async (target: "health" | "telemetry") => {
    setInspectTarget(target);
    if (target === "telemetry") {
      setInspectData(
        robotData ?? { message: "Aguardando primeiro pacote via WebSocket..." },
      );
    } else {
      setInspectData({ message: "Buscando dados da rota /api/health..." });
      await checkInfrastructureHealth();
    }
  };

  return (
    <main className="w-full h-full p-6 flex flex-col gap-4 overflow-hidden bg-background select-none">
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 overflow-y-auto">
        <div className="flex flex-col h-full min-h-0">
          <VisualizeDiv
            activeSession={null}
            currentView={currentView}
            connectionProps={
              connectionProps ?? { latency: String(currentLatency) }
            }
            isConnected={isConnected}
            robotData={
              robotData
                ? ({
                    ...robotData,
                    createdAt: new Date().toISOString(),
                  } as unknown as SessionStep) // 🚀 CORREÇÃO: Forçado para o tipo esperado pelo componente (SessionStep)
                : null
            }
            posX={x}
            posY={y}
          />
        </div>

        <div className="flex flex-col gap-4 font-mono h-full min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
            <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col justify-between">
              <div className="border-b border-outline-variant/20 mb-2">
                <h2 className="text-label-caps text-xs mb-2 font-bold text-on-surface-variant tracking-widest uppercase flex items-center gap-2">
                  {isConnected ? (
                    <Wifi
                      className="w-3.5 h-3.5 text-primary"
                      strokeWidth={2}
                    />
                  ) : (
                    <WifiOff
                      className="w-3.5 h-3.5 text-red-400"
                      strokeWidth={2}
                    />
                  )}
                  RSSI Uplink
                </h2>
              </div>
              <div className="flex items-end gap-1.5 h-10 mb-2 opacity-90">
                <div
                  className={`w-full h-4 ${isConnected ? "bg-emerald-500" : "bg-surface-variant/20"}`}
                />
                <div
                  className={`w-full h-6 ${isConnected ? "bg-emerald-500" : "bg-surface-variant/20"}`}
                />
                <div
                  className={`w-full h-8 ${isConnected ? "bg-emerald-500" : "bg-surface-variant/20"}`}
                />
                <div
                  className={`w-full h-10 ${isConnected ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.2)]" : "bg-surface-variant/20"}`}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                <span
                  className={
                    isConnected
                      ? "text-emerald-400 animate-pulse"
                      : "text-red-400"
                  }
                >
                  {isConnected ? "STRONG_LINK" : "OFFLINE"}
                </span>
                <span className="text-outline">-{currentLatency} dBm</span>
              </div>
            </div>

            <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col justify-between">
              <div className="border-b border-outline-variant/20 mb-2">
                <h2 className="text-label-caps text-xs mb-2 font-bold text-on-surface-variant tracking-widest uppercase flex items-center gap-2">
                  <HeartPulse
                    className="w-3.5 h-3.5 text-primary"
                    strokeWidth={2}
                  />
                  Stack Status
                </h2>
              </div>
              <div className="flex flex-col gap-1 text-[10px]">
                <div className="flex justify-between p-1 bg-black/10 border border-outline-variant/10">
                  <span className="text-outline">REST_API:</span>
                  <span
                    className={`font-bold flex items-center gap-1 ${servicesHealth.api === "ok" ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {servicesHealth.api === "ok" ? (
                      <ShieldCheck className="w-3 h-3" />
                    ) : (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    {servicesHealth.api.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between p-1 bg-black/10 border border-outline-variant/10">
                  <span className="text-outline">POSTGRES:</span>
                  <span
                    className={`font-bold flex items-center gap-1 ${servicesHealth.database === "ok" ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {servicesHealth.database === "ok" ? (
                      <ShieldCheck className="w-3 h-3" />
                    ) : (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    {servicesHealth.database.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex-1 flex flex-col min-h-0">
            <div className="border-b border-outline-variant/20 pb-2 mb-3 flex justify-between items-center shrink-0">
              <h2 className="text-label-caps text-xs font-bold text-on-surface-variant tracking-widest uppercase flex items-center gap-2">
                <Terminal
                  className="w-3.5 h-3.5 text-primary"
                  strokeWidth={2}
                />
                Inspetor de Tráfego de Rotas
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleInspect("health")}
                  className={`text-[9px] px-2 py-0.5 border cursor-pointer transition-all ${inspectTarget === "health" ? "bg-primary border-primary text-on-primary font-bold" : "border-outline-variant text-outline hover:text-on-surface"}`}
                >
                  GET /health
                </button>
                <button
                  onClick={() => handleInspect("telemetry")}
                  className={`text-[9px] px-2 py-0.5 border cursor-pointer transition-all ${inspectTarget === "telemetry" ? "bg-primary border-primary text-on-primary font-bold" : "border-outline-variant text-outline hover:text-on-surface"}`}
                >
                  WS /telemetry
                </button>
              </div>
            </div>

            <div className="flex-1 bg-surface-container-lowest/80 border border-outline-variant/20 p-3 overflow-auto text-[11px] text-neutral-300 font-mono rounded-none">
              {inspectTarget === "none" ? (
                <div className="h-full flex flex-col justify-center items-center text-center text-outline/40 italic py-8">
                  <Server className="w-6 h-6 mb-2 stroke-[1.5]" />
                  <span>
                    Selecione uma rota acima para analisar o payload bruto
                    trafegado na stack
                  </span>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-all leading-relaxed text-emerald-400/90">
                  {JSON.stringify(inspectData, null, 2)}
                </pre>
              )}
            </div>
          </div>

          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 shrink-0 flex flex-col gap-3">
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-outline uppercase tracking-wider">
                  Barramento Interno Estável (Power Array)
                </span>
                <span
                  className={
                    isConnected ? "text-emerald-400 font-bold" : "text-outline"
                  }
                >
                  {isConnected ? "92%" : "0%"}
                </span>
              </div>
              <div className="w-full h-1 bg-surface-container-high/40 border border-outline-variant/5">
                <div
                  className={`h-full transition-all duration-500 ${isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-transparent"}`}
                  style={{ width: isConnected ? "92%" : "0%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
