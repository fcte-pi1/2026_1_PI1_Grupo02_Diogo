import { memo, useMemo } from "react";
import type { MazeCell } from "../types/session";
import { computeMazeOffset } from "../utils/maze-translation";

const DEFAULT_GRID_SIZE = 8;

// Curva de intensidade da trilha: 1 visita ~0.20, 2 visitas ~0.40, 3+ visitas capado em 0.60
const VISIT_ALPHA_CAP = 0.6;
const VISIT_ALPHA_MIN = 0.15;

function clampCoord(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.floor(value)));
}

interface MazeGridStep {
  posX: number;
  posY: number;
}

interface MazeGridProps {
  cells?: MazeCell[];
  steps: MazeGridStep[];
  currentX: number;
  currentY: number;
  width?: number;
  height?: number;
  ariaLabel?: string;
}

export const MazeGrid = memo(function MazeGrid({
  cells = [],
  steps = [],
  currentX,
  currentY,
  width = DEFAULT_GRID_SIZE,
  height = DEFAULT_GRID_SIZE,
  ariaLabel = "Mapeamento do labirinto",
}: MazeGridProps) {
  // Translação da matriz (issue #217): o robô se considera em (0,0) na largada,
  // então coordenadas negativas deslocam o quadro inteiro antes do clamp
  const { offsetX, offsetY } = useMemo(
    () => computeMazeOffset(steps, currentX, currentY),
    [steps, currentX, currentY]
  );

  const safeX = clampCoord(currentX + offsetX, width - 1);
  const safeY = clampCoord(currentY + offsetY, height - 1);

  const cellWallsMap = useMemo(() => {
    const map = new Map<string, MazeCell>();
    cells.forEach((cell) => {
      map.set(`${cell.posX},${cell.posY}`, cell);
    });
    return map;
  }, [cells]);

  // Passos consecutivos na mesma célula (robô parado emitindo telemetria) contam
  // como uma única visita; só reentradas incrementam a contagem
  const visitCounts = useMemo(() => {
    const counts = new Map<string, number>();
    let previousKey: string | null = null;
    steps.forEach((step) => {
      const x = clampCoord(step.posX + offsetX, width - 1);
      const y = clampCoord(step.posY + offsetY, height - 1);
      const key = `${x},${y}`;
      if (key !== previousKey) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      previousKey = key;
    });
    return counts;
  }, [steps, width, height, offsetX, offsetY]);

  const maxVisitCount = useMemo(() => {
    let max = 0;
    visitCounts.forEach((count) => {
      if (count > max) max = count;
    });
    return max;
  }, [visitCounts]);

  const totalCells = width * height;
  const cellsArray = Array.from({ length: totalCells }, (_, index) => {
    const rowIndex = Math.floor(index / width);
    const colIndex = index % width;

    // Origem cartesiana no canto inferior esquerdo (mesma convenção do mapa ao vivo)
    const y = height - 1 - rowIndex;
    const x = colIndex;
    const key = `${x},${y}`;

    const cellData = cellWallsMap.get(key);

    const isRobot = safeX === x && safeY === y;
    const visitCount = visitCounts.get(key) ?? 0;
    const isVisited = visitCount > 0 && !isRobot;

    const hasNorth = cellData?.wallNorth ?? false;
    const hasSouth = cellData?.wallSouth ?? false;
    const hasEast = cellData?.wallEast ?? false;
    const hasWest = cellData?.wallWest ?? false;

    const visitAlpha = isVisited
      ? Math.max(
          VISIT_ALPHA_MIN,
          (visitCount / Math.max(3, maxVisitCount)) * VISIT_ALPHA_CAP
        )
      : 0;

    return (
      <div
        key={key}
        data-testid={isRobot ? "maze-robot-cell" : undefined}
        data-visits={isVisited ? visitCount : undefined}
        data-wall-north={hasNorth || undefined}
        data-wall-south={hasSouth || undefined}
        data-wall-east={hasEast || undefined}
        data-wall-west={hasWest || undefined}
        className={`
          w-full h-full transition-all duration-150 box-border
          ${hasNorth ? "border-t-[3px] border-t-red-500" : "border-t border-t-outline-variant/10"}
          ${hasSouth ? "border-b-[3px] border-b-red-500" : "border-b border-b-outline-variant/10"}
          ${hasEast ? "border-r-[3px] border-r-red-500" : "border-r border-r-outline-variant/10"}
          ${hasWest ? "border-l-[3px] border-l-red-500" : "border-l border-l-outline-variant/10"}
          ${isRobot ? "bg-primary shadow-[0_0_10px] shadow-primary/50 scale-110 z-10 animate-pulse" : ""}
        `}
        style={
          isVisited
            ? {
                // Tinge apenas o fundo, mantendo as paredes com opacidade total
                backgroundColor: `color-mix(in srgb, var(--color-primary) ${Math.round(visitAlpha * 100)}%, transparent)`,
              }
            : undefined
        }
        title={isRobot ? `Robô em (${x}, ${y})` : `Coords: (${x}, ${y})`}
      />
    );
  });

  return (
    <div
      data-testid="maze-grid"
      data-offset-x={offsetX}
      data-offset-y={offsetY}
      className="grid gap-0 bg-surface-container-lowest border border-outline-variant/50 p-2 shadow-inner w-fit h-full aspect-square mx-auto"
      style={{
        gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
      }}
      aria-label={ariaLabel}
    >
      {cellsArray}
    </div>
  );
});
