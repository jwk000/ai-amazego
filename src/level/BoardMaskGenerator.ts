import { pointKey } from "../core/grid";
import { SeededRandom } from "../core/SeededRandom";
import type { BoardMask } from "../core/types";
import { normalizeSolidSilhouette } from "./BoardMaskTopology";

export const generateBoardMask = (levelNumber: number, random: SeededRandom): BoardMask => {
  const width = Math.min(20, 14 + Math.floor(levelNumber / 5));
  const height = Math.min(28, 20 + Math.floor(levelNumber / 4));
  const shape = random.pick<BoardMask["shape"]>(["rectangle", "circle", "diamond", "triangle", "cloud"]);
  const cells = new Set<string>();
  const centerX = (width - 1) / 2;
  const centerY = (height - 1) / 2;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = Math.abs(x - centerX) / Math.max(1, centerX);
      const ny = Math.abs(y - centerY) / Math.max(1, centerY);
      let enabled = true;
      if (shape === "rectangle") enabled = nx ** 4 + ny ** 4 < 1.35;
      if (shape === "circle") enabled = nx ** 2 + ny ** 2 < 1.08;
      if (shape === "diamond") enabled = nx + ny < 1.28;
      if (shape === "triangle") enabled = ny > -0.9 && nx < (ny + 1) * 0.55;
      if (shape === "cloud") {
        const wave = Math.sin((x + levelNumber) * 0.7) * 0.08 + Math.cos(y * 0.55) * 0.08;
        enabled = nx ** 2 + ny ** 2 < 1.08 + wave;
      }
      if (enabled) cells.add(pointKey({ x, y }));
    }
  }

  return { width, height, cells: normalizeSolidSilhouette(cells, width, height), shape };
};
