import { describe, expect, it } from "vitest";
import type { ArrowLine } from "../core/types";
import { findNearestLine } from "./LineHitTest";

const makeLine = (id: string, y: number): ArrowLine => ({
  id,
  direction: "right",
  color: 0x4b4b4b,
  points: [{ x: 1, y }, { x: 2, y }, { x: 3, y }],
});

describe("LineHitTest", () => {
  it("selects only the nearest line when hit ranges overlap", () => {
    const upper = makeLine("upper", 2);
    const lower = makeLine("lower", 2.7);
    expect(findNearestLine([upper, lower], { x: 2, y: 2.18 }, 0.46)?.id).toBe("upper");
    expect(findNearestLine([upper, lower], { x: 2, y: 2.58 }, 0.46)?.id).toBe("lower");
  });

  it("returns null outside the touch threshold", () => {
    expect(findNearestLine([makeLine("line", 2)], { x: 2, y: 2.6 }, 0.46)).toBeNull();
  });
});
