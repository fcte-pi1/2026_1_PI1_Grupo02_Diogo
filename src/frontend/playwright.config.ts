import { defineConfig, devices } from "@playwright/test";

// Instala navegadores em node_modules (evita depender do cache global do sistema)
process.env.PLAYWRIGHT_BROWSERS_PATH ??= "0";

const WS_PORT = process.env.E2E_WS_PORT ?? "3001";
const APP_PORT = process.env.E2E_APP_PORT ?? "5173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Um worker: o mock WebSocket emite para todos os clientes conectados.
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: `node e2e/mock-ws-server.mjs`,
      url: `http://localhost:${WS_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      env: { E2E_WS_PORT: WS_PORT },
    },
    {
      command: `npm run dev -- --port ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}`,
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_WS_URL: `http://localhost:${WS_PORT}`,
      },
    },
  ],
});
