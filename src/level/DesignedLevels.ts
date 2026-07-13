import { pointKey } from "../core/grid";
import { SeededRandom } from "../core/SeededRandom";
import type { ArrowLine, BoardMask, BoardShape, GridPoint, LevelData } from "../core/types";
import { getEscapableLines, solveLevel } from "./LevelSolver";
import { normalizeSolidSilhouette } from "./BoardMaskTopology";
import silhouetteBoards from "../data/silhouette-boards.json";

const shapes: BoardShape[] = ["rectangle", "circle", "diamond", "triangle", "cloud"];

export const DESIGNED_LEVELS: ReadonlyArray<{ name: string; shape: BoardShape; variant: number }> =
  silhouetteBoards.map((_board, index) => ({ name: `关卡 ${index + 1}`, shape: "silhouette", variant: index }));

const dimensions: Record<BoardShape, { width: number; height: number }> = {
  rectangle: { width: 16, height: 22 },
  circle: { width: 19, height: 23 },
  diamond: { width: 19, height: 25 },
  triangle: { width: 19, height: 24 },
  cloud: { width: 20, height: 23 },
  silhouette: { width: 20, height: 28 },
};

const insideShape = (shape: BoardShape, x: number, y: number, width: number, height: number): boolean => {
  const centerX = (width - 1) / 2;
  const centerY = (height - 1) / 2;
  const nx = (x - centerX) / Math.max(1, centerX);
  const ny = (y - centerY) / Math.max(1, centerY);

  switch (shape) {
    case "rectangle":
      return x >= 1 && x < width - 1 && y >= 1 && y < height - 1;
    case "circle":
      return nx * nx + ny * ny <= 0.96;
    case "diamond":
      return Math.abs(nx) + Math.abs(ny) <= 1.03;
    case "triangle": {
      const top = 1;
      const bottom = height - 2;
      if (y < top || y > bottom) return false;
      const halfWidth = ((y - top) / (bottom - top)) * (centerX - 1) + 0.55;
      return Math.abs(x - centerX) <= halfWidth;
    }
    case "cloud": {
      const circles = [
        { x: 0.25, y: 0.55, r: 0.29 },
        { x: 0.43, y: 0.41, r: 0.32 },
        { x: 0.62, y: 0.38, r: 0.35 },
        { x: 0.78, y: 0.54, r: 0.29 },
      ];
      const ux = x / (width - 1);
      const uy = y / (height - 1);
      const inCircle = circles.some((circle) => (ux - circle.x) ** 2 + (uy - circle.y) ** 2 <= circle.r ** 2);
      const inBase = ux >= 0.14 && ux <= 0.88 && uy >= 0.48 && uy <= 0.76;
      return inCircle || inBase;
    }
    case "silhouette":
      return false;
  }
};

export const createDesignedBoard = (shape: BoardShape, variant = 0): BoardMask => {
  if (shape === "silhouette") {
    const source = silhouetteBoards[variant];
    if (!source) throw new Error(`Silhouette board ${variant} does not exist`);
    const cells = new Set<string>();
    source.rows.forEach((row, y) => [...row].forEach((value, x) => {
      if (value === "1") cells.add(pointKey({ x, y }));
    }));
    return { width: source.width, height: source.height, cells, shape };
  }
  const base = dimensions[shape];
  const width = Math.min(20, base.width + ((variant * 3 + shapes.indexOf(shape)) % 3) - 1);
  const height = Math.min(28, base.height + ((variant * 5 + shapes.indexOf(shape)) % 5) - 2);
  const cells = new Set<string>();
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const wobbleX = shape === "rectangle" ? 0 : Math.sin((y + variant) * 0.7) * Math.min(1, variant % 3) * 0.18;
      const sampleX = Math.round(x + wobbleX);
      if (insideShape(shape, sampleX, y, width, height)) cells.add(pointKey({ x, y }));
    }
  }
  return { width, height, cells: normalizeSolidSilhouette(cells, width, height), shape };
};

const directionOptions: Array<{ direction: ArrowLine["direction"]; dx: number; dy: number }> = [
  { direction: "up", dx: 0, dy: -1 },
  { direction: "right", dx: 1, dy: 0 },
  { direction: "down", dx: 0, dy: 1 },
  { direction: "left", dx: -1, dy: 0 },
];

const parseKey = (key: string): GridPoint => {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
};

const availableNeighbors = (point: GridPoint, remaining: ReadonlySet<string>, used: ReadonlySet<string>): GridPoint[] =>
  directionOptions
    .map(({ dx, dy }) => ({ x: point.x + dx, y: point.y + dy }))
    .filter((candidate) => remaining.has(pointKey(candidate)) && !used.has(pointKey(candidate)));

const clearDirections = (point: GridPoint, remaining: ReadonlySet<string>, board: BoardMask): ArrowLine["direction"][] =>
  directionOptions
    .filter(({ dx, dy }) => {
      let cursor = { x: point.x + dx, y: point.y + dy };
      while (cursor.x >= 0 && cursor.y >= 0 && cursor.x < board.width && cursor.y < board.height) {
        if (remaining.has(pointKey(cursor))) return false;
        cursor = { x: cursor.x + dx, y: cursor.y + dy };
      }
      return true;
    })
    .map(({ direction }) => direction);

const directionBetween = (from: GridPoint, to: GridPoint): ArrowLine["direction"] => {
  if (to.x > from.x) return "right";
  if (to.x < from.x) return "left";
  if (to.y > from.y) return "down";
  return "up";
};

const oppositeDirection = (direction: ArrowLine["direction"]): ArrowLine["direction"] => {
  switch (direction) {
    case "up": return "down";
    case "right": return "left";
    case "down": return "up";
    case "left": return "right";
  }
};

const hasIsolatedCell = (cells: ReadonlySet<string>): boolean =>
  [...cells].some((key) => availableNeighbors(parseKey(key), cells, new Set()).length === 0);

const growRandomPath = (
  head: GridPoint,
  escapeDirection: ArrowLine["direction"],
  remaining: ReadonlySet<string>,
  random: SeededRandom,
  targetLength: number,
): GridPoint[] => {
  const path = [head];
  const used = new Set<string>([pointKey(head)]);
  let previousDirection: ArrowLine["direction"] | null = null;

  while (path.length < targetLength) {
    const current = path[path.length - 1];
    const candidates = availableNeighbors(current, remaining, used)
      .filter((candidate) => path.length > 1 || directionBetween(current, candidate) === oppositeDirection(escapeDirection));
    if (candidates.length === 0) break;

    const weighted: GridPoint[] = [];
    for (const candidate of candidates) {
      const nextDirection = directionBetween(current, candidate);
      const onward = availableNeighbors(candidate, remaining, new Set([...used, pointKey(candidate)])).length;
      const weight = 1 + onward + (previousDirection && nextDirection !== previousDirection ? 4 : 0);
      for (let count = 0; count < weight; count += 1) weighted.push(candidate);
    }
    const next = random.pick(weighted);
    previousDirection = directionBetween(current, next);
    path.push(next);
    used.add(pointKey(next));
  }

  return path;
};

const countTurns = (points: readonly GridPoint[]): number => {
  let turns = 0;
  for (let index = 2; index < points.length; index += 1) {
    if (directionBetween(points[index - 2], points[index - 1]) !== directionBetween(points[index - 1], points[index])) turns += 1;
  }
  return turns;
};

const createRandomPeelLines = (board: BoardMask, seed: number): ArrowLine[] | null => {
  const random = new SeededRandom(seed);
  const remaining = new Set(board.cells);
  const lines: ArrowLine[] = [];
  let guard = board.cells.size * 5;

  while (remaining.size > 0 && guard > 0) {
    guard -= 1;
    const heads = random.shuffle([...remaining].map(parseKey))
      .map((point) => ({ point, directions: clearDirections(point, remaining, board) }))
      .filter((candidate) => candidate.directions.length > 0);
    if (heads.length === 0) break;

    let selectedPath: GridPoint[] | null = null;
    let selectedDirection: ArrowLine["direction"] | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    const targetMin = remaining.size < 18 ? 2 : 5;
    const targetMax = Math.min(18, Math.max(targetMin, Math.floor(Math.sqrt(remaining.size) * 1.35)));

    for (const candidate of heads.slice(0, 42)) {
      for (const direction of random.shuffle(candidate.directions)) {
        for (let attempt = 0; attempt < 4; attempt += 1) {
          const targetLength = random.int(targetMin, targetMax);
          const path = growRandomPath(candidate.point, direction, remaining, random, targetLength);
          if (path.length < 2) continue;
          const nextRemaining = new Set(remaining);
          for (const point of path) nextRemaining.delete(pointKey(point));
          if (nextRemaining.size === 1 || hasIsolatedCell(nextRemaining)) continue;
          const turns = countTurns(path);
          const score = path.length + turns * 2.8 + random.next() * 3;
          if (score > bestScore) {
            bestScore = score;
            selectedPath = path;
            selectedDirection = direction;
          }
        }
      }
    }

    if (!selectedPath || selectedPath.length < 2 || !selectedDirection) break;
    const line: ArrowLine = {
      id: `L${String(lines.length + 1).padStart(2, "0")}`,
      points: selectedPath,
      direction: selectedDirection,
      color: 0x4b4b4b,
    };
    lines.push(line);
    for (const point of selectedPath) remaining.delete(pointKey(point));
  }

  if (lines.length === 0) return null;
  if (remaining.size / board.cells.size > 0.05) return null;
  return lines;
};

const createLines = (board: BoardMask, levelNumber: number): ArrowLine[] => {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const lines = createRandomPeelLines(board, levelNumber * 104729 + attempt * 7919);
    if (!lines) continue;
    const solution = solveLevel({ board, lines });
    if (solution && lines.some((line) => countTurns(line.points) >= 3)) return lines;
  }
  throw new Error(`Unable to partition designed level ${levelNumber}`);
};

export const generateDesignedLevel = (levelNumber: number): LevelData => {
  const config = DESIGNED_LEVELS[levelNumber - 1];
  if (!config) throw new Error(`Designed level ${levelNumber} does not exist`);
  const board = createDesignedBoard(config.shape, config.variant);
  const lines = createLines(board, levelNumber);
  const solution = solveLevel({ board, lines });
  if (!solution) throw new Error(`Designed level ${levelNumber} is not solvable`);
  const initialChoices = getEscapableLines(lines, board.width, board.height).length;
  const totalLength = lines.reduce((sum, line) => sum + line.points.length, 0);
  return {
    id: `designed-${String(levelNumber).padStart(2, "0")}`,
    seed: levelNumber,
    board,
    lines,
    solution,
    difficulty: {
      score: Math.min(1, 0.12 + levelNumber * 0.13),
      parTimeSeconds: Math.round(10 + totalLength * 0.18),
      dependencyDepth: Math.max(1, lines.length - initialChoices + 1),
      initialChoices,
    },
  };
};
