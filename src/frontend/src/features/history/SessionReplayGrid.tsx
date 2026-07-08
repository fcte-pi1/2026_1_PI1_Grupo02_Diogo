import { useMemo } from "react";
import { MazeGrid } from "../../components/MazeGrid";
import type { MazeData, SessionStep } from "../../types/session";

const DEFAULT_GRID_SIZE = 8;
/** Sessões antigas do TestView às vezes apontavam para o maze padrão 16x16. */
const MAX_REPLAY_GRID_SIZE = 8;

interface SessionReplayGridProps {
  steps: SessionStep[];
  activeIndex: number;
  maze?: MazeData;
}

function resolveReplaySize(
  maze: MazeData | undefined,
  steps: SessionStep[],
): { width: number; height: number } {
  const configuredWidth = maze?.width ?? DEFAULT_GRID_SIZE;
  const configuredHeight = maze?.height ?? DEFAULT_GRID_SIZE;

  const maxStepX = steps.reduce((max, step) => Math.max(max, step.posX), 0);
  const maxStepY = steps.reduce((max, step) => Math.max(max, step.posY), 0);

  // Se o maze veio 16x16 mas o trajeto cabe em 8x8 (TestView), encolhe o replay.
  const looksLikeOversizedDefault =
    configuredWidth > MAX_REPLAY_GRID_SIZE ||
    configuredHeight > MAX_REPLAY_GRID_SIZE;

  if (
    looksLikeOversizedDefault &&
    maxStepX < MAX_REPLAY_GRID_SIZE &&
    maxStepY < MAX_REPLAY_GRID_SIZE
  ) {
    return { width: MAX_REPLAY_GRID_SIZE, height: MAX_REPLAY_GRID_SIZE };
  }

  return {
    width: Math.min(configuredWidth, Math.max(DEFAULT_GRID_SIZE, maxStepX + 1)),
    height: Math.min(
      configuredHeight,
      Math.max(DEFAULT_GRID_SIZE, maxStepY + 1),
    ),
  };
}

export function SessionReplayGrid({
  steps,
  activeIndex,
  maze,
}: SessionReplayGridProps) {
  const active = steps[activeIndex];
  const replayedSteps = steps.slice(0, activeIndex + 1);
  const { width, height } = useMemo(
    () => resolveReplaySize(maze, steps),
    [maze, steps],
  );

  const robotRotation = useMemo(() => {
    if (activeIndex === 0) return 0;
    const curr = steps[activeIndex];
    const prev = steps[activeIndex - 1];
    const dx = curr.posX - prev.posX;
    const dy = curr.posY - prev.posY;

    if (dx === 0 && dy > 0) return 0;
    if (dx > 0 && dy === 0) return 90;
    if (dx === 0 && dy < 0) return 180;
    if (dx < 0 && dy === 0) return 270;
    return 0;
  }, [steps, activeIndex]);

  const visibleCells = useMemo(() => {
    if (!maze?.cells?.length) return [];
    return maze.cells.filter(
      (cell) => cell.posX < width && cell.posY < height,
    );
  }, [maze?.cells, width, height]);

  return (
    <div className="w-full h-full max-w-full max-h-full min-h-0 flex items-center justify-center p-2 overflow-auto">
      <MazeGrid
        cells={visibleCells}
        steps={replayedSteps}
        currentX={active?.posX ?? 0}
        currentY={active?.posY ?? 0}
        robotRotation={robotRotation}
        width={width}
        height={height}
        ariaLabel="Mapa do replay"
      />
    </div>
  );
}
