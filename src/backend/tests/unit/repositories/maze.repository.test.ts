jest.mock("../../../src/lib/prisma", () => ({
  prisma: {
    maze: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    cell: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        cell: {
          deleteMany: jest.fn(),
          createMany: jest.fn(),
        },
      }),
    ),
  },
}));

import { prisma } from "../../../src/lib/prisma";
import {
  createDefaultMaze,
  createMazeSnapshot,
  findFirstMaze,
  findOrCreateDefaultMaze,
  findOrCreateSimulatorMaze,
  SIMULATOR_MAZE_NAME,
  SIMULATOR_MAZE_SIZE,
} from "../../../src/repositories/maze.repository";

const findFirstMock = prisma.maze.findFirst as jest.Mock;
const findUniqueMock = prisma.maze.findUnique as jest.Mock;
const createMock = prisma.maze.create as jest.Mock;
const updateMock = prisma.maze.update as jest.Mock;
const createManyCellsMock = prisma.cell.createMany as jest.Mock;

describe("maze.repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("findFirstMaze delegates to prisma", async () => {
    findFirstMock.mockResolvedValueOnce({ id: "maze-1" });

    const result = await findFirstMaze();

    expect(result).toEqual({ id: "maze-1" });
  });

  it("createDefaultMaze creates default maze", async () => {
    createMock.mockResolvedValueOnce({ id: "maze-new" });

    const result = await createDefaultMaze();

    expect(createMock).toHaveBeenCalledWith({
      data: { name: "Labirinto padrão", width: 16, height: 16 },
    });
    expect(result).toEqual({ id: "maze-new" });
  });

  it("findOrCreateDefaultMaze returns existing maze", async () => {
    findFirstMock.mockResolvedValueOnce({ id: "maze-1" });

    const result = await findOrCreateDefaultMaze();

    expect(result).toEqual({ id: "maze-1" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("findOrCreateDefaultMaze creates maze when none exists", async () => {
    findFirstMock.mockResolvedValueOnce(null);
    createMock.mockResolvedValueOnce({ id: "maze-new" });

    const result = await findOrCreateDefaultMaze();

    expect(result).toEqual({ id: "maze-new" });
    expect(createMock).toHaveBeenCalled();
  });

  it("findOrCreateSimulatorMaze creates 8x8 maze when missing", async () => {
    findFirstMock.mockResolvedValueOnce(null);
    createMock.mockResolvedValueOnce({
      id: "sim-maze",
      name: SIMULATOR_MAZE_NAME,
      width: SIMULATOR_MAZE_SIZE,
      height: SIMULATOR_MAZE_SIZE,
    });

    const result = await findOrCreateSimulatorMaze();

    expect(createMock).toHaveBeenCalledWith({
      data: {
        name: SIMULATOR_MAZE_NAME,
        width: SIMULATOR_MAZE_SIZE,
        height: SIMULATOR_MAZE_SIZE,
      },
    });
    expect(result.id).toBe("sim-maze");
  });

  it("findOrCreateSimulatorMaze corrects wrong dimensions", async () => {
    findFirstMock.mockResolvedValueOnce({
      id: "sim-maze",
      name: SIMULATOR_MAZE_NAME,
      width: 16,
      height: 16,
    });
    updateMock.mockResolvedValueOnce({
      id: "sim-maze",
      width: 8,
      height: 8,
    });

    const result = await findOrCreateSimulatorMaze();

    expect(updateMock).toHaveBeenCalled();
    expect(result.width).toBe(8);
  });

  it("createMazeSnapshot copies source cells into a new maze", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "source-maze",
      width: 8,
      height: 8,
      cells: [
        {
          posX: 0,
          posY: 0,
          wallNorth: true,
          wallSouth: false,
          wallEast: true,
          wallWest: false,
        },
      ],
    });
    createMock.mockResolvedValueOnce({ id: "snapshot-maze" });
    createManyCellsMock.mockResolvedValueOnce({ count: 1 });

    const snapshotId = await createMazeSnapshot(
      "source-maze",
      "Teste snapshot",
    );

    expect(snapshotId).toBe("snapshot-maze");
    expect(createMock).toHaveBeenCalledWith({
      data: {
        name: "Teste snapshot",
        width: 8,
        height: 8,
      },
    });
    expect(createManyCellsMock).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          mazeId: "snapshot-maze",
          posX: 0,
          posY: 0,
          wallNorth: true,
          wallEast: true,
        }),
      ],
    });
  });
});
