import { describe, expect, it } from "vitest";
import type { ArrowLine } from "../core/types";
import { advanceLineOneGrid, evaluateMove } from "./MoveEvaluator";

const line = (id: string, points: [number, number][], direction: ArrowLine["direction"]): ArrowLine => ({
  id,
  direction,
  color: 0,
  points: points.map(([x, y]) => ({ x, y })),
});

describe("MoveEvaluator", () => {
  it("moves the head one grid and removes the tail", () => {
    const selected = line("A", [[2, 2], [1, 2], [1, 3]], "right");
    advanceLineOneGrid(selected);
    expect(selected.points).toEqual([{ x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }]);
  });

  it("allows the head to enter the tail cell released in the same frame", () => {
    const selected = line("A", [[1, 1], [1, 2], [2, 2], [2, 1]], "right");
    expect(evaluateMove(selected, [selected], 4, 4).canEscape).toBe(true);
  });

  it("rejects a body cell that is not released this frame", () => {
    const selected = line("A", [[1, 1], [1, 2], [2, 2], [3, 2], [3, 1], [2, 1], [2, 0]], "right");
    expect(evaluateMove(selected, [selected], 5, 5)).toMatchObject({ canEscape: false, blockerId: "A" });
  });

  it("detects another line on the arrow ray", () => {
    const selected = line("A", [[1, 2], [1, 3], [2, 3]], "right");
    const blocker = line("B", [[3, 2], [3, 3]], "up");
    expect(evaluateMove(selected, [selected, blocker], 5, 5)).toMatchObject({ canEscape: false, blockerId: "B" });
  });
});
