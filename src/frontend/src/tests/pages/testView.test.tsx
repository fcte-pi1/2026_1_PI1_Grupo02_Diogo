import { render, screen, waitFor } from "@testing-library/react";
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
      json: async () => ({ status: "ok" }),
    });

    render(<TestView {...defaultProps} />);

    const startButton = screen.getByRole("button", { name: /start/i });
    await user.click(startButton);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/telemetry/simulator",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "start" }),
      }),
    );
  });

  it("mostra erro visível quando o backend estiver offline no Start", async () => {
    const user = userEvent.setup();
    render(<TestView {...defaultProps} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await user.click(screen.getByRole("button", { name: /start/i }));

    expect(await screen.findByTestId("simulator-action-error")).toHaveTextContent(
      /Backend offline/i,
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
    mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/simulator/status")) {
        return {
          ok: true,
          json: async () => ({ running: true, paused: false, stepOrder: 1 }),
        };
      }
      if (url.endsWith("/simulator") && init?.method === "POST") {
        return { ok: true, json: async () => ({ status: "ok" }) };
      }
      return {
        ok: true,
        json: async () => ({ running: true, paused: false, stepOrder: 1 }),
      };
    });

    render(<TestView {...defaultProps} />);

    const pauseButton = await screen.findByRole("button", { name: /^Pause$/i });
    await waitFor(() => expect(pauseButton).not.toBeDisabled());
    await user.click(pauseButton);
    await user.click(screen.getByRole("button", { name: /^Stop$/i }));

    expect(mockFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/telemetry/simulator",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "pause" }),
      }),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/telemetry/simulator",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "stop" }),
      }),
    );
  });

  it("deve sincronizar variáveis ao acionar o direcional do joystick", async () => {
    const user = userEvent.setup();
    render(<TestView {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /mover para leste/i }));

    expect(screen.getByTestId("joystick-position")).toHaveTextContent("8,7");
    expect(screen.getByTestId("maze-robot-cell")).toHaveAttribute(
      "title",
      "Robô em (8, 7)",
    );
  });

  it("não atravessa parede ao usar o joystick", async () => {
    const user = userEvent.setup();
    render(<TestView {...defaultProps} />);

    await user.click(
      screen.getByRole("button", { name: "Toggle east wall at (7, 7)" }),
    );
    expect(screen.getByTitle("Robô em (7, 7)")).toHaveAttribute(
      "data-wall-east",
      "true",
    );

    await user.click(screen.getByRole("button", { name: /mover para leste/i }));

    expect(screen.getByTestId("joystick-position")).toHaveTextContent("7,7");
    expect(screen.getByTestId("maze-robot-cell")).toHaveAttribute(
      "title",
      "Robô em (7, 7)",
    );
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
    expect(screen.getByTestId("maze-robot-cell")).toHaveAttribute(
      "title",
      "Robô em (7, 7)",
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