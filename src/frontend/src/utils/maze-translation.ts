export interface MazePoint {
  posX: number;
  posY: number;
}

export interface MazeOffset {
  offsetX: number;
  offsetY: number;
}

// O robô assume que parte de (0,0); coordenadas negativas significam que ele
// começou em outro canto do labirinto físico. O offset desloca o quadro inteiro
// (trilha + posição atual) para que tudo caiba na matriz não negativa.
export function computeMazeOffset(
  steps: MazePoint[],
  currentX: number,
  currentY: number
): MazeOffset {
  let minX = Math.min(0, Number.isFinite(currentX) ? currentX : 0);
  let minY = Math.min(0, Number.isFinite(currentY) ? currentY : 0);

  for (const step of steps) {
    if (Number.isFinite(step.posX)) minX = Math.min(minX, step.posX);
    if (Number.isFinite(step.posY)) minY = Math.min(minY, step.posY);
  }

  return { offsetX: -minX, offsetY: -minY };
}
