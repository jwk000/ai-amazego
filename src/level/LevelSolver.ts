import type { ArrowLine, LevelData } from "../core/types";
import { evaluateMove } from "../gameplay/MoveEvaluator";

export const getEscapableLines = (lines: readonly ArrowLine[], width: number, height: number): string[] =>
  lines.filter((line) => evaluateMove(line, lines, width, height).canEscape).map((line) => line.id);

export const solveLevel = (level: Pick<LevelData, "board" | "lines">): string[] | null => {
  const memo = new Map<string, string[] | null>();

  const search = (remaining: ArrowLine[]): string[] | null => {
    if (remaining.length === 0) return [];
    const key = remaining.map((line) => line.id).sort().join("|");
    if (memo.has(key)) return memo.get(key) ?? null;

    for (const id of getEscapableLines(remaining, level.board.width, level.board.height)) {
      const next = remaining.filter((line) => line.id !== id);
      const suffix = search(next);
      if (suffix) {
        const solution = [id, ...suffix];
        memo.set(key, solution);
        return solution;
      }
    }

    memo.set(key, null);
    return null;
  };

  return search(level.lines.map((line) => ({ ...line, points: [...line.points] })));
};
