import { MazeGrid } from "../../components/MazeGrid";
import type { MazeData, SessionStep } from "../../types/session";

const DEFAULT_GRID_SIZE = 8; // Mantendo 8x8 (0 a 7) de acordo com o padrão do projeto

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
    // Removido o max-w-sm e aspect-square. 
    // Agora ele flui livremente e se adapta ao tamanho exato do painel pai!
    <div className="w-full h-full flex items-center justify-center p-2">
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