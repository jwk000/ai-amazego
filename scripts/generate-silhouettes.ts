import { access, readFile, stat } from "node:fs/promises";
import { spawn } from "node:child_process";

type PromptRecord = {
  id: string;
  category: string;
  name: string;
  prompt: string;
  negativePrompt: string;
  output: string;
};

const args = process.argv.slice(2);
const valueOf = (flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const category = valueOf("--category");
const start = Number(valueOf("--start") ?? 1);
const end = Number(valueOf("--end") ?? Number.MAX_SAFE_INTEGER);
const model = valueOf("--model") ?? "tencent/gpt-image-2";
const force = args.includes("--force");
const dryRun = args.includes("--dry-run");

const records = JSON.parse(await readFile("assets/silhouettes/prompts.json", "utf8")) as PromptRecord[];
const selected = records.filter((record) => {
  if (category && record.category !== category) return false;
  const categoryIndex = records.filter((candidate) => candidate.category === record.category).findIndex((candidate) => candidate.id === record.id) + 1;
  return categoryIndex >= start && categoryIndex <= end;
});

const existsAndValid = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return (await stat(path)).size > 10_000;
  } catch {
    return false;
  }
};

const run = (command: string, commandArgs: string[]): Promise<number> => new Promise((resolve) => {
  const child = spawn(command, commandArgs, { stdio: "inherit" });
  child.on("close", (code) => resolve(code ?? 1));
});

let succeeded = 0;
let failed = 0;
let skipped = 0;

for (const [index, record] of selected.entries()) {
  if (!force && await existsAndValid(record.output)) {
    skipped += 1;
    console.log(`[${index + 1}/${selected.length}] skip ${record.id}`);
    continue;
  }

  const prompt = `${record.prompt}. Avoid: ${record.negativePrompt}.`;
  console.log(`[${index + 1}/${selected.length}] generate ${record.id}`);
  if (dryRun) continue;

  let success = false;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const commandArgs = ["generate", "image", prompt, "--model", model, "--size", "1024x1024", "--quality", "medium", "-o", record.output, "--json"];
    const exitCode = await run("animal-mediakit", commandArgs);
    if (exitCode === 0 && await existsAndValid(record.output)) {
      success = true;
      break;
    }
    console.warn(`${record.id} attempt ${attempt} failed`);
  }

  if (success) succeeded += 1;
  else failed += 1;
}

console.log(JSON.stringify({ selected: selected.length, succeeded, failed, skipped, model }, null, 2));
if (failed > 0) process.exitCode = 1;
