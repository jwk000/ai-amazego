import { describe, expect, it } from "vitest";
import { pointKey } from "../core/grid";
import { DESIGNED_LEVELS, generateDesignedLevel } from "./DesignedLevels";
import { solveLevel } from "./LevelSolver";
import { hasEnclosedHole, isSingleConnectedRegion } from "./BoardMaskTopology";

describe("DesignedLevels", () => {
  it("provides one hundred SVG silhouette levels", () => {
    expect(DESIGNED_LEVELS).toHaveLength(100);
    expect(DESIGNED_LEVELS.every((level) => level.shape === "silhouette")).toBe(true);
    expect(new Set(DESIGNED_LEVELS.map((level) => level.name)).size).toBe(100);

    const allDirections = new Set<string>();
    const allLengths: number[] = [];
    let multiTurnLines = 0;
    let totalLines = 0;
    let emptyCells = 0;
    let totalBoardCells = 0;

    DESIGNED_LEVELS.slice(0, 5).forEach((_config, index) => {
      const level = generateDesignedLevel(index + 1);
      const occupied = new Set(level.lines.flatMap((line) => line.points.map(pointKey)));
      expect(occupied.size / level.board.cells.size).toBeGreaterThanOrEqual(0.95);
      for (const key of occupied) expect(level.board.cells.has(key)).toBe(true);
      emptyCells += level.board.cells.size - occupied.size;
      totalBoardCells += level.board.cells.size;
      expect(isSingleConnectedRegion(level.board.cells)).toBe(true);
      expect(hasEnclosedHole(level.board.cells, level.board.width, level.board.height)).toBe(false);
      expect(solveLevel(level)).not.toBeNull();
      expect(level.lines.every((line) => line.color === 0x4b4b4b)).toBe(true);
      expect(level.lines.length).toBeGreaterThanOrEqual(12);

      for (const line of level.lines) {
        expect(line.points.length).toBeGreaterThanOrEqual(2);
        const head = line.points[0];
        const body = line.points[1];
        if (line.direction === "left") expect(body.x).toBe(head.x + 1);
        if (line.direction === "right") expect(body.x).toBe(head.x - 1);
        if (line.direction === "up") expect(body.y).toBe(head.y + 1);
        if (line.direction === "down") expect(body.y).toBe(head.y - 1);
        allDirections.add(line.direction);
        allLengths.push(line.points.length);
        let turns = 0;
        for (let pointIndex = 2; pointIndex < line.points.length; pointIndex += 1) {
          const a = line.points[pointIndex - 2];
          const b = line.points[pointIndex - 1];
          const c = line.points[pointIndex];
          if ((a.x === b.x) !== (b.x === c.x)) turns += 1;
        }
        if (turns >= 2) multiTurnLines += 1;
        totalLines += 1;
      }
    });

    expect(allDirections).toEqual(new Set(["up", "right", "down", "left"]));
    expect(Math.min(...allLengths)).toBeLessThanOrEqual(4);
    expect(Math.max(...allLengths)).toBeGreaterThanOrEqual(12);
    expect(multiTurnLines / totalLines).toBeGreaterThan(0.25);
    expect(emptyCells / totalBoardCells).toBeLessThanOrEqual(0.05);
  });
});
