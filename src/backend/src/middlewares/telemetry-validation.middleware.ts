import type { Request, Response, NextFunction } from "express";
import { validateTelemetryPayload } from "../dtos/telemetry.dto";

export const validateTelemetryPayloadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const validation = validateTelemetryPayload(req.body);

  if (!validation.isValid) {
    res.status(400).json({
      error: "invalid_payload",
      details: validation.errors,
    });
    return;
  }

  req.body = validation.payload;
  next();
};
