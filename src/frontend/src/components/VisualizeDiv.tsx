import { useState, useEffect, useMemo } from "react";
import { Database, ComponentIcon, ComputerIcon, Unlink, Play } from "lucide-react";
import { MazeGrid } from "./MazeGrid";
import type { SessionStep } from "../types/session";
import { rotacaoDoRoboAoVivo } from "../utils/sensorRaycast";

interface VisualizeDivProps {
  activeSession: any; // Mantendo a tipagem flexível do seu projeto original
  currentView: string;
  connectionProps: { latency: string };
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

  const mazeWidth = Math.max(activeSession?.maze?.width ?? 16, 16);
  const mazeHeight = Math.max(activeSession?.maze?.height ?? 16, 16);

  const resolvedSteps = steps ?? liveSteps;

  // OFFSETS FORAM REMOVIDOS. A coordenada é absoluta.
  const safePosX = clampCoord(posX, mazeWidth - 1);
  const safePosY = clampCoord(posY, mazeHeight - 1);

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

  const discoveredCells = useMemo(() => {
    const map = new Map();
    (activeSession?.maze?.cells ?? []).forEach((c: any) => {
      map.set(`${c.posX},${c.posY}`, c);
    });

    liveWallSources.forEach((step: any) => {
      const key = `${step.posX},${step.posY}`;
      const existing = map.get(key) || { posX: step.posX, posY: step.posY };
      
      map.set(key, {
        ...existing,
        wallNorth: existing.wallNorth || step.walls?.north || step.wallNorth || false,
        wallSouth: existing.wallSouth || step.walls?.south || step.wallSouth || false,
        wallEast: existing.wallEast || step.walls?.east || step.wallEast || false,
        wallWest: existing.wallWest || step.walls?.west || step.wallWest || false,
      });
    });

    return Array.from(map.values());
  }, [activeSession?.maze?.cells, liveWallSources]);

  const robotRotation = useMemo(() => {
    const trail = resolvedSteps.map((step) => ({
      posX: step.posX,
      posY: step.posY,
    }));
    const direcao = (robotData as { direcao?: string } | null | undefined)?.direcao;
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
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col h-full w-full relative overflow-hidden min-h-0">
            <div className="text-[10px] justify-between font-mono text-outline uppercase tracking-widest flex items-center gap-2 w-full mb-2 shrink-0">
              <span className="flex items-center gap-1">Mapeamento do labirinto ao vivo</span>
              <span data-testid="maze-coords" className="text-[9px] px-2 py-0.5 border border-outline-variant/30 font-mono tracking-wider text-on-surface bg-surface-container-lowest">
                COORDS: X-{safePosX}, Y-{safePosY}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center flex-1 w-full min-h-0 overflow-hidden">
              <div className="w-full flex-1 flex justify-center items-center min-h-0 max-h-[calc(100vh-290px)]">
                <MazeGrid
                  cells={discoveredCells}
                  steps={resolvedSteps}
                  currentX={safePosX}
                  currentY={safePosY}
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
         return <div>{/* Conteúdo network mantido como estava */}</div>;
    }
  };

  return <div className="flex flex-col h-full w-full min-h-0">{renderContentView()}</div>;
}