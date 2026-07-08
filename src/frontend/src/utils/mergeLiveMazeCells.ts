import type { MazeCell } from "../types/session";
import { createEmptyCell, getCellKey } from "./verificarColisao";

/** Parede vinda do pacote WebSocket (`walls` absoluto na célula do passo). */
export interface LiveWalls {
  north?: boolean;
  south?: boolean;
  east?: boolean;
  west?: boolean;
}

export interface LiveTelemetryWallSource {
  posX: number;
  posY: number;
  walls?: LiveWalls | null;
}

/**
 * Mescla paredes estáticas (sessão/DB) com descobertas ao vivo da telemetria.
 * Usa OR por direção para nunca apagar uma parede já conhecida.
 */
export function mergeLiveMazeCells(
  staticCells: MazeCell[] = [],
  liveSources: LiveTelemetryWallSource[] = [],
): MazeCell[] {
  const map = new Map<string, MazeCell>();

  staticCells.forEach((cell) => {
    map.set(getCellKey(cell.posX, cell.posY), {
      posX: cell.posX,
      posY: cell.posY,
      wallNorth: Boolean(cell.wallNorth),
      wallSouth: Boolean(cell.wallSouth),
      wallEast: Boolean(cell.wallEast),
      wallWest: Boolean(cell.wallWest),
    });
  });

  liveSources.forEach((source) => {
    if (!source.walls) return;

    const key = getCellKey(source.posX, source.posY);
    const prev = map.get(key) ?? createEmptyCell(source.posX, source.posY);

    map.set(key, {
      posX: source.posX,
      posY: source.posY,
      wallNorth: prev.wallNorth || Boolean(source.walls.north),
      wallSouth: prev.wallSouth || Boolean(source.walls.south),
      wallEast: prev.wallEast || Boolean(source.walls.east),
      wallWest: prev.wallWest || Boolean(source.walls.west),
    });
  });

  return Array.from(map.values());
}
