import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { pointKey } from "../core/grid";
import type { LevelData } from "../core/types";
import { hasEnclosedHole, isSingleConnectedRegion } from "../level/BoardMaskTopology";
import { solveLevel } from "../level/LevelSolver";
import { GENERATED_LEVEL_COUNT, getLevelPreview } from "./GeneratedLevelRepository";

const readLevel = async (levelNumber: number): Promise<LevelData> => {
  const raw = JSON.parse(await readFile(`public/levels/${String(levelNumber).padStart(4, "0")}.json`, "utf8"));
  return { ...raw, board: { ...raw.board, cells: new Set(raw.board.cells) } } as LevelData;
};

describe("GeneratedLevelRepository", () => {
  it("indexes 1053 high-density filled silhouette levels", () => {
    expect(GENERATED_LEVEL_COUNT).toBe(1053);
    for (let levelNumber = 1; levelNumber <= GENERATED_LEVEL_COUNT; levelNumber += 1) {
      const preview = getLevelPreview(levelNumber);
      expect(preview).toBeDefined();
      expect(preview.activeCells).toBeGreaterThanOrEqual(120);
      expect(preview.width).toBeGreaterThanOrEqual(28);
      expect(preview.height).toBeGreaterThanOrEqual(28);
    }
  });

  it("validates structure for every file and fully solves distributed samples", async () => {
    const samples = new Set([1, 2, 3, 10, 50, 100, 250, 500, 750, 1000, 1053]);
    for (let levelNumber = 1; levelNumber <= GENERATED_LEVEL_COUNT; levelNumber += 1) {
      const level = await readLevel(levelNumber);
      const occupied = new Set(level.lines.flatMap((line) => line.points.map(pointKey)));
      expect(occupied.size / level.board.cells.size).toBeGreaterThanOrEqual(0.95);
      expect(isSingleConnectedRegion(level.board.cells)).toBe(true);
      expect(hasEnclosedHole(level.board.cells, level.board.width, level.board.height)).toBe(false);
      for (const line of level.lines) {
        expect(line.points.length).toBeGreaterThanOrEqual(2);
        const head = line.points[0];
        const body = line.points[1];
        if (line.direction === "left") expect(body.x).toBe(head.x + 1);
        if (line.direction === "right") expect(body.x).toBe(head.x - 1);
        if (line.direction === "up") expect(body.y).toBe(head.y + 1);
        if (line.direction === "down") expect(body.y).toBe(head.y - 1);
      }
      if (samples.has(levelNumber)) expect(solveLevel(level)).not.toBeNull();
    }
  }, 60_000);
});
