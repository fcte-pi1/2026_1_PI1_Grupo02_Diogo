import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashboardScreen from "../../features/telemetry/DashboardScreen";

const activeSession = {
  sessionName: "Telemetria",
  algorithm: "DFS",
  mode: "Cockpit",
};

describe("DashboardScreen", () => {
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
    expect(screen.getByTestId("maze-coords")).toHaveTextContent("COORDS: X-0, Y-0");
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
          posX: 1,
          posY: 2,
          voltage: 11.5,
          current: 300,
        }}
      />
    );

    expect(screen.getByTestId("battery-voltage")).toHaveTextContent("11.5V");
    expect(screen.getByTestId("maze-coords")).toHaveTextContent("COORDS: X-1, Y-2");
    expect(screen.getByTestId("race-timer-status")).toHaveTextContent("ACTIVE");
    expect(screen.getByText("300 mA")).toBeInTheDocument();
  });
});
