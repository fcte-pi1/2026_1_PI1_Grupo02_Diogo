import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MazeGrid } from "../../components/MazeGrid";
import type { MazeCell } from "../../types/session";

const cells: MazeCell[] = [
  {
    posX: 0,
    posY: 0,
    wallNorth: true,
    wallSouth: true,
    wallEast: false,
    wallWest: true,
  },
  {
    posX: 2,
    posY: 3,
    wallNorth: false,
    wallSouth: false,
    wallEast: true,
    wallWest: false,
  },
];

describe("MazeGrid", () => {
  it("renderiza a malha completa e destaca a célula do robô", () => {
    render(
      <MazeGrid cells={cells} steps={[]} currentX={2} currentY={3} />
    );

    expect(screen.getByTestId("maze-grid")).toBeInTheDocument();
    expect(screen.getByTestId("maze-robot-cell")).toHaveAttribute(
      "title",
      "Robô em (2, 3)"
    );
  });

  it("marca as paredes das células com atributos por direção", () => {
    render(
      <MazeGrid cells={cells} steps={[]} currentX={7} currentY={7} />
    );

    const origin = screen.getByTitle("Coords: (0, 0)");
    expect(origin).toHaveAttribute("data-wall-north", "true");
    expect(origin).toHaveAttribute("data-wall-south", "true");
    expect(origin).toHaveAttribute("data-wall-west", "true");
    expect(origin).not.toHaveAttribute("data-wall-east");
  });

  it("intensifica a trilha a cada reentrada na célula", () => {
    const steps = [
      { posX: 0, posY: 0 },
      { posX: 1, posY: 0 },
      { posX: 0, posY: 0 }, // segunda visita a (0,0)
      { posX: 1, posY: 0 }, // segunda visita a (1,0)
      { posX: 1, posY: 0 }, // robô parado: não conta nova visita
      { posX: 2, posY: 0 },
    ];

    render(
      <MazeGrid cells={[]} steps={steps} currentX={2} currentY={0} />
    );

    expect(screen.getByTitle("Coords: (0, 0)")).toHaveAttribute(
      "data-visits",
      "2"
    );
    expect(screen.getByTitle("Coords: (1, 0)")).toHaveAttribute(
      "data-visits",
      "2"
    );
    // Célula atual do robô nunca recebe marcação de trilha
    expect(screen.getByTestId("maze-robot-cell")).not.toHaveAttribute(
      "data-visits"
    );
  });

  it("translada a matriz inteira quando o robô sai para coordenadas negativas", () => {
    // Robô partiu de outro canto: começou em (0,0) na visão dele,
    // andou para (-1,0) e depois para (-1,-2)
    const steps = [
      { posX: 0, posY: 0 },
      { posX: -1, posY: 0 },
      { posX: -1, posY: -2 },
    ];

    render(
      <MazeGrid cells={[]} steps={steps} currentX={-1} currentY={-2} />
    );

    // Offset (+1, +2): a largada vira (1,2) e o robô fica em (0,0)
    const grid = screen.getByTestId("maze-grid");
    expect(grid).toHaveAttribute("data-offset-x", "1");
    expect(grid).toHaveAttribute("data-offset-y", "2");
    expect(screen.getByTestId("maze-robot-cell")).toHaveAttribute(
      "title",
      "Robô em (0, 0)"
    );
    expect(screen.getByTitle("Coords: (1, 2)")).toHaveAttribute(
      "data-visits",
      "1"
    );
    expect(screen.getByTitle("Coords: (0, 2)")).toHaveAttribute(
      "data-visits",
      "1"
    );
  });

  it("não desloca a matriz quando o robô parte de (0,0)", () => {
    const steps = [
      { posX: 0, posY: 0 },
      { posX: 1, posY: 0 },
    ];

    render(
      <MazeGrid cells={[]} steps={steps} currentX={1} currentY={0} />
    );

    const grid = screen.getByTestId("maze-grid");
    expect(grid).toHaveAttribute("data-offset-x", "0");
    expect(grid).toHaveAttribute("data-offset-y", "0");
    expect(screen.getByTestId("maze-robot-cell")).toHaveAttribute(
      "title",
      "Robô em (1, 0)"
    );
  });

  it("aplica clamp defensivo em coordenadas fora da malha", () => {
    render(
      <MazeGrid cells={[]} steps={[]} currentX={99} currentY={-5} />
    );

    expect(screen.getByTestId("maze-robot-cell")).toHaveAttribute(
      "title",
      "Robô em (7, 0)"
    );
  });
});
