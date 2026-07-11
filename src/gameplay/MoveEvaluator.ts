import { addPoint, directionVector, equalPoint, isInsideBounds, pointKey } from "../core/grid";
import type { ArrowLine, MoveResult } from "../core/types";

const buildOtherOccupancy = (lineId: string, lines: readonly ArrowLine[]): Map<string, string> => {
  const occupancy = new Map<string, string>();
  for (const line of lines) {
    if (line.id === lineId) continue;
    for (const point of line.points) occupancy.set(pointKey(point), line.id);
  }
  return occupancy;
};

export const evaluateMove = (
  selected: ArrowLine,
  lines: readonly ArrowLine[],
  boardWidth: number,
  boardHeight: number,
): MoveResult => {
  const simulated = selected.points.map((point) => ({ ...point }));
  const otherOccupancy = buildOtherOccupancy(selected.id, lines);
  const vector = directionVector(selected.direction);
  const maxSteps = selected.points.length + boardWidth + boardHeight + 4;

  for (let step = 0; step < maxSteps; step += 1) {
    if (!simulated.some((point) => isInsideBounds(point, boardWidth, boardHeight))) {
      return { canEscape: true };
    }

    const nextHead = addPoint(simulated[0], vector);
    simulated.pop();

    const blockerId = otherOccupancy.get(pointKey(nextHead));
    if (blockerId) {
      return { canEscape: false, blockerId, blockerPoint: nextHead };
    }

    if (simulated.some((point) => equalPoint(point, nextHead))) {
      return { canEscape: false, blockerId: selected.id, blockerPoint: nextHead };
    }

    simulated.unshift(nextHead);
  }

  return { canEscape: false, blockerId: selected.id, blockerPoint: simulated[0] };
};

export const advanceLineOneGrid = (line: ArrowLine): void => {
  const nextHead = addPoint(line.points[0], directionVector(line.direction));
  line.points.pop();
  line.points.unshift(nextHead);
};

export const isLineOutside = (line: ArrowLine, width: number, height: number): boolean =>
  line.points.every((point) => !isInsideBounds(point, width, height));
