import type { SessionStep } from "../types/session";

// Definição da interface Cell exatamente como está no seu Prisma
interface PrismaCell {
  id: string;
  mazeId: string;
  posX: number;
  posY: number;
  wallNorth: boolean;
  wallSouth: boolean;
  wallEast: boolean;
  wallWest: boolean;
}

interface LabyrinthMapProps {
  staticCells: PrismaCell[]; // As paredes físicas vindas do model Cell do Prisma
  steps: SessionStep[];       // Histórico de passos para desenhar o rastro
  currentX: number;           // Posição X reativa atual do robô
  currentY: number;           // Posição Y reativa atual do robô
  width?: number;             // Largura do labirinto (default 16 do Prisma)
  height?: number;            // Altura do labirinto (default 16 do Prisma)
}

export function LabyrinthMap({
  staticCells = [],
  steps = [],
  currentX,
  currentY,
  width = 16,
  height = 16,
}: LabyrinthMapProps) {
  
  // 1. Dicionário indexado para buscar as paredes de uma coordenada em O(1)
  const cellWallsMap = new Map<string, PrismaCell>();
  staticCells.forEach((cell) => {
    cellWallsMap.set(`${cell.posX},${cell.posY}`, cell);
  });

  // 2. Set para armazenar o histórico de posições visitadas pelo robô (para o rastro)
  const visitedPositions = new Set<string>(
    steps.map((step) => `${step.posX},${step.posY}`)
  );

  return (
    <div
      // 🚀 CORREÇÃO TAILWIND: Removidas as barras invertidas e setado um aspect-square responsivo
      className="grid gap-0 bg-surface-container-lowest border border-outline-variant/50 p-2 shadow-inner w-full max-w-/[600px] aspect-square mx-auto"
      style={{
        gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
      }}
      aria-label="Mapeamento do labirinto"
    >
      {/* Geramos o grid iterando pelas linhas (Y) de cima para baixo. */}
      {Array.from({ length: height }, (_, rowIndex) => {
        const y = height - 1 - rowIndex; // Inverte o eixo Y para o Norte ficar no topo visual

        return Array.from({ length: width }, (_, colIndex) => {
          const x = colIndex;
          const key = `${x},${y}`;
          
          // Busca se existem paredes gravadas para essa célula
          const cellData = cellWallsMap.get(key);
          
          const isRobot = currentX === x && currentY === y;
          const isVisited = visitedPositions.has(key) && !isRobot;

          // Extração das booleanas do Prisma
          const hasNorth = cellData?.wallNorth ?? false;
          const hasSouth = cellData?.wallSouth ?? false;
          const hasEast = cellData?.wallEast ?? false;
          const hasWest = cellData?.wallWest ?? false;

          return (
            <div
              key={key}
              // 🚀 CORREÇÃO TAILWIND: w-full e h-full para forçar as células a preencherem o container
              className={`
                w-full h-full transition-all duration-150 box-border
                ${hasNorth ? "border-t-[3px] border-t-red-500" : "border-t border-t-outline-variant/10"}
                ${hasSouth ? "border-b-[3px] border-b-red-500" : "border-b border-b-outline-variant/10"}
                ${hasEast ? "border-r-[3px] border-r-red-500" : "border-r border-r-outline-variant/10"}
                ${hasWest ? "border-l-[3px] border-l-red-500" : "border-l border-l-outline-variant/10"}
                ${
                  isRobot
                    ? "bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] scale-110 z-10"
                    : isVisited
                      ? "bg-primary/20"
                      : "bg-transparent"
                }
              `}
              title={`Coords: (${x}, ${y})`}
            />
          );
        });
      })}
    </div>
  );
}