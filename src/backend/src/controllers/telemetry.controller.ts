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

export async function listTelemetryHandler(req: Request, res: Response) {
  try {
    const limit = Number(req.query.limit) || 50;
    
    // 🔍 Chama o service para buscar os dados brutos salvos na tabela TelemetryRaw
    const items = await getRecentTelemetry(limit);

    // Retorna no formato exato que o seu front/navegador está esperando!
    return res.status(200).json({
      items: items,
      count: items.length
    });
  } catch (error) {
    console.error("Erro no listTelemetryHandler:", error);
    return res.status(500).json({ error: "internal_error" });
  }
}

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
