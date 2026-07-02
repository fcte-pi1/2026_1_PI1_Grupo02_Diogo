import { MazeGrid } from "../../components/MazeGrid";
import type { MazeData, SessionStep } from "../../types/session";

const DEFAULT_GRID_SIZE = 8;

interface SessionReplayGridProps {
  steps: SessionStep[];
  activeIndex: number;
  maze?: MazeData;
}

export function SessionReplayGrid({
  steps,
  activeIndex,
  maze,
}: SessionReplayGridProps) {
  const active = steps[activeIndex];
  const replayedSteps = steps.slice(0, activeIndex + 1);

  return (
    <div className="w-full max-w-sm mx-auto aspect-square">
      <MazeGrid
        cells={maze?.cells ?? []}
        steps={replayedSteps}
        currentX={active?.posX ?? 0}
        currentY={active?.posY ?? 0}
        width={maze?.width ?? DEFAULT_GRID_SIZE}
        height={maze?.height ?? DEFAULT_GRID_SIZE}
        ariaLabel="Mapa do replay"
      />
    </div>
  );
}
