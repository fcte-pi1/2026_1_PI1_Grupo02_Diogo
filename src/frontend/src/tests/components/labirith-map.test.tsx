import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LabyrinthMap } from "../../components/labirith-map";
import type { SessionStep } from "../../types/session";

describe("LabyrinthMap Component", () => {
  const mockStaticCells = [
    {
      posX: 0,
      posY: 7,
      wallNorth: true,
      wallSouth: false,
      wallEast: true,
      wallWest: false,
    },
  ];

  it("deve renderizar a malha do grid com a dimensão padrão de 8x8 (64 células)", () => {
    render(
      <LabyrinthMap staticCells={[]} steps={[]} currentX={0} currentY={0} />,
    );

    const grid = screen.getByTestId("maze-grid");
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveStyle({
      gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
    });
    expect(grid.children.length).toBe(64);
  });

  it("deve renderizar o robô na célula cartesiana correta", () => {
    render(
      <LabyrinthMap staticCells={[]} steps={[]} currentX={2} currentY={3} />,
    );

    const robotCell = screen.getByTestId("maze-robot-cell");
    expect(robotCell).toBeInTheDocument();
    expect(robotCell).toHaveAttribute("title", "Robô em (2, 3)");
  });

  it("deve aplicar bordas vermelhas de 4px nas paredes ativas", () => {
    render(
      <LabyrinthMap
        staticCells={mockStaticCells}
        steps={[]}
        currentX={2}
        currentY={2}
      />,
    );

    const wallCell = screen.getByTitle("Coords: (0, 7)");
    expect(wallCell).toHaveAttribute("data-wall-north", "true");
    expect(wallCell).toHaveAttribute("data-wall-east", "true");
    expect(wallCell).not.toHaveAttribute("data-wall-south");
    expect(wallCell).not.toHaveAttribute("data-wall-west");

    const northWall = wallCell.querySelector('[data-testid="wall-north"]');
    const eastWall = wallCell.querySelector('[data-testid="wall-east"]');
    expect(northWall?.className).toContain("h-[4px]");
    expect(northWall?.className).toContain("bg-red-500");
    expect(eastWall?.className).toContain("w-[4px]");
    expect(eastWall?.className).toContain("bg-red-500");
  });

  it("deve manter origem (0,0) no canto inferior esquerdo (Y invertido)", () => {
    render(
      <LabyrinthMap staticCells={[]} steps={[]} currentX={0} currentY={0} />,
    );

    const grid = screen.getByTestId("maze-grid");
    const firstCell = grid.children[0] as HTMLElement;
    const lastRowFirstCell = grid.children[56] as HTMLElement;

    // Linha 0 do CSS = topo = Y alto (7); última linha = Y 0 (robô em 0,0)
    expect(firstCell).toHaveAttribute("title", "Coords: (0, 7)");
    expect(lastRowFirstCell).toHaveAttribute("title", "Robô em (0, 0)");
  });

  it("deve aplicar rastro de trilha para células visitadas", () => {
    const twoSteps = [
      { id: "s1", stepOrder: 0, posX: 0, posY: 0 },
      { id: "s2", stepOrder: 1, posX: 0, posY: 1 },
    ] as unknown as SessionStep[];

    render(
      <LabyrinthMap
        staticCells={[]}
        steps={twoSteps}
        currentX={0}
        currentY={1}
      />,
    );

    const originCell = screen.getByTitle("Coords: (0, 0)");
    const endCell = screen.getByTestId("maze-robot-cell");

    expect(originCell).toHaveStyle({
      backgroundColor: "rgb(6 78 59 / 0.18)",
    });
    expect(endCell).toHaveStyle({
      backgroundColor: "rgb(6 78 59 / 0.46)",
    });
    expect(endCell).toHaveAttribute("title", "Robô em (0, 1)");
  });
});
