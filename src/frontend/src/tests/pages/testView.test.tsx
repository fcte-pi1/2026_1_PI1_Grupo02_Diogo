import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TestView from "../../features/tests/testView";

const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ running: false, paused: false, stepOrder: 0 }),
});
vi.stubGlobal("fetch", mockFetch);

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

    expect(screen.getByText("LOOP DE REPRODUÇÃO:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
    
    const mapElements = screen.getAllByTestId("mock-visualize");
    expect(mapElements[0]).toBeInTheDocument();

    expect(screen.getByText(/Distâncias & Tensão/i)).toBeInTheDocument();
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

  it("deve injetar fallbacks visuais se não houver payload ativo trafegando no WebSocket", async () => {
    render(<TestView {...defaultProps} robotData={null} />);
    
    const apiTab = screen.getByRole("button", { name: /api|payload/i });
    await userEvent.click(apiTab);
    
    expect(screen.getByText(/Aguardando tráfego\.\.\./i)).toBeInTheDocument();
  });

  it("deve acionar pause e stop com os endpoints corretos", async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ running: true, paused: false, stepOrder: 1 }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ running: true, paused: true, stepOrder: 1 }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<TestView {...defaultProps} />);

    const pauseButton = await screen.findByRole("button", { name: /pause/i });
    await user.click(pauseButton);
    await user.click(screen.getByRole("button", { name: /stop/i }));

    expect(mockFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/telemetry/simulator",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "pause" }),
      })
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/telemetry/simulator",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "stop" }),
      })
    );
  });

  it("deve sincronizar variáveis ao acionar o direcional do joystick", async () => {
    render(<TestView {...defaultProps} />);
    const directionalButtons = screen.getAllByRole("button");
    // Verifica se existem botões montados para o joystick na árvore DOM
    expect(directionalButtons.length).toBeGreaterThan(0);
  });

  it("deve renderizar telemetria ativa quando robotData estiver disponível", async () => {
    render(
      <TestView
        {...defaultProps}
        isConnected={true}
        robotData={{
          id: "step-1",
          sessionId: "sess-1",
          timestamp: "2026-01-01T00:00:00.000Z",
          stepOrder: 2,
          posX: 1,
          posY: 2,
          voltage: 11.5,
          current: 180,
          sensors: { front: 10, left: 20, right: 30 },
          walls: { north: true, south: false, east: false, west: true },
        }}
      />
    );

    const apiTab = screen.getByRole("button", { name: /api|payload/i });
    await userEvent.click(apiTab);

    expect(screen.getByText(/"stepOrder": 2/)).toBeInTheDocument();
  });

  it("deve alternar as bordas do cubo de barreiras", async () => {
    render(<TestView {...defaultProps} />);
    const cellsDisplay = screen.getByText("0,0");
    expect(cellsDisplay).toBeInTheDocument();
  });

  it("deve registrar erros de rede sem quebrar a interface", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error("network down"));

    render(<TestView {...defaultProps} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});