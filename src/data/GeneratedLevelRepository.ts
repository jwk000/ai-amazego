import type { LevelData } from "../core/types";
import silhouetteBoards from "./silhouette-boards.json";

export const GENERATED_LEVEL_COUNT = silhouetteBoards.length;
const cache = new Map<number, LevelData>();

export const getLevelPreview = (levelNumber: number) => silhouetteBoards[levelNumber - 1];

export const getGeneratedLevel = async (levelNumber: number): Promise<LevelData> => {
  const cached = cache.get(levelNumber);
  if (cached) return cached;
  if (levelNumber < 1 || levelNumber > GENERATED_LEVEL_COUNT) throw new Error(`Generated level ${levelNumber} does not exist`);
  const response = await fetch(`./levels/${String(levelNumber).padStart(4, "0")}.json`);
  if (!response.ok) throw new Error(`Unable to load level ${levelNumber}: ${response.status}`);
  const raw = await response.json() as Omit<LevelData, "board"> & { board: Omit<LevelData["board"], "cells"> & { cells: string[] } };
  const level = { ...raw, board: { ...raw.board, cells: new Set(raw.board.cells) } } as LevelData;
  cache.set(levelNumber, level);
  return level;
};
