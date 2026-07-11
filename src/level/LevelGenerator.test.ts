import { describe, expect, it } from "vitest";
import { pointKey } from "../core/grid";
import { evaluateMove } from "../gameplay/MoveEvaluator";
import { generateLevel } from "./LevelGenerator";
import { solveLevel } from "./LevelSolver";

describe("LevelGenerator", () => {
  it("generates deterministic solvable levels", () => {
    for (let levelNumber = 1; levelNumber <= 12; levelNumber += 1) {
      const first = generateLevel(levelNumber);
      const second = generateLevel(levelNumber);
      expect(first.seed).toBe(second.seed);
      expect(first.lines).toEqual(second.lines);
      expect(solveLevel(first)).not.toBeNull();

      const occupied = new Set<string>();
      for (const line of first.lines) {
        expect(evaluateMove(line, first.lines, first.board.width, first.board.height)).toBeDefined();
        for (const point of line.points) {
          const key = pointKey(point);
          expect(first.board.cells.has(key)).toBe(true);
          expect(occupied.has(key)).toBe(false);
          occupied.add(key);
        }
      }
    }
  }, 20_000);
});
