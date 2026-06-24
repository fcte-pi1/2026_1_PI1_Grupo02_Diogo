import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TestView from "../../features/tests/testView";

// Configuração estrita do Mock Global do Fetch para o Polling e Post do simulador
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ running: false, paused: false, stepOrder: 0 }),
});
vi.stubGlobal("fetch", mockFetch);

// Mock apenas do VisualizeDiv para isolar o container do labirinto gráfico complexo
vi.mock("../../components/VisualizeDiv", () => ({
  VisualizeDiv: () => <div data-testid="mock-visualize">Visualize Div</div>,
}));

describe("TestView Component", () => {
  const defaultProps = {
    robotData: null,
    sessionSteps: [],
    isConnected: false,
  };

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ running: false, paused: false, stepOrder: 0 }),
    });
  });

  it("deve renderizar os controles de fluxo e os painéis de telemetria espelhados", () => {
    render(<TestView {...defaultProps} />);

    // Valida os blocos lógicos principais do painel esquerdo
    expect(screen.getByText("LOOP DE REPRODUÇÃO:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
    
    // Valida o mapa mockado
    expect(screen.getByTestId("mock-visualize")).toBeInTheDocument();

    // 🚀 VALIDAÇÃO REAL: Agora validamos o SensorGrid real pelo cabeçalho de acessibilidade nativo dele!
    expect(screen.getByText("Sensores de proximidade")).toBeInTheDocument();
  });

  it("deve acionar as chamadas de rota HTTP correspondentes ao disparar comandos de fluxo", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({ 
      ok: true,
      json: async () => ({ status: "ok" }) 
    });

    render(<TestView {...defaultProps} />);

    const startButton = screen.getByRole("button", { name: /start/i });
    await user.click(startButton);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/telemetry/simulator",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "start" }),
      })
    );
  });

  it("deve injetar fallbacks visuais se não houver payload ativo trafegando no WebSocket", () => {
    render(<TestView {...defaultProps} robotData={null} />);
    expect(screen.getByText("Aguardando tráfego...")).toBeInTheDocument();
  });
});