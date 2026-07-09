import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MazeEditor } from "../../components/MazeEditor";

describe("MazeEditor", () => {
  it("usa o mesmo eixo Y do LabyrinthMap (origem embaixo à esquerda)", () => {
    render(
      <MazeEditor
        cells={[]}
        currentX={0}
        currentY={0}
        onToggleWall={vi.fn()}
      />,
    );

    const grid = screen.getByTestId("maze-grid");
    // Linha CSS 0 = topo = Y alto; robô em Y=0 fica na última linha
    expect(grid.children[0]).toHaveAttribute("title", "Coords: (0, 7)");
    expect(grid.children[56]).toHaveAttribute("title", "Robô em (0, 0)");
    expect(screen.getByTestId("maze-robot-cell")).toHaveAttribute(
      "title",
      "Robô em (0, 0)",
    );
  });

  it("renderiza paredes vermelhas e dispara onToggleWall", async () => {
    const onToggleWall = vi.fn();
    const user = userEvent.setup();

    render(
      <MazeEditor
        cells={[
          {
            posX: 1,
            posY: 1,
            wallNorth: true,
            wallSouth: false,
            wallEast: false,
            wallWest: false,
          },
        ]}
        currentX={0}
        currentY={0}
        onToggleWall={onToggleWall}
      />,
    );

    const cell = screen.getByTitle("Coords: (1, 1)");
    expect(cell).toHaveAttribute("data-wall-north", "true");
    expect(cell.querySelector('[data-testid="wall-north"]')?.className).toContain(
      "bg-red-500",
    );

    await user.click(
      screen.getByRole("button", { name: "Toggle north wall at (1, 1)" }),
    );
    expect(onToggleWall).toHaveBeenCalledWith(1, 1, "North");
  });
});
