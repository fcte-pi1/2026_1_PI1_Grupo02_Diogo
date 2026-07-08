import { useState, useEffect, useMemo } from "react";
import { Database, ComponentIcon, ComputerIcon, Unlink, Play } from "lucide-react";
import { MazeGrid } from "./MazeGrid";
import type { SessionStep } from "../types/session";
import { computeMazeOffset } from "../utils/maze-translation";
import { mergeLiveMazeCells } from "../utils/mergeLiveMazeCells";
import { rotacaoDoRoboAoVivo } from "../utils/sensorRaycast";

interface VisualizeDivProps {
  activeSession: {
    id?: string;
    sessionName: string;
    algorithm: string;
    mode: string;
    maze?: {
      name: string;
      width: number;
      height: number;
      cells: Array<{
        id: string;
        mazeId: string;
        posX: number;
        posY: number;
        wallNorth: boolean;
        wallSouth: boolean;
        wallEast: boolean;
        wallWest: boolean;
      }>;
    };
  } | null;
  currentView: string;
  connectionProps: {
    latency: string;
  };
  isConnected?: boolean;
  isSocketConnected?: boolean;
  robotData?: SessionStep | null;
  steps?: SessionStep[];
  posX: number;
  posY: number;
}

function clampCoord(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.floor(value)));
}

export function VisualizeDiv({
  activeSession,
  currentView,
  isConnected,
  isSocketConnected,
  robotData,
  steps,
  posX,
  posY,
  connectionProps,
}: VisualizeDivProps) {
  const socketConnected = isSocketConnected ?? isConnected ?? false;
  const [liveSteps, setLiveSteps] = useState<SessionStep[]>([]);

  const mazeWidth = activeSession?.maze?.width ?? 8;
  const mazeHeight = activeSession?.maze?.height ?? 8;

  const resolvedSteps = steps ?? liveSteps;

  // Mesma translação aplicada pelo MazeGrid, para o badge de coordenadas
  // acompanhar a matriz deslocada quando o robô não parte de (0,0)
  const { offsetX, offsetY } = computeMazeOffset(resolvedSteps, posX, posY);
  const safePosX = clampCoord(posX + offsetX, mazeWidth - 1);
  const safePosY = clampCoord(posY + offsetY, mazeHeight - 1);

  // Paredes do DB (se houver) + descobertas ao vivo em cada telemetry:step
  const liveWallSources = useMemo(() => {
    const sources = [...resolvedSteps];
    if (
      robotData &&
      !sources.some((step) => step.stepOrder === robotData.stepOrder)
    ) {
      sources.push(robotData);
    }
    return sources;
  }, [resolvedSteps, robotData]);

  const discoveredCells = useMemo(
    () =>
      mergeLiveMazeCells(activeSession?.maze?.cells ?? [], liveWallSources),
    [activeSession?.maze?.cells, liveWallSources],
  );

  const robotRotation = useMemo(() => {
    const trail = resolvedSteps.map((step) => ({
      posX: step.posX,
      posY: step.posY,
    }));
    const direcao = (robotData as { direcao?: string } | null | undefined)
      ?.direcao;
    return rotacaoDoRoboAoVivo(trail, direcao);
  }, [resolvedSteps, robotData]);

  useEffect(() => {
    if (steps !== undefined) return;
    if (socketConnected && robotData) {
      setLiveSteps((prevSteps) => {
        const stepExists = prevSteps.some((s) => s.stepOrder === robotData.stepOrder);
        if (stepExists) return prevSteps;
        return [...prevSteps, robotData];
      });
    }
  }, [robotData, socketConnected, steps]);

  useEffect(() => {
    if (steps !== undefined) return;
    if (!socketConnected) {
      setLiveSteps([]);
    }
  }, [socketConnected, steps]);

  const renderContentView = () => {
    switch (currentView) {
      case "dashboard":
        if (!socketConnected && resolvedSteps.length === 0) {
          return (
            <div className="bg-surface-container-low/60 border border-outline-variant/30 p-6 flex flex-col h-full min-h-[300px] w-full relative justify-center items-center text-center font-mono min-h-0">
              <div className="p-4 rounded-full border border-primary/20 bg-primary/5 text-primary/40 mb-4 animate-pulse">
                <Play className="w-8 h-8 translate-x-[2px]" />
              </div>
              <h3 className="text-sm font-bold text-primary tracking-wider uppercase mb-1">
                Aguardando Inicialização
              </h3>
              <p className="text-[11px] text-outline max-w-xs">
                Nenhuma corrida ativa detectada no cockpit. Ligue o robô MicroMouse para iniciar o fluxo de mapeamento em tempo real.
              </p>
            </div>
          );
        }

        return (
          // 🚀 ALTERADO: Removido min-h fixo de escape, focado em flex completo com min-h-0
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col h-full w-full relative overflow-hidden min-h-0">
            <div className="text-[10px] justify-between font-mono text-outline uppercase tracking-widest flex items-center gap-2 w-full mb-2 shrink-0">
              <span className="flex items-center gap-1">Mapeamento do labirinto ao vivo</span>
              <span data-testid="maze-coords" className="text-[9px] px-2 py-0.5 border border-outline-variant/30 font-mono tracking-wider text-on-surface bg-surface-container-lowest">
                COORDS: X-{safePosX}, Y-{safePosY}
              </span>
            </div>

            {/* Miolo do Labirinto Reativo */}
            <div className="flex flex-col items-center justify-center flex-1 w-full min-h-0 overflow-hidden">
              <div className="w-full flex-1 flex justify-center items-center min-h-0 max-h-[calc(100vh-290px)]">
                <MazeGrid
                  cells={discoveredCells}
                  steps={resolvedSteps}
                  currentX={posX}
                  currentY={posY}
                  width={mazeWidth}
                  height={mazeHeight}
                  robotRotation={robotRotation}
                />
              </div>

              <div className="font-mono text-[10px] text-center text-primary uppercase tracking-wider mt-2 shrink-0">
                [ LABIRINTO: {activeSession?.maze?.name || "CONECTADO"} - ALGORITMO: {activeSession?.algorithm || "PROCESSANDO"} ]
              </div>
            </div>
          </div>
        );

      case "network":
      default:
        return (
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-6 flex flex-col h-full min-h-[300px] w-full relative justify-between min-h-0">
            <div className="text-[10px] justify-between font-mono text-outline uppercase tracking-widest flex items-center gap-2 w-full mb-6 shrink-0">
              <span className="flex items-center gap-1">Topologia rede ativa</span>
              {socketConnected ? (
                <span className="text-[9px] px-2 py-0.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono tracking-wider uppercase">online</span>
              ) : (
                <span className="text-[9px] px-2 py-0.5 border border-red-500/30 bg-red-500/10 text-red-400 font-mono tracking-wider uppercase flex items-center gap-1">
                  <Unlink className="w-2.5 h-2.5" /> offline
                </span>
              )}
            </div>

            <div className={`flex items-center gap-4 md:gap-8 w-full justify-center flex-1 transition-opacity duration-300 min-h-0 ${socketConnected ? "opacity-100" : "opacity-40"}`}>
              <div className="flex flex-col items-center text-center font-mono">
                <div className={`p-4 border mb-2 transition-colors ${socketConnected ? "border-cyan-500/30 bg-cyan-950/10 text-cyan-400" : "border-outline-variant/20 bg-surface-container-low text-outline/50"}`}>
                  <span className="text-xl"><ComputerIcon /></span>
                </div>
                <span className={`text-[11px] font-bold tracking-wider ${socketConnected ? "text-primary" : "text-outline"}`}>OPERATOR_STATION</span>
                <span className="text-[9px] text-outline">{socketConnected ? "192.168.1.1" : "---.---.-.-"}</span>
              </div>

              <div className="h-[1px] bg-outline-variant/40 flex-1 max-w-[60px]"></div>

              <div className="flex flex-col items-center text-center font-mono relative">
                {socketConnected && <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>}
                <div className={`p-4 border mb-2 transition-all ${socketConnected ? "border-emerald-500 bg-emerald-950/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "border-outline-variant/20 bg-surface-container-low text-outline/50"}`}>
                  <span className="text-xl"><ComponentIcon /></span>
                </div>
                <span className={`text-[11px] font-bold tracking-wider ${socketConnected ? "text-emerald-400" : "text-outline"}`}>UAV-MOUSE-01</span>
                <span className="text-[9px] text-outline">RSSI: {socketConnected ? `-${connectionProps?.latency ?? "0"}dBm` : "---"}</span>
              </div>

              <div className="h-[1px] bg-outline-variant/40 flex-1 max-w-[60px]"></div>

              <div className="flex flex-col items-center text-center font-mono">
                <div className={`p-4 border mb-2 transition-colors ${socketConnected ? "border-outline-variant/40 bg-surface-container-low text-on-surface" : "border-outline-variant/20 bg-surface-container-low text-outline/50"}`}>
                  <span className="text-xl"><Database /></span>
                </div>
                <span className="text-[11px] font-bold text-on-surface-variant tracking-wider">BANCO_DE_DADOS</span>
                <span className="text-[9px] text-outline">{socketConnected ? "SINCRONIA ATIVA" : "DESCONECTADO"}</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      {renderContentView()}
    </div>
  );
}