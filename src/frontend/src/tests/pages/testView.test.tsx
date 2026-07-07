import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

  it("deve sincronizar variáveis ao alterar coordenadas", async () => {
    const user = userEvent.setup();
    render(<TestView {...defaultProps} />);

    const [xInput] = screen.getAllByDisplayValue("0");
    await user.clear(xInput);
    await user.type(xInput, "3");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/telemetry/simulator/update",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("deve renderizar telemetria ativa quando robotData estiver disponível", () => {
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

    expect(screen.getByText(/"stepOrder": 2/)).toBeInTheDocument();
  });

  it("deve alternar paredes, sliders e forçar pulso de sincronização", async () => {
    const user = userEvent.setup();
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<TestView {...defaultProps} />);

    await user.click(screen.getByLabelText(/WALL_NORTH/i));
    await user.click(screen.getByLabelText(/WALL_WEST/i));

    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[0], { target: { value: "11.0" } });
    fireEvent.change(sliders[1], { target: { value: "15" } });
    fireEvent.change(sliders[2], { target: { value: "18" } });
    fireEvent.change(sliders[3], { target: { value: "22" } });

    await user.click(screen.getByText(/Forçar Pulso Instantâneo/i));

    expect(alertMock).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/telemetry/simulator/update",
      expect.objectContaining({ method: "POST" })
    );
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