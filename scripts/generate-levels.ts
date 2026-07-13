import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DESIGNED_LEVELS, generateDesignedLevel } from "../src/level/DesignedLevels";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "src/data/generated-levels.json");

const levels = DESIGNED_LEVELS.map((_definition, index) => {
  const level = generateDesignedLevel(index + 1);
  return {
    ...level,
    board: {
      ...level.board,
      cells: [...level.board.cells],
    },
  };
});

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(levels)}\n`, "utf8");
console.log(`Generated ${levels.length} levels at ${output}`);
