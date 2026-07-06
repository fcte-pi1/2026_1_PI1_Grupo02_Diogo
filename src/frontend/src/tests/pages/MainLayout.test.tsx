import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppState } from "../../App";
import MainLayout from "../../features/main/MainLayout";

const robotData = {
  id: "step-1",
  sessionId: "sess-1",
  timestamp: "2026-01-15T10:00:00.000Z",
  stepOrder: 1,
  posX: 2,
  posY: 1,
  voltage: 11.2,
  current: 150,
};

vi.mock("../../hooks/useWebSocket", () => ({
  useWebSocket: () => ({
    robotData,
    sessionSteps: [],
    isConnected: true,
    sendRaceAction: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ running: false, paused: false, stepOrder: 0 }),
});
vi.stubGlobal("fetch", mockFetch);

vi.mock("../../api/sessions", () => ({
  listSessions: vi.fn().mockResolvedValue({ items: [], count: 0 }),
  getSessionById: vi.fn(),
  deleteSession: vi.fn(),
}));

describe("MainLayout", () => {
  const activeSession = {
    sessionName: "Telemetria em Tempo Real",
    algorithm: "DFS",
    mode: "Cockpit",
  };

  it("renderiza dashboard com telemetria do hook", () => {
    render(<MainLayout activeSession={activeSession} appState={AppState.RUNNING} />);

    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("battery-voltage")).toHaveTextContent("11.2V");
    expect(screen.getByText(/PASSO #1/)).toBeInTheDocument();
  });

  it("navega para histórico pela sidebar", async () => {
    const user = userEvent.setup();
    render(<MainLayout activeSession={activeSession} appState={AppState.RUNNING} />);

    const navButtons = screen.getAllByRole("button");
    const historyNav = navButtons.find((button) =>
      button.textContent?.includes("Histórico de sessões")
    );
    expect(historyNav).toBeTruthy();
    await user.click(historyNav!);

    expect(
      screen.getByText("Corridas consolidadas salvas no banco de dados.")
    ).toBeInTheDocument();
  });

  it("navega para conexão e área de testes", async () => {
    const user = userEvent.setup();
    render(<MainLayout activeSession={activeSession} appState={AppState.RUNNING} />);

    await user.click(screen.getByText("Conexão"));
    expect(screen.getByText("OFFLINE")).toBeInTheDocument();

    await user.click(screen.getByText("Área de testes"));
    expect(screen.getByText("LOOP DE REPRODUÇÃO:")).toBeInTheDocument();
  });

  it("fecha o terminal pelo botão de fechar", async () => {
    const user = userEvent.setup();
    render(<MainLayout activeSession={activeSession} appState={AppState.RUNNING} />);

    await user.click(screen.getByTitle("Fechar terminal"));

    expect(screen.queryByTitle("Fechar terminal")).not.toBeInTheDocument();
  });
});
