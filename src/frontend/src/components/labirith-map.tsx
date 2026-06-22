import { memo, useMemo } from "react";
import type { SessionStep } from "../types/session";

const DEFAULT_GRID_SIZE = 8;

function clampCoord(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.floor(value)));
}

interface PrismaCell {
  id: string;
  mazeId: string;
  posX: number;
  posY: number;
  wallNorth: boolean;
  wallSouth: boolean;
  wallEast: boolean;
  wallWest: boolean;
}

interface LabyrinthMapProps {
  staticCells: PrismaCell[]; 
  steps: SessionStep[];       
  currentX: number;           
  currentY: number;           
  width?: number;             
  height?: number;            
}

export const LabyrinthMap = memo(function LabyrinthMap({
  staticCells = [],
  steps = [],
  currentX,
  currentY,
  width = DEFAULT_GRID_SIZE,
  height = DEFAULT_GRID_SIZE,
}: LabyrinthMapProps) {
  const safeX = clampCoord(currentX, width - 1);
  const safeY = clampCoord(currentY, height - 1);

  const cellWallsMap = useMemo(() => {
    const map = new Map<string, PrismaCell>();
    staticCells.forEach((cell) => {
      map.set(`${cell.posX},${cell.posY}`, cell);
    });
    return map;
  }, [staticCells]);

  const trailIntensity = useMemo(() => {
    const intensity = new Map<string, number>();
    steps.forEach((step, index) => {
      const x = clampCoord(step.posX, width - 1);
      const y = clampCoord(step.posY, height - 1);
      intensity.set(`${x},${y}`, index);
    });
    return intensity;
  }, [steps, width, height]);

  const maxTrailIndex = Math.max(0, steps.length - 1);

  const totalCells = width * height;
  const cellsArray = Array.from({ length: totalCells }, (_, index) => {
    const rowIndex = Math.floor(index / width);
    const colIndex = index % width;

    const y = height - 1 - rowIndex;
    const x = colIndex;
    const key = `${x},${y}`;

    const cellData = cellWallsMap.get(key);

    const isRobot = safeX === x && safeY === y;
    const trailIndex = trailIntensity.get(key);
    const isVisited = trailIndex !== undefined && !isRobot;

    const hasNorth = cellData?.wallNorth ?? false;
    const hasSouth = cellData?.wallSouth ?? false;
    const hasEast = cellData?.wallEast ?? false;
    const hasWest = cellData?.wallWest ?? false;

    const trailOpacity = isVisited
      ? 0.12 + (trailIndex / maxTrailIndex) * 0.38
      : undefined;

    return (
      <div
        key={key}
        data-testid={isRobot ? "maze-robot-cell" : undefined}
        className={`
          w-full h-full transition-all duration-150 box-border
          ${hasNorth ? "border-t-[3px] border-t-red-500" : "border-t border-t-outline-variant/10"}
          ${hasSouth ? "border-b-[3px] border-b-red-500" : "border-b border-b-outline-variant/10"}
          ${hasEast ? "border-r-[3px] border-r-red-500" : "border-r border-r-outline-variant/10"}
          ${hasWest ? "border-l-[3px] border-l-red-500" : "border-l border-l-outline-variant/10"}
          ${
            isRobot
              ? "bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] scale-110 z-10 animate-pulse"
              : isVisited
                ? "bg-primary"
                : "bg-transparent"
          }
        `}
        style={trailOpacity !== undefined ? { opacity: trailOpacity } : undefined}
        title={`Coords: (${x}, ${y})`}
      />
    );
  });

  return (
    <div
      data-testid="maze-grid"
      className="grid gap-0 bg-surface-container-lowest border border-outline-variant/50 p-2 shadow-inner w-fit h-full aspect-square mx-auto"
      style={{
        gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
      }}
      aria-label="Mapeamento do labirinto"
    >
      {cellsArray}
    </div>
  );
});