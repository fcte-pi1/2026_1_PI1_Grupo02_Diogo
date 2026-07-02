import { validateTelemetryPayloadMiddleware } from "../../../src/middlewares/telemetry-validation.middleware";
import { createValidTelemetryPayload } from "../../helpers/telemetry.factory";
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
} from "../../helpers/express";

describe("validateTelemetryPayloadMiddleware", () => {
  const nextMock = createMockNext();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls next and replaces body when payload is valid", () => {
    const payload = createValidTelemetryPayload();
    const req = createMockRequest({ body: payload });
    const res = createMockResponse();

    validateTelemetryPayloadMiddleware(req, res, nextMock);

    expect(nextMock).toHaveBeenCalled();
    expect(req.body).toEqual(payload);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 400 when payload is invalid", () => {
    const req = createMockRequest({ body: { step: 1 } });
    const res = createMockResponse();

    validateTelemetryPayloadMiddleware(req, res, nextMock);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "invalid_payload",
        details: expect.any(Array),
      })
    );
    expect(nextMock).not.toHaveBeenCalled();
  });
});
