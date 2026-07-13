import type { ArrowLine, GridPoint } from "../core/types";

const distanceToSegment = (point: GridPoint, start: GridPoint, end: GridPoint): number => {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const lengthSquared = segmentX * segmentX + segmentY * segmentY;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);

  const projection = ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) / lengthSquared;
  const clamped = Math.max(0, Math.min(1, projection));
  const nearestX = start.x + segmentX * clamped;
  const nearestY = start.y + segmentY * clamped;
  return Math.hypot(point.x - nearestX, point.y - nearestY);
};

export const distanceToArrowLine = (line: ArrowLine, point: GridPoint): number => {
  if (line.points.length === 1) return Math.hypot(point.x - line.points[0].x, point.y - line.points[0].y);
  let best = Number.POSITIVE_INFINITY;
  for (let index = 1; index < line.points.length; index += 1) {
    best = Math.min(best, distanceToSegment(point, line.points[index - 1], line.points[index]));
  }
  return best;
};

export const findNearestLine = (
  lines: readonly ArrowLine[],
  point: GridPoint,
  maxDistance: number,
): ArrowLine | null => {
  let nearest: ArrowLine | null = null;
  let nearestDistance = maxDistance;
  for (const line of lines) {
    const distance = distanceToArrowLine(line, point);
    if (distance < nearestDistance) {
      nearest = line;
      nearestDistance = distance;
    }
  }
  return nearest;
};
