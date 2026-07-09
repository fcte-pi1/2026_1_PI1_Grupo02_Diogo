import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashboardScreen from "../../features/telemetry/DashboardScreen";

const activeSession = {
  sessionName: "Telemetria",
  algorithm: "DFS",
  mode: "Cockpit",
};

describe("DashboardScreen Component", () => {
  it("renderiza widgets com valores zerados sem telemetria", () => {
    render(
      <DashboardScreen
        activeSession={activeSession}
        currentView="dashboard"
        connectionProps={{ latency: "0" }}
        robotData={null}
        isConnected
      />
    );

    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("battery-voltage")).toHaveTextContent("0V");
    expect(screen.getByTestId("maze-coords")).toHaveTextContent("COORDS: X-7, Y-7");
  });

  it("atualiza widgets com dados de telemetria", () => {
    render(
      <DashboardScreen
        activeSession={activeSession}
        currentView="dashboard"
        connectionProps={{ latency: "11.5" }}
        isConnected
        robotData={{
          id: "step-1",
          sessionId: "sess-1",
          timestamp: "2026-01-15T10:00:00.000Z",
          stepOrder: 2,
          posX: 0,
          posY: 0,
          voltage: 11.5,
          current: 300,
          direcao: "leste",
          walls: { north: false, south: true, east: false, west: true },
        }}
      />
    );

    expect(screen.getByTestId("battery-voltage")).toHaveTextContent("11.5V");
    expect(screen.getByTestId("maze-coords")).toHaveTextContent("COORDS: X-0, Y-0");
    expect(screen.getByTestId("sensor-right-label")).toHaveTextContent("PAREDE");
  });
});