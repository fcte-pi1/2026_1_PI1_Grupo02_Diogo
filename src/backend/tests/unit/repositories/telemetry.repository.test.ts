jest.mock("../../../src/lib/prisma", () => ({
  prisma: {
    telemetryRaw: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from "../../../src/lib/prisma";
import {
  createTelemetry,
  getTelemetryById,
  listTelemetry,
} from "../../../src/repositories/telemetry.repository";

const createMock = prisma.telemetryRaw.create as jest.Mock;
const findManyMock = prisma.telemetryRaw.findMany as jest.Mock;
const findUniqueMock = prisma.telemetryRaw.findUnique as jest.Mock;

describe("telemetry.repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates telemetry raw record", async () => {
    createMock.mockResolvedValueOnce({ id: "raw-1" });

    const result = await createTelemetry({
      topic: "rato/telemetria",
      payload: { step: 1 },
    });

    expect(createMock).toHaveBeenCalled();
    expect(result).toEqual({ id: "raw-1" });
  });

  it("lists telemetry ordered by createdAt desc", async () => {
    findManyMock.mockResolvedValueOnce([{ id: "raw-1" }]);

    const result = await listTelemetry(20);

    expect(findManyMock).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    expect(result).toEqual([{ id: "raw-1" }]);
  });

  it("gets telemetry by id", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: "raw-1" });

    const result = await getTelemetryById("raw-1");

    expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: "raw-1" } });
    expect(result).toEqual({ id: "raw-1" });
  });
});
