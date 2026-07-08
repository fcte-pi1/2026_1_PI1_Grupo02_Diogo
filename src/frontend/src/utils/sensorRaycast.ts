import type { MazeCellWalls } from "../types/maze";
import type { MazeCell } from "../types/session";
import {
  createEmptyCell,
  getCellKey,
  getNeighbor,
  verificarColisao,
  type Direction,
} from "./verificarColisao";

/** Tamanho aproximado de uma célula do labirinto (mesmo valor do backend). */
export const CELL_SIZE_CM = 18;
/** Distância reportada quando a parede está na borda imediata da célula. */
export const WALL_CONTACT_CM = 4;
/** Alcance máximo do sensor (células). */
export const SENSOR_RANGE_CELLS = 4;

export type RelativeSensor = "front" | "left" | "right";

/**
 * Converte rotação do robô (0=N, 90=E, 180=S, 270=W) + canal relativo
 * em direção absoluta do maze.
 */
export function absoluteDirectionFromRobot(
  robotRotationDeg: number,
  channel: RelativeSensor,
): Direction {
  let rot = robotRotationDeg % 360;
  if (rot < 0) rot += 360;
  // Quantiza para os 4 cardeais
  const facingIndex = Math.round(rot / 90) % 4; // 0=N, 1=E, 2=S, 3=W
  const order: Direction[] = ["North", "East", "South", "West"];

  const offset = channel === "front" ? 0 : channel === "right" ? 1 : 3; // left = -1 mod 4
  return order[(facingIndex + offset) % 4];
}

/**
 * Quantos passos livres existem até bater em parede / borda do labirinto.
 * `0` = parede (ou fora da malha) já na célula atual nessa direção.
 */
export function passosLivresAteParede(
  map: Map<string, MazeCellWalls>,
  x: number,
  y: number,
  direction: Direction,
  width: number,
  height: number,
  maxRange: number = SENSOR_RANGE_CELLS,
): number {
  let cx = x;
  let cy = y;

  for (let step = 0; step < maxRange; step += 1) {
    const neighbor = getNeighbor(cx, cy, direction);
    const dx = neighbor.x - cx;
    const dy = neighbor.y - cy;

    if (verificarColisao(map, cx, cy, dx, dy, width, height)) {
      return step; // 0 = colado; 1 = um passo livre; etc.
    }

    cx = neighbor.x;
    cy = neighbor.y;
  }

  return maxRange;
}

/** Converte passos livres em cm “de ultrassom”. */
export function passosParaCm(passosLivres: number): number {
  if (passosLivres <= 0) return WALL_CONTACT_CM;
  return Math.min(40, passosLivres * CELL_SIZE_CM);
}

export function statusDoSensor(passosLivres: number): {
  cm: number;
  label: string;
  detalhe: string;
} {
  const cm = passosParaCm(passosLivres);

  if (passosLivres <= 0) {
    return {
      cm,
      label: "PAREDE",
      detalhe: "Colado — sem passo nessa direção",
    };
  }
  if (passosLivres === 1) {
    return {
      cm,
      label: "1 PASSO",
      detalhe: "Cabe 1 célula até a próxima parede",
    };
  }
  if (passosLivres >= SENSOR_RANGE_CELLS) {
    return {
      cm,
      label: "LIVRE",
      detalhe: `≥${SENSOR_RANGE_CELLS} células livres no alcance`,
    };
  }
  return {
    cm,
    label: `${passosLivres} PASSOS`,
    detalhe: `${passosLivres} células livres até a parede`,
  };
}

export function lerSensoresProximidade(
  map: Map<string, MazeCellWalls>,
  x: number,
  y: number,
  robotRotationDeg: number,
  width: number,
  height: number,
): {
  front: ReturnType<typeof statusDoSensor>;
  left: ReturnType<typeof statusDoSensor>;
  right: ReturnType<typeof statusDoSensor>;
} {
  // Garante célula atual no mapa (raycast não depende só dela, mas evita buracos)
  if (!map.has(getCellKey(x, y))) {
    map.set(getCellKey(x, y), createEmptyCell(x, y));
  }

  const channels: RelativeSensor[] = ["front", "left", "right"];
  const result = {} as {
    front: ReturnType<typeof statusDoSensor>;
    left: ReturnType<typeof statusDoSensor>;
    right: ReturnType<typeof statusDoSensor>;
  };

  for (const channel of channels) {
    const absDir = absoluteDirectionFromRobot(robotRotationDeg, channel);
    const passos = passosLivresAteParede(map, x, y, absDir, width, height);
    result[channel] = statusDoSensor(passos);
  }

  return result;
}

/** Mapa de paredes a partir das células salvas na sessão (histórico / replay). */
export function buildMazeWallsMap(cells: MazeCell[]): Map<string, MazeCellWalls> {
  const map = new Map<string, MazeCellWalls>();
  cells.forEach((cell) => {
    map.set(getCellKey(cell.posX, cell.posY), {
      posX: cell.posX,
      posY: cell.posY,
      wallNorth: cell.wallNorth,
      wallSouth: cell.wallSouth,
      wallEast: cell.wallEast,
      wallWest: cell.wallWest,
    });
  });
  return map;
}

/** Converte direção absoluta da ESP em graus (0=N, 90=E, 180=S, 270=W). */
export function direcaoEspParaRotacao(direcao?: string): number {
  switch (direcao?.toLowerCase()) {
    case "leste":
      return 90;
    case "sul":
      return 180;
    case "oeste":
      return 270;
    case "norte":
    default:
      return 0;
  }
}

/** Rotação ao vivo: prioriza `direcao` da ESP; senão infere pelo deslocamento. */
export function rotacaoDoRoboAoVivo(
  steps: { posX: number; posY: number }[],
  direcaoEsp?: string,
): number {
  if (direcaoEsp) return direcaoEspParaRotacao(direcaoEsp);
  if (steps.length >= 2) {
    return computeReplayRobotRotation(steps, steps.length - 1);
  }
  return 0;
}

export interface LiveWallTelemetryStep {
  posX: number;
  posY: number;
  walls?: {
    north?: boolean;
    south?: boolean;
    east?: boolean;
    west?: boolean;
  } | null;
}

/**
 * Sensores no Dashboard / telemetria ao vivo: raycast nas paredes descobertas
 * (merge do maze + telemetria), não nos cm crus do pacote MQTT.
 */
export function lerSensoresAoVivo(
  discoveredCells: MazeCell[],
  wallSources: LiveWallTelemetryStep[],
  posX: number,
  posY: number,
  width: number,
  height: number,
  direcaoEsp?: string,
): {
  front: ReturnType<typeof statusDoSensor>;
  left: ReturnType<typeof statusDoSensor>;
  right: ReturnType<typeof statusDoSensor>;
} {
  const stepsForRotation = wallSources.map((s) => ({
    posX: s.posX,
    posY: s.posY,
  }));
  const rotation = rotacaoDoRoboAoVivo(stepsForRotation, direcaoEsp);

  if (discoveredCells.length > 0) {
    const map = buildMazeWallsMap(discoveredCells);
    return lerSensoresProximidade(map, posX, posY, rotation, width, height);
  }

  return {
    front: statusDoSensor(SENSOR_RANGE_CELLS),
    left: statusDoSensor(SENSOR_RANGE_CELLS),
    right: statusDoSensor(SENSOR_RANGE_CELLS),
  };
}

/** Rotação do robô no replay a partir do deslocamento entre passos consecutivos. */
export function computeReplayRobotRotation(
  steps: { posX: number; posY: number }[],
  activeIndex: number,
): number {
  if (activeIndex <= 0 || steps.length < 2) return 0;
  const curr = steps[activeIndex];
  const prev = steps[activeIndex - 1];
  const dx = curr.posX - prev.posX;
  const dy = curr.posY - prev.posY;

  if (dx === 0 && dy > 0) return 0;
  if (dx > 0 && dy === 0) return 90;
  if (dx === 0 && dy < 0) return 180;
  if (dx < 0 && dy === 0) return 270;
  return 0;
}

/** Converte cm armazenado em telemetria legada para label (fallback sem maze). */
export function leituraFromCm(cm: number): ReturnType<typeof statusDoSensor> {
  if (cm <= WALL_CONTACT_CM) return statusDoSensor(0);
  const passos = Math.max(1, Math.round(cm / CELL_SIZE_CM));
  return statusDoSensor(Math.min(passos, SENSOR_RANGE_CELLS));
}

/**
 * Leituras FRENTE/ESQ/DIR para um passo do replay de sessão.
 * Prioriza raycast no labirinto salvo; usa sensors do step só como fallback.
 */
export function lerSensoresReplay(
  maze: { width: number; height: number; cells: MazeCell[] } | undefined,
  steps: { posX: number; posY: number; sensors?: { front: number; left: number; right: number } }[],
  activeIndex: number,
): {
  front: ReturnType<typeof statusDoSensor>;
  left: ReturnType<typeof statusDoSensor>;
  right: ReturnType<typeof statusDoSensor>;
} {
  const step = steps[Math.min(activeIndex, steps.length - 1)];
  if (!step) {
    return {
      front: statusDoSensor(0),
      left: statusDoSensor(0),
      right: statusDoSensor(0),
    };
  }

  const width = maze?.width ?? 8;
  const height = maze?.height ?? 8;

  if (maze?.cells && maze.cells.length > 0) {
    const map = buildMazeWallsMap(maze.cells);
    const rotation = computeReplayRobotRotation(steps, activeIndex);
    return lerSensoresProximidade(
      map,
      step.posX,
      step.posY,
      rotation,
      width,
      height,
    );
  }

  const s = step.sensors;
  return {
    front: leituraFromCm(s?.front ?? 0),
    left: leituraFromCm(s?.left ?? 0),
    right: leituraFromCm(s?.right ?? 0),
  };
}

/** Útil para testes: parede imediata na direção absoluta? */
export function temParedeImediata(
  map: Map<string, MazeCellWalls>,
  x: number,
  y: number,
  direction: Direction,
  width: number,
  height: number,
): boolean {
  return passosLivresAteParede(map, x, y, direction, width, height, 1) === 0;
}
