import { memo, useMemo } from "react";
import type { MazeCell } from "../types/session";
import { computeMazeOffset } from "../utils/maze-translation";

const DEFAULT_GRID_SIZE = 8;

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
  robotRotation?: number; // NOVA PROP PARA GIRAR O RATO
  ariaLabel?: string;
}

export const MazeGrid = memo(function MazeGrid({
  cells = [],
  steps = [],
  currentX,
  currentY,
  width = DEFAULT_GRID_SIZE,
  height = DEFAULT_GRID_SIZE,
  robotRotation = 0,
  ariaLabel = "Mapeamento do labirinto",
}: MazeGridProps) {
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

    const y = height - 1 - rowIndex;
    const x = colIndex;
    const key = `${x},${y}`;

    const cellData = cellWallsMap.get(key);

    const isRobot = safeX === x && safeY === y;
    const visitCount = visitCounts.get(key) ?? 0;
    const isVisited = visitCount > 0;

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
        className="relative w-full h-full box-border border-[0.5px] border-outline-variant/20 transition-colors duration-150"
        style={
          isVisited
            ? {
                backgroundColor: `color-mix(in srgb, var(--color-primary) ${Math.round(visitAlpha * 100)}%, transparent)`,
              }
            : undefined
        }
        title={isRobot ? `Robô em (${x}, ${y})` : `Coords: (${x}, ${y})`}
        data-wall-north={hasNorth ? "true" : undefined}
        data-wall-south={hasSouth ? "true" : undefined}
        data-wall-east={hasEast ? "true" : undefined}
        data-wall-west={hasWest ? "true" : undefined}
      >
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[10px] text-zinc-500/40">
          {x},{y}
        </div>

        {/* Paredes 4px vermelhas — mesmo contrato visual do LabyrinthMap */}
        {hasNorth && (
          <div className="absolute top-0 left-0 right-0 z-10 h-[4px] bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
        )}
        {hasSouth && (
          <div className="absolute bottom-0 left-0 right-0 z-10 h-[4px] bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
        )}
        {hasEast && (
          <div className="absolute top-0 bottom-0 right-0 z-10 w-[4px] bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
        )}
        {hasWest && (
          <div className="absolute top-0 bottom-0 left-0 z-10 w-[4px] bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
        )}

        {/* RATO ROTACIONANDO */}
        {isRobot && (
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-8 w-8 transition-transform duration-200 ease-out"
            style={{ 
              transform: `translate(-50%, -50%) rotate(${robotRotation}deg)`,
              transformOrigin: "center center" 
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse">
              <path d="M12 21A5 5 0 0 0 17 16V9A5 5 0 0 0 7 9V16A5 5 0 0 0 12 21Z" fill="#0891b2" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 3L9 8H15L12 3Z" fill="currentColor" />
              <circle cx="7.5" cy="11.5" r="2" fill="currentColor" />
              <circle cx="16.5" cy="11.5" r="2" fill="currentColor" />
              <path d="M12 21V24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
    );
  });

  return (
    <div
      data-testid="maze-grid"
      data-offset-x={offsetX}
      data-offset-y={offsetY}
      className="grid gap-0 bg-zinc-950 border border-outline-variant/50 p-2 shadow-inner w-full h-full max-w-full max-h-full aspect-square mx-auto rounded-xl"
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