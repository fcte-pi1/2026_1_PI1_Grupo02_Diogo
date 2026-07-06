import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LabyrinthMap } from "../../components/labirith-map";
import type { SessionStep } from "../../types/session";

describe("LabyrinthMap Component", () => {
  const mockStaticCells = [
    {
      id: "c1",
      mazeId: "m1",
      posX: 0,
      posY: 7,
      wallNorth: true,
      wallSouth: false,
      wallEast: true,
      wallWest: false,
    },
  ];

  it("deve renderizar a malha do grid com a dimensão padrão de 8x8 (64 células)", () => {
    render(<LabyrinthMap staticCells={[]} steps={[]} currentX={0} currentY={0} />);
    
    const grid = screen.getByTestId("maze-grid");
    expect(grid).toBeInTheDocument();
    
    // Verifica a propriedade inline de estilo de colunas repetidas do grid
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" });
    
    // O total de divs filhas renderizadas deve ser exatamente 64
    expect(grid.children.length).toBe(64);
  });

  it("deve renderizar o robô na célula cartesiana correta", () => {
    render(<LabyrinthMap staticCells={[]} steps={[]} currentX={2} currentY={3} />);

    const robotCell = screen.getByTestId("maze-robot-cell");
    expect(robotCell).toBeInTheDocument();
    expect(robotCell).toHaveAttribute("title", "Coords: (2, 3)");
    expect(robotCell.className).toContain("bg-primary");
    expect(robotCell.className).toContain("animate-pulse");
  });

  it("deve aplicar estilos de bordas vermelhas fortes nas coordenadas onde há paredes ativas", () => {
    render(<LabyrinthMap staticCells={mockStaticCells} steps={[]} currentX={2} currentY={2} />);

    // Seleciona a célula específica (0,7) pelo atributo title
    const wallCell = screen.getByTitle("Coords: (0, 7)");
    
    expect(wallCell.className).toContain("border-t-[3px]"); // Parede Norte ativa
    expect(wallCell.className).toContain("border-t-red-500");
    expect(wallCell.className).toContain("border-r-[3px]"); // Parede Leste ativa
    expect(wallCell.className).toContain("border-r-red-500");

    // Paredes que não foram setadas devem manter as bordas sutis do chassi
    expect(wallCell.className).toContain("border-b-outline-variant/10");
  });

  it("deve aplicar opacidade de rastro de trilha (breadcrumbs) para células visitadas anteriormente", () => {
    // Fornecemos 2 passos para que o divisor da opacidade (maxTrailIndex) seja maior que zero
    const twoSteps = [
      { id: "s1", stepOrder: 0, posX: 0, posY: 6 },
      { id: "s2", stepOrder: 1, posX: 0, posY: 5 },
    ] as unknown as SessionStep[];

    render(
      <LabyrinthMap 
        staticCells={[]} 
        steps={twoSteps} 
        currentX={7} 
        currentY={7} // Robô longe para não sobrepor as células visitadas
      />
    );

    // O primeiro passo (índice 0) deve receber a opacidade mínima da fórmula: 0.12 + (0/1)*0.38 = 0.12
    const firstVisitedCell = screen.getByTitle("Coords: (0, 6)");
    expect(firstVisitedCell.className).toContain("bg-primary");
    expect(firstVisitedCell).toHaveStyle({ opacity: 0.12 });

    // O segundo passo (índice 1) deve receber a opacidade máxima da fórmula: 0.12 + (1/1)*0.38 = 0.5
    const secondVisitedCell = screen.getByTitle("Coords: (0, 5)");
    expect(secondVisitedCell.className).toContain("bg-primary");
    expect(secondVisitedCell).toHaveStyle({ opacity: 0.5 });
  });
});