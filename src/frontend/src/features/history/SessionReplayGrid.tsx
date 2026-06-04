import type { SessionStep } from "../../types/session";

const GRID_SIZE = 8;

interface SessionReplayGridProps {
  steps: SessionStep[];
  activeIndex: number;
}

export function SessionReplayGrid({ steps, activeIndex }: SessionReplayGridProps) {
  const active = steps[activeIndex];
  const visitedKeys = new Set(
    steps.slice(0, activeIndex + 1).map((s) => `${s.posX},${s.posY}`)
  );

  return (
    <div
      className="grid gap-1 w-full max-w-sm mx-auto p-3 bg-surface-container-high/30 border border-outline-variant/20"
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
      aria-label="Mapa do replay"
    >
      {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, cellIndex) => {
        const x = cellIndex % GRID_SIZE;
        const y = Math.floor(cellIndex / GRID_SIZE);
        const key = `${x},${y}`;
        const isRobot = active?.posX === x && active?.posY === y;
        const isTrail = visitedKeys.has(key) && !isRobot;

        return (
          <div
            key={key}
            className={[
              "aspect-square min-h-[22px] border border-outline-variant/10 transition-colors duration-200",
              isRobot
                ? "bg-primary border-primary shadow-[0_0_14px] shadow-primary/50 scale-110 z-10"
                : isTrail
                  ? "bg-primary/25 border-primary/30"
                  : "bg-surface-container-lowest/50",
            ].join(" ")}
            title={isRobot ? `Robô em (${x}, ${y})` : undefined}
          />
        );
      })}
    </div>
  );
}
