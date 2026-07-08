import { describe, expect, it } from "vitest";
import type { MazeCellWalls } from "../../types/maze";
import {
  absoluteDirectionFromRobot,
  computeReplayRobotRotation,
  lerSensoresProximidade,
  lerSensoresReplay,
  passosLivresAteParede,
  passosParaCm,
  statusDoSensor,
} from "../../utils/sensorRaycast";
import { createEmptyCell, getCellKey } from "../../utils/verificarColisao";

function buildMap(cells: MazeCellWalls[]): Map<string, MazeCellWalls> {
  const map = new Map<string, MazeCellWalls>();
  cells.forEach((cell) => map.set(getCellKey(cell.posX, cell.posY), cell));
  return map;
}

describe("sensorRaycast", () => {
  it("mapeia rotação do robô para direção absoluta", () => {
    expect(absoluteDirectionFromRobot(0, "front")).toBe("North");
    expect(absoluteDirectionFromRobot(0, "left")).toBe("West");
    expect(absoluteDirectionFromRobot(0, "right")).toBe("East");
    expect(absoluteDirectionFromRobot(90, "front")).toBe("East");
    expect(absoluteDirectionFromRobot(90, "left")).toBe("North");
    expect(absoluteDirectionFromRobot(180, "front")).toBe("South");
    expect(absoluteDirectionFromRobot(270, "right")).toBe("North");
  });

  it("retorna 0 passos quando há parede imediata", () => {
    const map = buildMap([
      { ...createEmptyCell(2, 2), wallNorth: true },
    ]);
    expect(passosLivresAteParede(map, 2, 2, "North", 8, 8)).toBe(0);
    expect(statusDoSensor(0).label).toBe("PAREDE");
    expect(passosParaCm(0)).toBe(4);
  });

  it("conta quantas células livres existem até a parede", () => {
    // (1,1) livre ao norte; parede na célula (1,2) norte → 1 passo livre
    const map = buildMap([
      createEmptyCell(1, 1),
      { ...createEmptyCell(1, 2), wallNorth: true },
    ]);
    expect(passosLivresAteParede(map, 1, 1, "North", 8, 8)).toBe(1);
    expect(statusDoSensor(1).label).toBe("1 PASSO");
    expect(passosParaCm(1)).toBe(18);
  });

  it("considera parede do vizinho (lado oposto)", () => {
    const map = buildMap([
      createEmptyCell(0, 0),
      { ...createEmptyCell(1, 0), wallWest: true },
    ]);
    expect(passosLivresAteParede(map, 0, 0, "East", 8, 8)).toBe(0);
  });

  it("entrega leituras front/left/right relativas ao focinho", () => {
    const map = buildMap([
      {
        ...createEmptyCell(3, 3),
        wallNorth: true, // frente (rot 0)
        wallEast: true, // direita
      },
    ]);

    const readings = lerSensoresProximidade(map, 3, 3, 0, 8, 8);
    expect(readings.front.label).toBe("PAREDE");
    expect(readings.right.label).toBe("PAREDE");
    expect(readings.left.label).not.toBe("PAREDE");
  });

  it("reporta LIVRE quando não há parede no alcance", () => {
    const map = buildMap([createEmptyCell(0, 0)]);
    // Indo para Leste a partir de (0,0) em grid 8: 7 células livres, cap em 4
    expect(passosLivresAteParede(map, 0, 0, "East", 8, 8)).toBe(4);
    expect(statusDoSensor(4).label).toBe("LIVRE");
  });

  it("infere rotação do robô no replay pelo deslocamento", () => {
    const steps = [
      { posX: 0, posY: 0 },
      { posX: 0, posY: 1 },
      { posX: 1, posY: 1 },
      { posX: 1, posY: 0 },
    ];
    expect(computeReplayRobotRotation(steps, 1)).toBe(0);
    expect(computeReplayRobotRotation(steps, 2)).toBe(90);
    expect(computeReplayRobotRotation(steps, 3)).toBe(180);
  });

  it("calcula sensores no replay a partir do labirinto salvo", () => {
    const maze = {
      width: 8,
      height: 8,
      cells: [
        {
          posX: 1,
          posY: 1,
          wallNorth: false,
          wallSouth: false,
          wallEast: true,
          wallWest: false,
        },
      ],
    };
    const steps = [
      { posX: 0, posY: 1 },
      { posX: 1, posY: 1 },
    ];

    const atStart = lerSensoresReplay(maze, steps, 0);
    expect(atStart.front.label).toBe("LIVRE");

    const atWall = lerSensoresReplay(maze, steps, 1);
    expect(atWall.front.label).toBe("PAREDE");
  });
});
