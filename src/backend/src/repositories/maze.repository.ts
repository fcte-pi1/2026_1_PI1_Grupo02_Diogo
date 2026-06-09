import type { Maze } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const findFirstMaze = async (): Promise<Maze | null> =>
  prisma.maze.findFirst();

export const createDefaultMaze = async (): Promise<Maze> =>
  prisma.maze.create({
    data: { name: "Labirinto padrão", width: 16, height: 16 },
  });

export const findOrCreateDefaultMaze = async (): Promise<Maze> => {
  const existing = await findFirstMaze();
  return existing ?? createDefaultMaze();
};
