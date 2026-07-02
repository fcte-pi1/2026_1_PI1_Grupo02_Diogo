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

  it("só marca como visitadas as células até o passo ativo do replay", () => {
    render(
      <SessionReplayGrid
        steps={sessionDetailFixture.steps}
        activeIndex={0}
        maze={mazeFixture}
      />
    );

    // Passo ativo é (0,0); os passos futuros (1,0) e (1,1) ainda não visitados
    expect(screen.getByTitle("Robô em (0, 0)")).toBeInTheDocument();
    expect(screen.getByTitle("Coords: (1, 0)")).not.toHaveAttribute(
      "data-visits"
    );
    expect(screen.getByTitle("Coords: (1, 1)")).not.toHaveAttribute(
      "data-visits"
    );
  });
});
