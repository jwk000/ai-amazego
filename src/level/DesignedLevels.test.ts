import { describe, expect, it } from "vitest";
import { DESIGNED_LEVELS } from "./DesignedLevels";

describe("DesignedLevels catalog", () => {
  it("provides 1053 unique filled SVG silhouette entries", () => {
    expect(DESIGNED_LEVELS).toHaveLength(1053);
    expect(DESIGNED_LEVELS.every((level) => level.shape === "silhouette")).toBe(true);
    expect(new Set(DESIGNED_LEVELS.map((level) => level.name)).size).toBe(1053);
  });
});
