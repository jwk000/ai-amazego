import { describe, expect, it } from "vitest";
import { DESIGNED_LEVELS } from "./DesignedLevels";

describe("DesignedLevels catalog", () => {
  it("provides 510 deduplicated filled SVG silhouette entries", () => {
    expect(DESIGNED_LEVELS).toHaveLength(510);
    expect(DESIGNED_LEVELS.every((level) => level.shape === "silhouette")).toBe(true);
    expect(DESIGNED_LEVELS.map((level) => level.name)).toEqual(
      Array.from({ length: 510 }, (_, index) => `关卡 ${index + 1}`),
    );
  });
});
