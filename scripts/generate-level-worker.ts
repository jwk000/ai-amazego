import { mkdir, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { generateDesignedLevel } from "../src/level/DesignedLevels";

const levelNumber = Number(process.argv[2]);
if (!Number.isInteger(levelNumber) || levelNumber < 1) throw new Error("level number required");
const output = resolve("public/levels", `${String(levelNumber).padStart(4, "0")}.json`);
try {
  await access(output);
  process.exit(0);
} catch {
  // Generate missing file.
}
const level = generateDesignedLevel(levelNumber);
const serializable = { ...level, board: { ...level.board, cells: [...level.board.cells] } };
await mkdir(resolve("public/levels"), { recursive: true });
await writeFile(output, `${JSON.stringify(serializable)}\n`);
console.log(`generated ${levelNumber}`);
