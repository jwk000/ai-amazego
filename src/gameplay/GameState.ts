import type { ArrowLine, LevelData } from "../core/types";

export class GameState {
  readonly level: LevelData;
  lines: ArrowLine[];
  water = 3;
  wrongTaps = 0;
  elapsedSeconds = 0;
  startedAt = Date.now();

  constructor(level: LevelData) {
    this.level = level;
    this.lines = level.lines.map((line) => ({ ...line, points: line.points.map((point) => ({ ...point })) }));
  }

  resetTimer(): void {
    this.startedAt = Date.now();
    this.elapsedSeconds = 0;
  }

  updateTimer(): void {
    this.elapsedSeconds = (Date.now() - this.startedAt) / 1000;
  }

  removeLine(id: string): void {
    this.lines = this.lines.filter((line) => line.id !== id);
  }

  loseWater(): void {
    this.water = Math.max(0, this.water - 1);
    this.wrongTaps += 1;
  }
}
