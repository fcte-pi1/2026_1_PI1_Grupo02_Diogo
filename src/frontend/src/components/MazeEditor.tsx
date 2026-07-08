import { LabyrinthMap, type Direction } from "./labirith-map";
import type { MazeCellWalls } from "../types/maze";
import type { SessionStep } from "../types/session";

/**
 * Editor de paredes alinhado ao LabyrinthMap (mesmo eixo Y invertido:
 * origem (0,0) no canto inferior esquerdo).
 */
export interface MazeEditorProps {
  cells: MazeCellWalls[];
  currentX?: number;
  currentY?: number;
  robotRotation?: number;
  width?: number;
  height?: number;
  steps?: SessionStep[];
  onToggleWall: (x: number, y: number, direction: Direction) => void;
}

export function MazeEditor({
  cells,
  currentX = 0,
  currentY = 0,
  robotRotation = 0,
  width = 8,
  height = 8,
  steps = [],
  onToggleWall,
}: MazeEditorProps) {
  return (
    <LabyrinthMap
      staticCells={cells}
      steps={steps}
      currentX={currentX}
      currentY={currentY}
      robotRotation={robotRotation}
      width={width}
      height={height}
      editable
      onToggleWall={onToggleWall}
    />
  );
}

export default MazeEditor;
