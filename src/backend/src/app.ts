import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { healthRouter } from "./routes/health.routes";
import { telemetryRouter } from "./routes/telemetry.routes";
import "./lib/mqtt"; 

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.cors.origin,
  })
);
app.use(express.json({ limit: "1mb" }));

app.use("/health", healthRouter);
app.use("/api/telemetry", telemetryRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ error: "internal_error" });
});

export { app };