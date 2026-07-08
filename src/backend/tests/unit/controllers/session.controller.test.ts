import {
  deleteSessionHandler,
  getSessionByIdHandler,
  listSessionsHandler,
} from "../../../src/controllers/session.controller";
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
} from "../../helpers/express";
import * as sessionServiceMock from "../../mocks/session.service";

jest.mock("../../../src/services/session.service", () =>
  require("../../mocks/session.service")
);

describe("session.controller", () => {
  const nextMock = createMockNext();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listSessionsHandler", () => {
    it("returns sessions list", async () => {
      const sessions = [{ id: "s1", name: "Test" }];
      sessionServiceMock.listSessionMetadata.mockResolvedValueOnce(sessions);
      const res = createMockResponse();

      await listSessionsHandler(createMockRequest(), res, nextMock);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ items: sessions, count: 1 });
    });

    it("returns empty list when there are no sessions", async () => {
      sessionServiceMock.listSessionMetadata.mockResolvedValueOnce([]);
      const res = createMockResponse();

      await listSessionsHandler(createMockRequest(), res, nextMock);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ items: [], count: 0 });
    });

    it("calls next on error", async () => {
      const error = new Error("db_error");
      sessionServiceMock.listSessionMetadata.mockRejectedValueOnce(error);
      const res = createMockResponse();

      await listSessionsHandler(createMockRequest(), res, nextMock);

      expect(nextMock).toHaveBeenCalledWith(error);
    });
  });

  describe("getSessionByIdHandler", () => {
    it("returns 400 for invalid uuid", async () => {
      const res = createMockResponse();
      const req = createMockRequest({ params: { id: "not-a-uuid" } });

      await getSessionByIdHandler(req, res, nextMock);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "invalid_id" });
    });

    it("returns 404 when session not found", async () => {
      const res = createMockResponse();
      const req = createMockRequest({
        params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      });
      sessionServiceMock.getSessionDetail.mockResolvedValueOnce(null);

      await getSessionByIdHandler(req, res, nextMock);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "session_not_found" });
    });

    it("returns session detail when found", async () => {
      const session = { id: "550e8400-e29b-41d4-a716-446655440000", steps: [] };
      const res = createMockResponse();
      const req = createMockRequest({
        params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      });
      sessionServiceMock.getSessionDetail.mockResolvedValueOnce(session);

      await getSessionByIdHandler(req, res, nextMock);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(session);
    });

    it("calls next on error", async () => {
      const error = new Error("db_error");
      const res = createMockResponse();
      const req = createMockRequest({
        params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      });
      sessionServiceMock.getSessionDetail.mockRejectedValueOnce(error);

      await getSessionByIdHandler(req, res, nextMock);

      expect(nextMock).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteSessionHandler", () => {
    it("returns 400 for invalid uuid", async () => {
      const res = createMockResponse();
      const req = createMockRequest({ params: { id: "invalid" } });

      await deleteSessionHandler(req, res, nextMock);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "invalid_id" });
    });

    it("returns 404 when session does not exist", async () => {
      const res = createMockResponse();
      const req = createMockRequest({
        params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      });
      sessionServiceMock.deleteSession.mockResolvedValueOnce(false);

      await deleteSessionHandler(req, res, nextMock);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "session_not_found" });
    });

    it("returns 204 when session is deleted", async () => {
      const res = createMockResponse();
      const req = createMockRequest({
        params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      });
      sessionServiceMock.deleteSession.mockResolvedValueOnce(true);

      await deleteSessionHandler(req, res, nextMock);

      expect(res.sendStatus).toHaveBeenCalledWith(204);
    });

    it("calls next on error", async () => {
      const error = new Error("db_error");
      const res = createMockResponse();
      const req = createMockRequest({
        params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      });
      sessionServiceMock.deleteSession.mockRejectedValueOnce(error);

      await deleteSessionHandler(req, res, nextMock);

      expect(nextMock).toHaveBeenCalledWith(error);
    });
  });
});
