import type { NextFunction, Request, Response } from "express";
import {
  deleteSession,
  getSessionDetail,
  listSessionMetadata,
} from "../services/session.service";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value: string): boolean => UUID_REGEX.test(value);

export const listSessionsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessions = await listSessionMetadata();
    res.status(200).json({ items: sessions, count: sessions.length });
  } catch (error) {
    next(error);
  }
};

export const getSessionByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      res.status(400).json({ error: "invalid_id" });
      return;
    }

    const session = await getSessionDetail(id);

    if (!session) {
      res.status(404).json({ error: "session_not_found" });
      return;
    }

    res.status(200).json(session);
  } catch (error) {
    next(error);
  }
};

export const deleteSessionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      res.status(400).json({ error: "invalid_id" });
      return;
    }

    const deleted = await deleteSession(id);

    if (!deleted) {
      res.status(404).json({ error: "session_not_found" });
      return;
    }

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
