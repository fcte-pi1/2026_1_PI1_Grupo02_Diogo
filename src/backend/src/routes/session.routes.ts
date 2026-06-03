import { Router } from "express";
import {
  deleteSessionHandler,
  getSessionByIdHandler,
  listSessionsHandler,
} from "../controllers/session.controller";

const router = Router();

router.get("/", listSessionsHandler);
router.get("/:id", getSessionByIdHandler);
router.delete("/:id", deleteSessionHandler);

export { router as sessionRouter };
