import type { MazeCellWalls } from "../types/maze";

export type Direction = "North" | "South" | "East" | "West";
export type WallField = "wallNorth" | "wallSouth" | "wallEast" | "wallWest";

export function getCellKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function createEmptyCell(x: number, y: number): MazeCellWalls {
  return {
    posX: x,
    posY: y,
    wallNorth: false,
    wallSouth: false,
    wallEast: false,
    wallWest: false,
  };
}

export function getDirectionFromDelta(dx: number, dy: number): Direction | null {
  if (dx === 1 && dy === 0) return "East";
  if (dx === -1 && dy === 0) return "West";
  if (dx === 0 && dy === 1) return "North";
  if (dx === 0 && dy === -1) return "South";
  return null;
}

export function getWallField(dir: Direction): WallField {
  switch (dir) {
    case "North":
      return "wallNorth";
    case "South":
      return "wallSouth";
    case "East":
      return "wallEast";
    case "West":
      return "wallWest";
  }
}

export function hasWall(cell: MazeCellWalls, direction: Direction): boolean {
  return Boolean(cell[getWallField(direction)]);
}

export function getNeighbor(
  x: number,
  y: number,
  dir: Direction,
): { x: number; y: number; opposite: Direction } {
  switch (dir) {
    case "North":
      return { x, y: y + 1, opposite: "South" };
    case "South":
      return { x, y: y - 1, opposite: "North" };
    case "East":
      return { x: x + 1, y, opposite: "West" };
    case "West":
      return { x: x - 1, y, opposite: "East" };
  }
}

/**
 * Retorna `true` quando o movimento é bloqueado (colisão ou fora da malha).
 * Considera a parede da célula atual e a parede oposta da célula vizinha
 * (dados unilaterais vindos do firmware/DB ainda bloqueiam o passo).
 */
export function verificarColisao(
  map: Map<string, MazeCellWalls>,
  x: number,
  y: number,
  dx: number,
  dy: number,
  width: number,
  height: number,
): boolean {
  const direction = getDirectionFromDelta(dx, dy);
  if (!direction) return true;

  const nextX = x + dx;
  const nextY = y + dy;

  if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
    return true;
  }

  const currentCell = map.get(getCellKey(x, y)) ?? createEmptyCell(x, y);
  if (hasWall(currentCell, direction)) {
    return true;
  }

  const neighbor = getNeighbor(x, y, direction);
  const neighborCell =
    map.get(getCellKey(neighbor.x, neighbor.y)) ??
    createEmptyCell(neighbor.x, neighbor.y);

  return hasWall(neighborCell, neighbor.opposite);
}

/** Conveniência: movimento livre quando `verificarColisao` é falso. */
export function canMove(
  map: Map<string, MazeCellWalls>,
  x: number,
  y: number,
  dx: number,
  dy: number,
  width: number,
  height: number,
): boolean {
  return !verificarColisao(map, x, y, dx, dy, width, height);
}
