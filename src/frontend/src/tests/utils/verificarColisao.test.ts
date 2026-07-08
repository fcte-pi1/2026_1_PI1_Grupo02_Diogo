import { describe, expect, it } from "vitest";
import type { MazeCellWalls } from "../../types/maze";
import {
  canMove,
  createEmptyCell,
  getCellKey,
  getNeighbor,
  verificarColisao,
} from "../../utils/verificarColisao";

function buildMap(cells: MazeCellWalls[]): Map<string, MazeCellWalls> {
  const map = new Map<string, MazeCellWalls>();
  cells.forEach((cell) => map.set(getCellKey(cell.posX, cell.posY), cell));
  return map;
}

describe("verificarColisao", () => {
  it("bloqueia movimento fora da malha", () => {
    const map = buildMap([]);
    expect(verificarColisao(map, 0, 0, -1, 0, 8, 8)).toBe(true);
    expect(verificarColisao(map, 0, 0, 0, -1, 8, 8)).toBe(true);
    expect(verificarColisao(map, 7, 7, 1, 0, 8, 8)).toBe(true);
    expect(verificarColisao(map, 7, 7, 0, 1, 8, 8)).toBe(true);
  });

  it("bloqueia quando a célula atual tem parede na direção", () => {
    const map = buildMap([
      {
        ...createEmptyCell(2, 2),
        wallNorth: true,
      },
    ]);

    expect(verificarColisao(map, 2, 2, 0, 1, 8, 8)).toBe(true);
    expect(canMove(map, 2, 2, 0, 1, 8, 8)).toBe(false);
    expect(canMove(map, 2, 2, 1, 0, 8, 8)).toBe(true);
  });

  it("bloqueia quando só a vizinha tem a parede oposta (unilateral)", () => {
    const map = buildMap([
      {
        ...createEmptyCell(2, 3),
        wallSouth: true,
      },
    ]);

    // (2,2) sem wallNorth, mas vizinho (2,3) tem wallSouth
    expect(verificarColisao(map, 2, 2, 0, 1, 8, 8)).toBe(true);
    expect(canMove(map, 2, 2, 0, 1, 8, 8)).toBe(false);
  });

  it("permite movimento livre sem paredes", () => {
    const map = buildMap([createEmptyCell(1, 1)]);
    expect(verificarColisao(map, 1, 1, 0, 1, 8, 8)).toBe(false);
    expect(verificarColisao(map, 1, 1, 1, 0, 8, 8)).toBe(false);
    expect(canMove(map, 1, 1, 0, -1, 8, 8)).toBe(true);
  });

  it("getNeighbor respeita o eixo Y (norte = +y)", () => {
    expect(getNeighbor(3, 4, "North")).toEqual({
      x: 3,
      y: 5,
      opposite: "South",
    });
    expect(getNeighbor(3, 4, "South")).toEqual({
      x: 3,
      y: 3,
      opposite: "North",
    });
    expect(getNeighbor(3, 4, "East")).toEqual({
      x: 4,
      y: 4,
      opposite: "West",
    });
    expect(getNeighbor(3, 4, "West")).toEqual({
      x: 2,
      y: 4,
      opposite: "East",
    });
  });
});
