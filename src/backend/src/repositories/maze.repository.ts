import type { Maze } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const DEFAULT_MAZE_SIZE = 16;
export const SIMULATOR_MAZE_SIZE = 8;
export const SIMULATOR_MAZE_NAME = "Labirinto simulador (8x8)";

export type MazeCellWallInput = {
  posX: number;
  posY: number;
  wallNorth?: boolean;
  wallSouth?: boolean;
  wallEast?: boolean;
  wallWest?: boolean;
};

export const findFirstMaze = async (): Promise<Maze | null> =>
  prisma.maze.findFirst();

export const createDefaultMaze = async (): Promise<Maze> =>
  prisma.maze.create({
    data: {
      name: "Labirinto padrão",
      width: DEFAULT_MAZE_SIZE,
      height: DEFAULT_MAZE_SIZE,
    },
  });

export const findOrCreateDefaultMaze = async (): Promise<Maze> => {
  const existing = await findFirstMaze();
  return existing ?? createDefaultMaze();
};

export const findOrCreateSimulatorMaze = async (): Promise<Maze> => {
  const existing = await prisma.maze.findFirst({
    where: { name: SIMULATOR_MAZE_NAME },
  });

  if (existing) {
    if (
      existing.width !== SIMULATOR_MAZE_SIZE ||
      existing.height !== SIMULATOR_MAZE_SIZE
    ) {
      return prisma.maze.update({
        where: { id: existing.id },
        data: {
          width: SIMULATOR_MAZE_SIZE,
          height: SIMULATOR_MAZE_SIZE,
        },
      });
    }
    return existing;
  }

  return prisma.maze.create({
    data: {
      name: SIMULATOR_MAZE_NAME,
      width: SIMULATOR_MAZE_SIZE,
      height: SIMULATOR_MAZE_SIZE,
    },
  });
};

/** Substitui as células do labirinto (usado no commit do TestView). */
export const replaceMazeCells = async (
  mazeId: string,
  cells: MazeCellWallInput[],
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    await tx.cell.deleteMany({ where: { mazeId } });

    if (cells.length === 0) return;

    await tx.cell.createMany({
      data: cells.map((cell) => ({
        mazeId,
        posX: cell.posX,
        posY: cell.posY,
        wallNorth: Boolean(cell.wallNorth),
        wallSouth: Boolean(cell.wallSouth),
        wallEast: Boolean(cell.wallEast),
        wallWest: Boolean(cell.wallWest),
      })),
    });
  });
};
