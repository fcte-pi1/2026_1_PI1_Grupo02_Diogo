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
    expect(screen.getByTestId("maze-grid")).toBeInTheDocument();
    expect(screen.getByTestId("maze-grid").children).toHaveLength(256);
    expect(screen.getByTestId("maze-robot-cell")).toBeInTheDocument();
  });

  it("renderiza rastro de passos anteriores", () => {
    render(
      <VisualizeDiv
        {...baseProps}
        currentView="dashboard"
        isConnected
        posX={2}
        posY={2}
        steps={[
          { id: "1", stepOrder: 1, posX: 0, posY: 0, voltage: 12, current: 100, createdAt: "" },
          { id: "2", stepOrder: 2, posX: 1, posY: 1, voltage: 12, current: 100, createdAt: "" },
          { id: "3", stepOrder: 3, posX: 2, posY: 2, voltage: 12, current: 100, createdAt: "" },
        ]}
      />
    );

    expect(screen.getByTestId("maze-robot-cell")).toBeInTheDocument();
  });

  it("limita coordenadas fora do grid 16x16", () => {
    render(
      <VisualizeDiv
        {...baseProps}
        currentView="dashboard"
        isConnected
        posX={99}
        posY={-5}
      />
    );

    expect(screen.getByTestId("maze-coords")).toHaveTextContent("COORDS: X-15, Y-0");
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
