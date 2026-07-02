jest.mock("../../../src/lib/prisma", () => ({
  prisma: {
    maze: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from "../../../src/lib/prisma";
import {
  createDefaultMaze,
  findFirstMaze,
  findOrCreateDefaultMaze,
} from "../../../src/repositories/maze.repository";

const findFirstMock = prisma.maze.findFirst as jest.Mock;
const createMock = prisma.maze.create as jest.Mock;

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
});
