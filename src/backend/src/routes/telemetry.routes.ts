import { Router } from "express";
import {
  getTelemetryByIdHandler,
  listTelemetryHandler,
} from "../controllers/telemetry.controller";
import {
  startSimulator,
  pauseSimulator,
  stopSimulator,
  resetSimulator,
  getSimulatorStatus,
  updateSimulatorConfig,
  commitSimulatorSession,
} from "../services/simulator.service";
import { storeTelemetry } from "../services/telemetry.service";

const router = Router();

// rotas originais de telemetria
router.get("/", listTelemetryHandler);
router.get("/simulator/status", (_req, res) => {
  return res.json(getSimulatorStatus());
});
router.get("/:id", getTelemetryByIdHandler);

// rotas para testes (Start, Pause, Stop, Reset)
router.post("/simulator/update", (req, res) => {
  const config = req.body ?? {};
  updateSimulatorConfig(config);

  return res.json({
    message: "Variáveis do barramento atualizadas.",
    config: getSimulatorStatus().config,
  });
});

router.post("/simulator", async (req, res) => {
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

  // Zera a memória do simulador no backend e apaga passos órfãos
  if (action === "reset") {
    await resetSimulator();
    return res.json({
      message: "Simulador resetado e labirinto limpo.",
      running: false,
      paused: false,
    });
  }

  if (action === "commit") {
    const { mazeCells, sessionName } = req.body ?? {};
    const sessionId = await commitSimulatorSession({
      mazeCells: Array.isArray(mazeCells) ? mazeCells : undefined,
      sessionName: typeof sessionName === "string" ? sessionName : undefined,
    });
    return res.json({ message: "Sessão consolidada no histórico.", sessionId, running: false, paused: false });
  }

  return res.status(400).json({ error: "Ação inválida. Use 'start', 'pause', 'stop', 'reset' ou 'commit'." });
});

router.post("/ingest-mock", async (req, res) => {
  try {
    const payloadBuffer = Buffer.from(JSON.stringify(req.body));
    // Chama a função que processa o payload como se fosse o MQTT/ESP32 real
    const result = await storeTelemetry("telemetry/esp32/test", payloadBuffer);
    return res.status(201).json({ message: "Payload injetado com sucesso", data: result });
  } catch (error) {
    console.error("Erro na ingestão mock:", error);
    return res.status(500).json({ error: "Falha ao processar payload mock" });
  }
});
export { router as telemetryRouter };