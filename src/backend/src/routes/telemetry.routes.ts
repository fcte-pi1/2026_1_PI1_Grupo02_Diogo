import { Router } from "express";
import {
  getTelemetryByIdHandler,
  listTelemetryHandler,
} from "../controllers/telemetry.controller";

const router = Router();

router.get("/", listTelemetryHandler);
router.get("/:id", getTelemetryByIdHandler);

export { router as telemetryRouter };
