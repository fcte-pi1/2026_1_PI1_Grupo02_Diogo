import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionReplayGrid } from "../../features/history/SessionReplayGrid";
import { sessionDetailFixture } from "../fixtures/sessions";

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
});
