import rawLevels from "./generated-levels.json";
import type { LevelData } from "../core/types";

const levels = rawLevels.map((level) => ({
  ...level,
  board: {
    ...level.board,
    cells: new Set(level.board.cells),
  },
})) as LevelData[];

export const GENERATED_LEVEL_COUNT = levels.length;

export const getGeneratedLevel = (levelNumber: number): LevelData => {
  const level = levels[levelNumber - 1];
  if (!level) throw new Error(`Generated level ${levelNumber} does not exist`);
  return level;
};
