import { useMemo } from "react";
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

  // Calcula a rotação baseada no histórico (como você pediu)
  const robotRotation = useMemo(() => {
    if (activeIndex === 0) return 0;
    const curr = steps[activeIndex];
    const prev = steps[activeIndex - 1];
    const dx = curr.posX - prev.posX;
    const dy = curr.posY - prev.posY;

    if (dx === 0 && dy > 0) return 0;   // Norte
    if (dx > 0 && dy === 0) return 90;  // Leste
    if (dx === 0 && dy < 0) return 180; // Sul
    if (dx < 0 && dy === 0) return 270; // Oeste
    return 0;
  }, [steps, activeIndex]);

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <MazeGrid
        cells={maze?.cells ?? []}
        steps={replayedSteps}
        currentX={active?.posX ?? 0}
        currentY={active?.posY ?? 0}
        robotRotation={robotRotation} // Rotação calculada
        width={maze?.width ?? DEFAULT_GRID_SIZE}
        height={maze?.height ?? DEFAULT_GRID_SIZE}
        ariaLabel="Mapa do replay"
      />
    </div>
  );
}