import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionReplayGrid } from "../../features/history/SessionReplayGrid";
import { mazeFixture, sessionDetailFixture } from "../fixtures/sessions";

describe("SessionReplayGrid", () => {
  it("renderiza mapa do replay com posição ativa", () => {
    render(
      <SessionReplayGrid
        steps={sessionDetailFixture.steps}
        activeIndex={1}
      />
    );

    expect(screen.getByLabelText("Mapa do replay")).toBeInTheDocument();
    expect(screen.getByTitle("Robô em (1, 0)")).toBeInTheDocument();
  });

  it("renderiza as paredes estáticas do labirinto quando o maze é fornecido", () => {
    render(
      <SessionReplayGrid
        steps={sessionDetailFixture.steps}
        activeIndex={2}
        maze={mazeFixture}
      />
    );

    // Célula (1, 0) tem paredes norte e sul na fixture
    const walledCell = screen.getByTitle("Coords: (1, 0)");
    expect(walledCell).toHaveAttribute("data-wall-north", "true");
    expect(walledCell).toHaveAttribute("data-wall-south", "true");
    expect(walledCell).not.toHaveAttribute("data-wall-east");
  });

  it("translada o replay quando o trajeto usa coordenadas negativas", () => {
    const steps = [
      {
        id: "step-1",
        stepOrder: 1,
        posX: 0,
        posY: 0,
        voltage: 12,
        current: 200,
        createdAt: "2026-01-15T10:00:01.000Z",
      },
      {
        id: "step-2",
        stepOrder: 2,
        posX: -1,
        posY: 0,
        voltage: 11.9,
        current: 205,
        createdAt: "2026-01-15T10:00:02.000Z",
      },
    ];

    const { rerender } = render(
      <SessionReplayGrid steps={steps} activeIndex={0} />
    );
    expect(screen.getByTestId("maze-grid")).toHaveAttribute("data-offset-x", "0");
    expect(screen.getByTitle("Robô em (0, 0)")).toBeInTheDocument();

    rerender(<SessionReplayGrid steps={steps} activeIndex={1} />);
    expect(screen.getByTestId("maze-grid")).toHaveAttribute("data-offset-x", "1");
    expect(screen.getByTitle("Robô em (0, 0)")).toBeInTheDocument();
    expect(screen.getByTestId("maze-robot-cell")).toHaveAttribute(
      "data-visits",
      "1"
    );
  });

  it("só marca como visitadas as células até o passo ativo do replay", () => {
    render(
      <SessionReplayGrid
        steps={sessionDetailFixture.steps}
        activeIndex={0}
        maze={mazeFixture}
      />,
    );

    expect(screen.getByTitle("Robô em (0, 0)")).toBeInTheDocument();
    expect(screen.getByTestId("maze-robot-cell")).toHaveAttribute(
      "data-visits",
      "1",
    );
    expect(screen.getByTitle("Coords: (1, 0)")).not.toHaveAttribute(
      "data-visits",
    );
    expect(screen.getByTitle("Coords: (1, 1)")).not.toHaveAttribute(
      "data-visits",
    );
  });

  it("encolhe maze 16x16 herdado para 8x8 quando o trajeto cabe no TestView", () => {
    render(
      <SessionReplayGrid
        steps={sessionDetailFixture.steps}
        activeIndex={1}
        maze={{
          ...mazeFixture,
          width: 16,
          height: 16,
        }}
      />,
    );

    const grid = screen.getByTestId("maze-grid");
    expect(grid).toHaveStyle({
      gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
    });
  });
});
