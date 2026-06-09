import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VisualizeDiv } from "../../components/VisualizeDiv";

const baseProps = {
  activeSession: {
    sessionName: "Missão E2E",
    algorithm: "DFS",
    mode: "Cockpit",
  },
  connectionProps: { latency: "42" },
};

describe("VisualizeDiv", () => {
  it("exibe coordenadas no dashboard", () => {
    render(
      <VisualizeDiv
        {...baseProps}
        currentView="dashboard"
        isConnected
        posX={3}
        posY={4}
      />
    );

    expect(screen.getByTestId("maze-coords")).toHaveTextContent("COORDS: X-3, Y-4");
    expect(screen.getByText(/LABIRINTO CENTRAL/i)).toBeInTheDocument();
  });

  it("exibe topologia online na aba network", () => {
    render(
      <VisualizeDiv
        {...baseProps}
        currentView="network"
        isConnected
        posX={0}
        posY={0}
      />
    );

    expect(screen.getByText("online")).toBeInTheDocument();
    expect(screen.getByText("UAV-MOUSE-01")).toBeInTheDocument();
  });

  it("exibe topologia offline quando desconectado", () => {
    render(
      <VisualizeDiv
        {...baseProps}
        currentView="network"
        isConnected={false}
        posX={0}
        posY={0}
      />
    );

    expect(screen.getByText("offline")).toBeInTheDocument();
  });
});
