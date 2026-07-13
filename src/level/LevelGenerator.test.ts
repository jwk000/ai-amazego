import { describe, expect, it } from "vitest";
import { pointKey } from "../core/grid";
import { evaluateMove } from "../gameplay/MoveEvaluator";
import { generateLevel } from "./LevelGenerator";
import { solveLevel } from "./LevelSolver";

describe("LevelGenerator", () => {
  it("generates deterministic solvable levels", () => {
    for (let levelNumber = 1; levelNumber <= 20; levelNumber += 1) {
      const first = generateLevel(levelNumber);
      const second = generateLevel(levelNumber);
      expect(first.seed).toBe(second.seed);
      expect(first.lines).toEqual(second.lines);
      expect(solveLevel(first)).not.toBeNull();
      expect(first.lines.length).toBeGreaterThanOrEqual(9);
      expect(first.board.cells.size).toBeGreaterThanOrEqual(45);

      const occupied = new Set<string>();
      for (const line of first.lines) {
        expect(line.color).toBe(0x4b4b4b);
        expect(evaluateMove(line, first.lines, first.board.width, first.board.height)).toBeDefined();
        for (const point of line.points) {
          const key = pointKey(point);
          expect(first.board.cells.has(key)).toBe(true);
          expect(occupied.has(key)).toBe(false);
          occupied.add(key);
        }
      }
      expect(occupied.size / first.board.cells.size).toBeGreaterThanOrEqual(0.95);
      for (const key of occupied) expect(first.board.cells.has(key)).toBe(true);
      const averageLength = first.lines.reduce((sum, line) => sum + line.points.length, 0) / first.lines.length;
      expect(averageLength).toBeGreaterThanOrEqual(4.5);
    }
  }, 20_000);
});
