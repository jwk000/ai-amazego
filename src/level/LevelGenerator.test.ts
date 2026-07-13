import { describe, expect, it } from "vitest";
import { generateLevel } from "./LevelGenerator";
import { solveLevel } from "./LevelSolver";

describe("LevelGenerator fallback", () => {
  it("still generates deterministic fallback levels after the static catalog", () => {
    const first = generateLevel(2000);
    const second = generateLevel(2000);
    expect(first.seed).toBe(second.seed);
    expect(first.lines).toEqual(second.lines);
    expect(solveLevel(first)).not.toBeNull();
  });
});
