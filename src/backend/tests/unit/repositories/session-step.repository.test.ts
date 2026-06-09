jest.mock("../../../src/lib/prisma", () => ({
  prisma: {
    sessionStep: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

import { prisma } from "../../../src/lib/prisma";
import {
  countStepsInSession,
  createOrphanSessionStep,
  createSessionStep,
  findOrphanSteps,
  findOrphanStepsLimited,
  findStepsBySession,
  linkOrphanStepsToSession,
} from "../../../src/repositories/session-step.repository";

const createMock = prisma.sessionStep.create as jest.Mock;
const countMock = prisma.sessionStep.count as jest.Mock;
const findManyMock = prisma.sessionStep.findMany as jest.Mock;
const updateManyMock = prisma.sessionStep.updateMany as jest.Mock;

describe("session-step.repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates session step linked to session", async () => {
    createMock.mockResolvedValueOnce({ id: "step-1" });

    const result = await createSessionStep({
      sessionId: "session-1",
      stepOrder: 1,
      posX: 0,
      posY: 0,
      voltage: 11.5,
      current: 200,
    });

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ sessionId: "session-1" }),
    });
    expect(result).toEqual({ id: "step-1" });
  });

  it("creates orphan session step", async () => {
    createMock.mockResolvedValueOnce({ id: "step-orphan" });

    const result = await createOrphanSessionStep({
      stepOrder: 1,
      posX: 1,
      posY: 2,
      voltage: 11,
      current: 100,
    });

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ sessionId: null }),
    });
    expect(result).toEqual({ id: "step-orphan" });
  });

  it("counts steps in session", async () => {
    countMock.mockResolvedValueOnce(3);

    const result = await countStepsInSession("session-1");

    expect(result).toBe(3);
  });

  it("finds steps by session", async () => {
    findManyMock.mockResolvedValueOnce([{ id: "step-1" }]);

    const result = await findStepsBySession("session-1");

    expect(findManyMock).toHaveBeenCalledWith({
      where: { sessionId: "session-1" },
      orderBy: { stepOrder: "asc" },
    });
    expect(result).toEqual([{ id: "step-1" }]);
  });

  it("finds orphan steps", async () => {
    findManyMock.mockResolvedValueOnce([{ id: "step-1" }]);

    const result = await findOrphanSteps();

    expect(findManyMock).toHaveBeenCalledWith({
      where: { sessionId: null },
      orderBy: { stepOrder: "asc" },
    });
    expect(result).toEqual([{ id: "step-1" }]);
  });

  it("finds orphan steps with limit", async () => {
    findManyMock.mockResolvedValueOnce([{ id: "step-1" }]);

    const result = await findOrphanStepsLimited(5);

    expect(findManyMock).toHaveBeenCalledWith({
      where: { sessionId: null },
      orderBy: { stepOrder: "asc" },
      take: 5,
    });
    expect(result).toEqual([{ id: "step-1" }]);
  });

  it("links orphan steps to session", async () => {
    updateManyMock.mockResolvedValueOnce({ count: 2 });

    await linkOrphanStepsToSession("session-1");

    expect(updateManyMock).toHaveBeenCalledWith({
      where: { sessionId: null },
      data: { sessionId: "session-1" },
    });
  });
});
