import { describe, expect, it } from "vitest";
import { mergeLiveMazeCells } from "../../utils/mergeLiveMazeCells";
import type { MazeCell } from "../../types/session";

describe("mergeLiveMazeCells", () => {
  it("retorna células estáticas quando não há telemetria", () => {
    const staticCells: MazeCell[] = [
      {
        posX: 0,
        posY: 0,
        wallNorth: true,
        wallSouth: false,
        wallEast: false,
        wallWest: true,
      },
    ];

    expect(mergeLiveMazeCells(staticCells, [])).toEqual(staticCells);
  });

  it("acumula paredes descobertas ao vivo por célula", () => {
    const merged = mergeLiveMazeCells(
      [],
      [
        {
          posX: 1,
          posY: 2,
          walls: { north: true, south: false, east: false, west: false },
        },
        {
          posX: 1,
          posY: 2,
          walls: { north: false, south: false, east: true, west: false },
        },
      ],
    );

    expect(merged).toEqual([
      {
        posX: 1,
        posY: 2,
        wallNorth: true,
        wallSouth: false,
        wallEast: true,
        wallWest: false,
      },
    ]);
  });

  it("não apaga parede estática com telemetria falsa na mesma direção", () => {
    const merged = mergeLiveMazeCells(
      [
        {
          posX: 0,
          posY: 0,
          wallNorth: true,
          wallSouth: false,
          wallEast: false,
          wallWest: false,
        },
      ],
      [
        {
          posX: 0,
          posY: 0,
          walls: { north: false, south: true, east: false, west: false },
        },
      ],
    );

    expect(merged[0]).toMatchObject({
      wallNorth: true,
      wallSouth: true,
    });
  });

  it("ignora steps sem walls", () => {
    expect(
      mergeLiveMazeCells([], [{ posX: 3, posY: 4 }, { posX: 3, posY: 4, walls: null }]),
    ).toEqual([]);
  });
});
