import { pointKey } from "../core/grid";
import type { GridPoint } from "../core/types";

const neighbors = ({ x, y }: GridPoint): GridPoint[] => [
  { x: x + 1, y },
  { x: x - 1, y },
  { x, y: y + 1 },
  { x, y: y - 1 },
];

export const keepLargestConnectedRegion = (cells: ReadonlySet<string>): Set<string> => {
  const unvisited = new Set(cells);
  let largest = new Set<string>();

  while (unvisited.size > 0) {
    const startKey = unvisited.values().next().value as string;
    const queue = [startKey];
    const region = new Set<string>();
    unvisited.delete(startKey);

    while (queue.length > 0) {
      const key = queue.shift() as string;
      region.add(key);
      const [x, y] = key.split(",").map(Number);
      for (const neighbor of neighbors({ x, y })) {
        const neighborKey = pointKey(neighbor);
        if (unvisited.delete(neighborKey)) queue.push(neighborKey);
      }
    }

    if (region.size > largest.size) largest = region;
  }

  return largest;
};

export const fillEnclosedHoles = (cells: ReadonlySet<string>, width: number, height: number): Set<string> => {
  const result = new Set(cells);
  const outside = new Set<string>();
  const queue: GridPoint[] = [];

  const enqueueOutside = (point: GridPoint): void => {
    const key = pointKey(point);
    if (cells.has(key) || outside.has(key)) return;
    outside.add(key);
    queue.push(point);
  };

  for (let x = 0; x < width; x += 1) {
    enqueueOutside({ x, y: 0 });
    enqueueOutside({ x, y: height - 1 });
  }
  for (let y = 0; y < height; y += 1) {
    enqueueOutside({ x: 0, y });
    enqueueOutside({ x: width - 1, y });
  }

  while (queue.length > 0) {
    const point = queue.shift() as GridPoint;
    for (const neighbor of neighbors(point)) {
      if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= width || neighbor.y >= height) continue;
      enqueueOutside(neighbor);
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const key = pointKey({ x, y });
      if (!outside.has(key)) result.add(key);
    }
  }

  return result;
};

export const normalizeSolidSilhouette = (cells: ReadonlySet<string>, width: number, height: number): Set<string> =>
  fillEnclosedHoles(keepLargestConnectedRegion(cells), width, height);

export const isSingleConnectedRegion = (cells: ReadonlySet<string>): boolean =>
  cells.size === 0 || keepLargestConnectedRegion(cells).size === cells.size;

export const hasEnclosedHole = (cells: ReadonlySet<string>, width: number, height: number): boolean =>
  fillEnclosedHoles(cells, width, height).size !== cells.size;
