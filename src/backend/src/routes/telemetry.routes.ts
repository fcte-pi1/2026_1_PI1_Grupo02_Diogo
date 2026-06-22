import { Router } from "express";
import {
  getTelemetryByIdHandler,
  listTelemetryHandler,
} from "../controllers/telemetry.controller";
import { 
  startSimulator, 
  pauseSimulator, 
  stopSimulator, 
  getSimulatorStatus, 
  updateSimulatorConfig 
} from "../services/simulator.service";

const router = Router();

// rotas originais de telemetria
router.get("/", listTelemetryHandler);
router.get("/:id", getTelemetryByIdHandler);

// rotas para testes (Start, Pause, Stop)
router.post("/simulator", (req, res) => {
  const { action } = req.body;

  if (action === "start") {
    startSimulator();
    const status = getSimulatorStatus();
    return res.json({ message: "Simulador iniciado/retomado.", running: status.running, paused: status.paused });
  }

  if (action === "pause") {
    pauseSimulator();
    const status = getSimulatorStatus();
    return res.json({ message: "Simulador pausado.", running: status.running, paused: status.paused });
  }

  if (action === "stop") {
    stopSimulator();
    return res.json({ message: "Simulador parado e zerado.", running: false, paused: false });
  }

  return res.status(400).json({ error: "Ação inválida. Use 'start', 'pause' ou 'stop'." });
});

// 🚀 NOVA ROTA: Recebe as atualizações em tempo real dos sliders/inputs do frontend
router.post("/simulator/update", (req, res) => {
  updateSimulatorConfig(req.body);
  return res.json({ message: "Variáveis do barramento atualizadas.", config: getSimulatorStatus().config });
});

// status de teste - retorna o objeto completo (running, paused e stepOrder)
router.get("/simulator/status", (_req, res) => {
  const status = getSimulatorStatus();
  return res.json({
    running: status.running,
    paused: status.paused,
    stepOrder: status.stepOrder
  });
});

export { router as telemetryRouter };