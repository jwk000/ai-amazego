import { describe, expect, it } from "vitest";
import { pointKey } from "../core/grid";
import { hasEnclosedHole, isSingleConnectedRegion } from "../level/BoardMaskTopology";
import { solveLevel } from "../level/LevelSolver";
import { GENERATED_LEVEL_COUNT, getGeneratedLevel } from "./GeneratedLevelRepository";

describe("GeneratedLevelRepository", () => {
  it("contains 100 valid pre-generated levels", () => {
    expect(GENERATED_LEVEL_COUNT).toBe(100);
    for (let levelNumber = 1; levelNumber <= GENERATED_LEVEL_COUNT; levelNumber += 1) {
      const level = getGeneratedLevel(levelNumber);
      const occupied = new Set(level.lines.flatMap((line) => line.points.map(pointKey)));
      expect(occupied.size / level.board.cells.size).toBeGreaterThanOrEqual(0.95);
      expect(isSingleConnectedRegion(level.board.cells)).toBe(true);
      expect(hasEnclosedHole(level.board.cells, level.board.width, level.board.height)).toBe(false);
      expect(solveLevel(level)).not.toBeNull();
      for (const line of level.lines) {
        expect(line.points.length).toBeGreaterThanOrEqual(2);
        const head = line.points[0];
        const body = line.points[1];
        if (line.direction === "left") expect(body.x).toBe(head.x + 1);
        if (line.direction === "right") expect(body.x).toBe(head.x - 1);
        if (line.direction === "up") expect(body.y).toBe(head.y + 1);
        if (line.direction === "down") expect(body.y).toBe(head.y - 1);
      }
    }
  }, 30_000);
});
