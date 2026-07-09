import { memo, useMemo } from "react";
import type { SessionStep } from "../types/session";
import type { MazeCellWalls } from "../types/maze";

const DEFAULT_GRID_SIZE = 16;

export type Direction = "North" | "South" | "East" | "West";

function clampCoord(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.floor(value)));
}

function getCellKey(x: number, y: number): string {
  return `${x},${y}`;
}

interface LabyrinthMapProps {
  staticCells: MazeCellWalls[];
  steps: SessionStep[];
  currentX: number;
  currentY: number;
  robotRotation?: number; // Recebe o ângulo do joystick do testView
  width?: number;
  height?: number;
  editable?: boolean;
  onToggleWall?: (x: number, y: number, direction: Direction) => void;
  blockedCells?: MazeCellWalls[];
}

export const LabyrinthMap = memo(function LabyrinthMap({
  staticCells = [],
  steps = [],
  currentX,
  currentY,
  robotRotation = 0,
  width = DEFAULT_GRID_SIZE,
  height = DEFAULT_GRID_SIZE,
  editable = false,
  onToggleWall,
  blockedCells = [],
}: LabyrinthMapProps) {
  const safeX = clampCoord(currentX, width - 1);
  const safeY = clampCoord(currentY, height - 1);

  // Mescla as paredes do banco (staticCells) com as bloqueadas
  const mergedWallsMap = useMemo(() => {
    const map = new Map<string, MazeCellWalls>();

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        map.set(getCellKey(x, y), {
          posX: x,
          posY: y,
          wallNorth: false,
          wallSouth: false,
          wallEast: false,
          wallWest: false,
        });
      }
    }

    staticCells.forEach((cell) => {
      const key = getCellKey(cell.posX, cell.posY);
      const prev = map.get(key);
      if (prev) {
        map.set(key, {
          posX: cell.posX,
          posY: cell.posY,
          wallNorth: cell.wallNorth ?? prev.wallNorth,
          wallSouth: cell.wallSouth ?? prev.wallSouth,
          wallEast: cell.wallEast ?? prev.wallEast,
          wallWest: cell.wallWest ?? prev.wallWest,
        });
      }
    });

    blockedCells.forEach((cell) => {
      const key = getCellKey(cell.posX, cell.posY);
      const prev = map.get(key);
      if (prev) {
        map.set(key, {
          posX: cell.posX,
          posY: cell.posY,
          wallNorth: prev.wallNorth || cell.wallNorth || false,
          wallSouth: prev.wallSouth || cell.wallSouth || false,
          wallEast: prev.wallEast || cell.wallEast || false,
          wallWest: prev.wallWest || cell.wallWest || false,
        });
      }
    });

    return map;
  }, [staticCells, blockedCells, width, height]);

  // Calcula a trilha (rastro) deixada pelos steps
  const trailIntensity = useMemo(() => {
    const intensity = new Map<string, number>();
    steps.forEach((step, index) => {
      const x = clampCoord(step.posX, width - 1);
      const y = clampCoord(step.posY, height - 1);
      intensity.set(getCellKey(x, y), index);
    });
    return intensity;
  }, [steps, width, height]);

  const maxTrailIndex = Math.max(1, steps.length - 1);
  const totalCells = width * height;

  const cellsArray = Array.from({ length: totalCells }, (_, index) => {
    const rowIndex = Math.floor(index / width);
    const colIndex = index % width;

    // Eixo Y invertido para a Origem (0,0) ficar no canto inferior esquerdo
    const y = height - 1 - rowIndex;
    const x = colIndex;
    const key = getCellKey(x, y);

    const cellData = mergedWallsMap.get(key);

    const isRobot = safeX === x && safeY === y;
    const trailIndex = trailIntensity.get(key);
    const isVisited = trailIndex !== undefined && !isRobot;

    const hasNorth = cellData?.wallNorth ?? false;
    const hasSouth = cellData?.wallSouth ?? false;
    const hasEast = cellData?.wallEast ?? false;
    const hasWest = cellData?.wallWest ?? false;

    // Cor do rastro por onde o robô passou
    const trailOpacity =
      isVisited && trailIndex !== undefined
        ? 0.18 + (trailIndex / maxTrailIndex) * 0.28
        : undefined;

    return (
      <div
        key={key}
        data-testid={isRobot ? "maze-robot-cell" : undefined}
        // Removemos o bg-blue-500 daqui. A célula base é sempre escura.
        className={`relative h-12 w-12 box-border border-[0.5px] border-zinc-800 bg-zinc-900 ${
          isVisited ? "bg-emerald-950/40" : ""
        }`}
        style={
          trailOpacity !== undefined
            ? { backgroundColor: `rgb(6 78 59 / ${trailOpacity})` }
            : undefined
        }
      >
        {/* Paredes Absolutas (Não quebram o Grid CSS) */}
        {hasNorth && <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-400 z-10 shadow-[0_0_8px_#34d399]" />}
        {hasSouth && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-400 z-10 shadow-[0_0_8px_#34d399]" />}
        {hasEast && <div className="absolute top-0 bottom-0 right-0 w-[3px] bg-emerald-400 z-10 shadow-[0_0_8px_#34d399]" />}
        {hasWest && <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-emerald-400 z-10 shadow-[0_0_8px_#34d399]" />}

        {/* Coordenadas visuais bem clarinhas */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] text-zinc-600">
          {x},{y}
        </div>

        {/* O RATO (Renderizado APENAS na célula atual do robô) */}
        {isRobot && (
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-8 w-8 transition-transform duration-200 ease-out"
            style={{ 
              transform: `translate(-50%, -50%) rotate(${robotRotation}deg)`,
              transformOrigin: "center center" 
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
              {/* Corpo do rato */}
              <path d="M12 21A5 5 0 0 0 17 16V9A5 5 0 0 0 7 9V16A5 5 0 0 0 12 21Z" fill="#0891b2" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.5"/>
              {/* Focinho (Aponta pra cima no rotate 0) */}
              <path d="M12 3L9 8H15L12 3Z" fill="currentColor" />
              {/* Orelhas */}
              <circle cx="7.5" cy="11.5" r="2" fill="currentColor" />
              <circle cx="16.5" cy="11.5" r="2" fill="currentColor" />
              {/* Rabo */}
              <path d="M12 21V24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        )}

        {/* Controles do Editor de Paredes (Ativos apenas se editable for true) */}
        {editable && onToggleWall && (
          <>
            <button
              type="button"
              className={`absolute left-0 top-0 z-20 h-2.5 w-full transition-colors ${
                hasNorth ? "bg-emerald-400/20" : "bg-transparent hover:bg-emerald-400/30"
              }`}
              onClick={() => onToggleWall(x, y, "North")}
            />
            <button
              type="button"
              className={`absolute bottom-0 left-0 z-20 h-2.5 w-full transition-colors ${
                hasSouth ? "bg-emerald-400/20" : "bg-transparent hover:bg-emerald-400/30"
              }`}
              onClick={() => onToggleWall(x, y, "South")}
            />
            <button
              type="button"
              className={`absolute right-0 top-0 z-20 h-full w-2.5 transition-colors ${
                hasEast ? "bg-emerald-400/20" : "bg-transparent hover:bg-emerald-400/30"
              }`}
              onClick={() => onToggleWall(x, y, "East")}
            />
            <button
              type="button"
              className={`absolute left-0 top-0 z-20 h-full w-2.5 transition-colors ${
                hasWest ? "bg-emerald-400/20" : "bg-transparent hover:bg-emerald-400/30"
              }`}
              onClick={() => onToggleWall(x, y, "West")}
            />
          </>
        )}
      </div>
    );
  });

  return (
    <div
      data-testid="maze-grid"
      className="mx-auto grid aspect-square w-fit gap-0 rounded-xl border border-zinc-700 bg-zinc-950 p-2 shadow-2xl"
      style={{
        gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
      }}
    >
      {cellsArray}
    </div>
  );
});

export default LabyrinthMap;