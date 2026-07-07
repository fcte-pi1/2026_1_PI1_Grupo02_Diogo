import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { AppState } from "../../App";
import MainLayout from "../../features/main/MainLayout";

vi.mock("../../components/Sidebar", () => ({
  default: ({ onNavigate }: { onNavigate?: (view: string) => void }) => (
    <button type="button" onClick={() => onNavigate?.("desconhecida")}>
      Ir para view inválida
    </button>
  ),
}));

vi.mock("../../hooks/useWebSocket", () => ({
  useWebSocket: () => ({
    robotData: null,
    sessionSteps: [],
    isConnected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ status: "ok" }),
});
vi.stubGlobal("fetch", mockFetch);

describe("MainLayout fallback view", () => {
  it("mostra mensagem quando a view não existe", async () => {
    const user = userEvent.setup();

    render(
      <MainLayout
        activeSession={{
          sessionName: "Sessão",
          algorithm: "DFS",
          mode: "Teste",
        }}
        appState={AppState.RUNNING}
      />
    );

    await user.click(screen.getByText("Ir para view inválida"));

    expect(
      screen.getByText(/Aba não encontrada ou não implementada/i)
    ).toBeInTheDocument();
  });
});
