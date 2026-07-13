export type Direction = "up" | "right" | "down" | "left";

export type GridPoint = Readonly<{ x: number; y: number }>;
export type BoardShape = "rectangle" | "circle" | "diamond" | "triangle" | "cloud" | "silhouette";

export type ArrowLine = {
  id: string;
  points: GridPoint[];
  direction: Direction;
  color: number;
};

export type BoardMask = {
  width: number;
  height: number;
  cells: Set<string>;
  shape: BoardShape;
};

export type LevelDifficulty = {
  score: number;
  parTimeSeconds: number;
  dependencyDepth: number;
  initialChoices: number;
};

export type LevelData = {
  id: string;
  seed: number;
  board: BoardMask;
  lines: ArrowLine[];
  solution: string[];
  difficulty: LevelDifficulty;
};

export type MoveResult =
  | { canEscape: true }
  | { canEscape: false; blockerId: string; blockerPoint: GridPoint };
