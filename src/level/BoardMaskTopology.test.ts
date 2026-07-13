import { describe, expect, it } from "vitest";
import { fillEnclosedHoles, hasEnclosedHole, isSingleConnectedRegion, keepLargestConnectedRegion } from "./BoardMaskTopology";

describe("BoardMaskTopology", () => {
  it("fills enclosed holes but preserves exterior empty space", () => {
    const ring = new Set([
      "1,1", "2,1", "3,1",
      "1,2",        "3,2",
      "1,3", "2,3", "3,3",
    ]);
    expect(hasEnclosedHole(ring, 5, 5)).toBe(true);
    const filled = fillEnclosedHoles(ring, 5, 5);
    expect(filled.has("2,2")).toBe(true);
    expect(filled.has("0,0")).toBe(false);
  });

  it("keeps only one connected silhouette", () => {
    const cells = new Set(["0,0", "1,0", "1,1", "4,4"]);
    const largest = keepLargestConnectedRegion(cells);
    expect(largest).toEqual(new Set(["0,0", "1,0", "1,1"]));
    expect(isSingleConnectedRegion(largest)).toBe(true);
  });
});
