import type { Request, Response, NextFunction } from "express";
import {
  getRecentTelemetry,
  getTelemetryByIdService,
} from "../services/telemetry.service";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;

const parseLimit = (value: unknown): number => {
  if (typeof value !== "string") {
    return DEFAULT_LIMIT;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(parsed, 1), MAX_LIMIT);
};

export const listTelemetryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseLimit(req.query.limit);
    const items = await getRecentTelemetry(limit);
    res.json({ items, count: items.length });
  } catch (error) {
    next(error);
  }
};

export const getTelemetryByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const item = await getTelemetryByIdService(id);
    if (!item) {
      res.status(404).json({ message: "Telemetry not found" });
      return;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
};
