import type { Page } from "@playwright/test";

const LOADING_MS = 2500;

export async function openDashboard(page: Page): Promise<void> {
  await page.goto("/");
  await page
    .getByTestId("dashboard")
    .waitFor({ state: "visible", timeout: LOADING_MS + 3000 });
  // Garante que o Socket.io conectou antes de injetar telemetria no mock.
  await page.getByText("ONLINE").waitFor({ state: "visible", timeout: 5000 });
}
