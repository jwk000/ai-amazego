import { rm, mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { DESIGNED_LEVELS } from "../src/level/DesignedLevels";

const clean = process.argv.includes("--clean");
const concurrency = Math.max(1, Number(process.env.LEVEL_JOBS ?? 8));
if (clean) await rm("public/levels", { recursive: true, force: true });
await mkdir("public/levels", { recursive: true });

let cursor = 1;
let failed = 0;
const runWorker = (levelNumber: number): Promise<void> => new Promise((resolve) => {
  const child = spawn("npx", ["tsx", "scripts/generate-level-worker.ts", String(levelNumber)], { stdio: ["ignore", "ignore", "inherit"] });
  child.on("close", (code) => {
    if (code !== 0) failed += 1;
    resolve();
  });
});

const worker = async (): Promise<void> => {
  while (cursor <= DESIGNED_LEVELS.length) {
    const levelNumber = cursor;
    cursor += 1;
    await runWorker(levelNumber);
    if (levelNumber % 25 === 0) console.log(`progress ${levelNumber}/${DESIGNED_LEVELS.length}`);
  }
};

await Promise.all(Array.from({ length: concurrency }, () => worker()));
const catalog = DESIGNED_LEVELS.map((level, index) => ({
  levelNumber: index + 1,
  name: level.name,
  shape: level.shape,
  file: `levels/${String(index + 1).padStart(4, "0")}.json`,
}));
await writeFile("public/levels/catalog.json", `${JSON.stringify(catalog)}\n`);
console.log(JSON.stringify({ levels: DESIGNED_LEVELS.length, failed, concurrency }));
if (failed > 0) process.exitCode = 1;
