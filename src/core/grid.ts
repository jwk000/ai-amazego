import type { Direction, GridPoint } from "./types";

export const pointKey = (point: GridPoint): string => `${point.x},${point.y}`;

export const directionVector = (direction: Direction): GridPoint => {
  switch (direction) {
    case "up": return { x: 0, y: -1 };
    case "right": return { x: 1, y: 0 };
    case "down": return { x: 0, y: 1 };
    case "left": return { x: -1, y: 0 };
  }
};

export const addPoint = (left: GridPoint, right: GridPoint): GridPoint => ({
  x: left.x + right.x,
  y: left.y + right.y,
});

export const equalPoint = (left: GridPoint, right: GridPoint): boolean =>
  left.x === right.x && left.y === right.y;

export const isInsideBounds = (point: GridPoint, width: number, height: number): boolean =>
  point.x >= 0 && point.y >= 0 && point.x < width && point.y < height;

export const oppositeDirection = (direction: Direction): Direction => {
  switch (direction) {
    case "up": return "down";
    case "right": return "left";
    case "down": return "up";
    case "left": return "right";
  }
};

export const perpendicularDirections = (direction: Direction): Direction[] =>
  direction === "up" || direction === "down" ? ["left", "right"] : ["up", "down"];
