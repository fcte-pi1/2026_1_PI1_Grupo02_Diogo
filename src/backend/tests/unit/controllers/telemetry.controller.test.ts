import {
  getTelemetryByIdHandler,
  listTelemetryHandler
} from "../../../src/controllers/telemetry.controller";
import {
  createMockNext,
  createMockRequest,
  createMockResponse
} from "../../helpers/express";
import * as telemetryServiceMock from "../../mocks/telemetry.service";

jest.mock("../../../src/services/telemetry.service", () =>
  require("../../mocks/telemetry.service")
);

describe("telemetry.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listTelemetryHandler", () => {
    it("uses default limit when not provided", async () => {
      // Arrange
      const req = createMockRequest({ query: {} });
      const res = createMockResponse();
      const next = createMockNext();
      const items = [{ id: "a" }];

      telemetryServiceMock.getRecentTelemetry.mockResolvedValueOnce(items);

      // Act
      await listTelemetryHandler(req, res, next);

      // Assert
      expect(telemetryServiceMock.getRecentTelemetry).toHaveBeenCalledWith(100);
      expect(res.json).toHaveBeenCalledWith({ items, count: 1 });
      expect(next).not.toHaveBeenCalled();
    });

    it("clamps limit to max", async () => {
      // Arrange
      const req = createMockRequest({ query: { limit: "5000" } });
      const res = createMockResponse();
      const next = createMockNext();
      const items = [{ id: "a" }, { id: "b" }];

      telemetryServiceMock.getRecentTelemetry.mockResolvedValueOnce(items);

      // Act
      await listTelemetryHandler(req, res, next);

      // Assert
      expect(telemetryServiceMock.getRecentTelemetry).toHaveBeenCalledWith(1000);
      expect(res.json).toHaveBeenCalledWith({ items, count: 2 });
      expect(next).not.toHaveBeenCalled();
    });

    it("falls back to default limit on invalid input", async () => {
      // Arrange
      const req = createMockRequest({ query: { limit: "abc" } });
      const res = createMockResponse();
      const next = createMockNext();
      const items = [{ id: "a" }];

      telemetryServiceMock.getRecentTelemetry.mockResolvedValueOnce(items);

      // Act
      await listTelemetryHandler(req, res, next);

      // Assert
      expect(telemetryServiceMock.getRecentTelemetry).toHaveBeenCalledWith(100);
      expect(res.json).toHaveBeenCalledWith({ items, count: 1 });
      expect(next).not.toHaveBeenCalled();
    });

    it("calls next on error", async () => {
      // Arrange
      const req = createMockRequest({ query: {} });
      const res = createMockResponse();
      const next = createMockNext();
      const error = new Error("boom");

      telemetryServiceMock.getRecentTelemetry.mockRejectedValueOnce(error);

      // Act
      await listTelemetryHandler(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getTelemetryByIdHandler", () => {
    it("returns the item when found", async () => {
      // Arrange
      const req = createMockRequest({ params: { id: "abc" } });
      const res = createMockResponse();
      const next = createMockNext();
      const item = { id: "abc" };

      telemetryServiceMock.getTelemetryByIdService.mockResolvedValueOnce(item);

      // Act
      await getTelemetryByIdHandler(req, res, next);

      // Assert
      expect(telemetryServiceMock.getTelemetryByIdService).toHaveBeenCalledWith("abc");
      expect(res.json).toHaveBeenCalledWith(item);
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 404 when not found", async () => {
      // Arrange
      const req = createMockRequest({ params: { id: "missing" } });
      const res = createMockResponse();
      const next = createMockNext();

      telemetryServiceMock.getTelemetryByIdService.mockResolvedValueOnce(null);

      // Act
      await getTelemetryByIdHandler(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Telemetry not found" });
      expect(next).not.toHaveBeenCalled();
    });

    it("calls next on error", async () => {
      // Arrange
      const req = createMockRequest({ params: { id: "abc" } });
      const res = createMockResponse();
      const next = createMockNext();
      const error = new Error("boom");

      telemetryServiceMock.getTelemetryByIdService.mockRejectedValueOnce(error);

      // Act
      await getTelemetryByIdHandler(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
