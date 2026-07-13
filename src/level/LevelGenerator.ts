import { addPoint, directionVector, oppositeDirection, perpendicularDirections, pointKey } from "../core/grid";
import { SeededRandom } from "../core/SeededRandom";
import type { ArrowLine, BoardMask, Direction, GridPoint, LevelData } from "../core/types";
import { evaluateMove } from "../gameplay/MoveEvaluator";
import { generateBoardMask } from "./BoardMaskGenerator";
import { getEscapableLines, solveLevel } from "./LevelSolver";

const LINE_COLOR = 0x4b4b4b;
const directions: Direction[] = ["up", "right", "down", "left"];

const buildOccupancy = (lines: readonly ArrowLine[]): Set<string> => {
  const occupied = new Set<string>();
  for (const line of lines) for (const point of line.points) occupied.add(pointKey(point));
  return occupied;
};

const rayIsClearOfOthers = (head: GridPoint, direction: Direction, board: BoardMask, occupied: Set<string>): boolean => {
  const vector = directionVector(direction);
  let cursor = addPoint(head, vector);
  const limit = board.width + board.height + 2;
  for (let step = 0; step < limit; step += 1) {
    if (cursor.x < 0 || cursor.y < 0 || cursor.x >= board.width || cursor.y >= board.height) return true;
    if (occupied.has(pointKey(cursor))) return false;
    cursor = addPoint(cursor, vector);
  }
  return false;
};

const candidateHeads = (board: BoardMask, direction: Direction, occupied: Set<string>): GridPoint[] => {
  const result: GridPoint[] = [];
  for (const key of board.cells) {
    const [x, y] = key.split(",").map(Number);
    const point = { x, y };
    if (!occupied.has(key) && rayIsClearOfOthers(point, direction, board, occupied)) result.push(point);
  }
  return result;
};

const createCandidate = (
  id: string,
  board: BoardMask,
  placed: readonly ArrowLine[],
  random: SeededRandom,
  minLength: number,
  maxLength: number,
  maxTurns: number,
): ArrowLine | null => {
  const occupied = buildOccupancy(placed);
  const direction = random.pick(directions);
  const heads = random.shuffle(candidateHeads(board, direction, occupied));
  const targetLength = random.int(minLength, maxLength);

  for (const head of heads.slice(0, 24)) {
    const points: GridPoint[] = [head];
    const own = new Set<string>([pointKey(head)]);
    let walkDirection = oppositeDirection(direction);
    let turns = 0;

    while (points.length < targetLength) {
      const choices: Direction[] = [walkDirection];
      if (turns < maxTurns && points.length > 1) {
        const perpendicular = perpendicularDirections(walkDirection);
        choices.push(...perpendicular, ...perpendicular);
      }
      const shuffled = random.shuffle(choices);
      let added = false;

      for (const nextDirection of shuffled) {
        const next = addPoint(points[points.length - 1], directionVector(nextDirection));
        const key = pointKey(next);
        if (!board.cells.has(key) || occupied.has(key) || own.has(key)) continue;
        if (nextDirection !== walkDirection) turns += 1;
        walkDirection = nextDirection;
        points.push(next);
        own.add(key);
        added = true;
        break;
      }

      if (!added) break;
    }

    if (points.length < minLength) continue;
    const candidate: ArrowLine = { id, points, direction, color: LINE_COLOR };
    if (evaluateMove(candidate, [...placed, candidate], board.width, board.height).canEscape) return candidate;
  }

  return null;
};

const computeDependencyDepth = (lines: readonly ArrowLine[], width: number, height: number): number => {
  let remaining = [...lines];
  let depth = 0;
  while (remaining.length > 0) {
    const escapable = new Set(getEscapableLines(remaining, width, height));
    if (escapable.size === 0) return lines.length;
    remaining = remaining.filter((line) => !escapable.has(line.id));
    depth += 1;
  }
  return depth;
};

export const generateLevel = (levelNumber: number): LevelData => {
  const baseSeed = 104729 * levelNumber + 7919;

  for (let restart = 0; restart < 80; restart += 1) {
    const seed = baseSeed + restart * 97;
    const random = new SeededRandom(seed);
    const board = generateBoardMask(levelNumber, random);
    const targetCount = Math.min(34, 10 + Math.floor(levelNumber * 0.8));
    const minLength = Math.min(7, 5 + Math.floor(levelNumber / 12));
    const maxLength = Math.min(16, 10 + Math.floor(levelNumber / 4));
    const maxTurns = Math.min(9, 6 + Math.floor(levelNumber / 10));
    const placed: ArrowLine[] = [];
    let failures = 0;

    while (placed.length < targetCount && failures < 180) {
      const id = `L${String(placed.length + 1).padStart(2, "0")}`;
      const candidate = createCandidate(id, board, placed, random, minLength, maxLength, maxTurns);
      if (candidate) {
        placed.push(candidate);
        failures = 0;
      } else {
        failures += 1;
      }
    }

    if (placed.length < Math.max(6, targetCount - 2)) continue;

    const occupiedCells = buildOccupancy(placed);
    const filledBoard: BoardMask = { ...board, cells: occupiedCells };
    const provisional = { board: filledBoard, lines: placed };
    const solution = solveLevel(provisional);
    if (!solution) continue;

    const initialChoices = getEscapableLines(placed, board.width, board.height).length;
    const dependencyDepth = computeDependencyDepth(placed, board.width, board.height);
    const totalTurns = placed.reduce((sum, line) => {
      let turns = 0;
      for (let index = 2; index < line.points.length; index += 1) {
        const before = line.points[index - 2];
        const middle = line.points[index - 1];
        const after = line.points[index];
        if ((before.x === middle.x) !== (middle.x === after.x)) turns += 1;
      }
      return sum + turns;
    }, 0);
    const parTimeSeconds = Math.round(8 + placed.length * 1.5 + dependencyDepth * 2 + totalTurns * 0.12);
    const score = Math.min(1, placed.length / 30 * 0.35 + dependencyDepth / 12 * 0.45 + (1 / initialChoices) * 0.2);

    return {
      id: `campaign-${String(levelNumber).padStart(4, "0")}`,
      seed,
      board: filledBoard,
      lines: placed,
      solution,
      difficulty: { score, parTimeSeconds, dependencyDepth, initialChoices },
    };
  }

  throw new Error(`Unable to generate level ${levelNumber}`);
};
