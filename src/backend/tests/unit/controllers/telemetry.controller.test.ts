import {
  getTelemetryByIdHandler,
  listTelemetryHandler
} from "../../../src/controllers/telemetry.controller";
import {
  createMockRequest,
  createMockResponse
} from "../../helpers/express";
import * as telemetryServiceMock from "../../mocks/telemetry.service";

jest.mock("../../../src/services/telemetry.service", () =>
  require("../../mocks/telemetry.service")
);

describe("telemetry.controller", () => {
  // Criamos uma função mock para o next do Express que será usada nos testes por ID
  const nextMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    nextMock.mockClear();
  });

  describe("listTelemetryHandler", () => {
    it("uses default limit (50) when not provided or invalid", async () => {
      // Arrange - Testa o fallback '|| 50' do controller
      const req = createMockRequest({ query: {} });
      const res = createMockResponse();
      const items = [{ id: "a" }];

      telemetryServiceMock.getRecentTelemetry.mockResolvedValueOnce(items);

      // Act
      await listTelemetryHandler(req, res);

      // Assert - O controller atual usa 50 como fallback padrão
      expect(telemetryServiceMock.getRecentTelemetry).toHaveBeenCalledWith(50);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ items, count: 1 });
    });

    it("passes the custom limit directly when valid", async () => {
      // Arrange - Testa se o Number(req.query.limit) funciona
      const req = createMockRequest({ query: { limit: "150" } });
      const res = createMockResponse();
      const items = new Array(150).fill({ id: "x" });

      telemetryServiceMock.getRecentTelemetry.mockResolvedValueOnce(items);

      // Act
      await listTelemetryHandler(req, res);

      // Assert
      expect(telemetryServiceMock.getRecentTelemetry).toHaveBeenCalledWith(150);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ items, count: 150 });
    });

    it("returns 500 internal_error on service rejection", async () => {
      // Arrange - O controller atual captura o erro e responde com status 500
      const req = createMockRequest({ query: {} });
      const res = createMockResponse();
      const error = new Error("db_boom");

      // Silencia o console.error no terminal do Jest para manter o log limpo
      jest.spyOn(console, "error").mockImplementationOnce(() => {});
      telemetryServiceMock.getRecentTelemetry.mockRejectedValueOnce(error);

      // Act
      await listTelemetryHandler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "internal_error" });
    });
  });

  describe("getTelemetryByIdHandler", () => {
    it("returns the item when found", async () => {
      // Arrange
      const req = createMockRequest({ params: { id: "abc" } });
      const res = createMockResponse();
      const item = { id: "abc" };

      telemetryServiceMock.getTelemetryByIdService.mockResolvedValueOnce(item);

      // Act
      await getTelemetryByIdHandler(req, res, nextMock);

      // Assert
      expect(telemetryServiceMock.getTelemetryByIdService).toHaveBeenCalledWith("abc");
      expect(res.json).toHaveBeenCalledWith(item);
      expect(nextMock).not.toHaveBeenCalled();
    });

    it("returns 404 when not found", async () => {
      // Arrange
      const req = createMockRequest({ params: { id: "missing" } });
      const res = createMockResponse();

      telemetryServiceMock.getTelemetryByIdService.mockResolvedValueOnce(null);

      // Act
      await getTelemetryByIdHandler(req, res, nextMock);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Telemetry not found" });
      expect(nextMock).not.toHaveBeenCalled();
    });

    it("calls next on error", async () => {
      // Arrange
      const req = createMockRequest({ params: { id: "abc" } });
      const res = createMockResponse();
      const error = new Error("boom");

      telemetryServiceMock.getTelemetryByIdService.mockRejectedValueOnce(error);

      // Act
      await getTelemetryByIdHandler(req, res, nextMock);

      // Assert - Como esse handler tem a assinatura (req, res, next), ele chama o next
      expect(nextMock).toHaveBeenCalledWith(error);
    });
  });
});