import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { healthRouter } from "./routes/health.routes";
import { sessionRouter } from "./routes/session.routes";
import { telemetryRouter } from "./routes/telemetry.routes";

const app = express();

// Configura o Helmet sem bloquear requisições de upgrade de protocolo locais no Firefox em dev
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, 
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.use("/health", healthRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/telemetry", telemetryRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ error: "internal_error" });
});

export { app };