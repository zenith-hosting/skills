#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const checkout = process.argv[2];
if (!checkout || process.argv.length !== 3) {
  throw new Error("Usage: node scripts/sync-contract.mjs <zenith-checkout>");
}

// Only these public contract files belong in the distributable skill.
const names = [
  "zenith-compose.schema.json",
  "zenith-dev-compose.schema.json",
  "dev-env-policy.json",
];
const sourceRoot = resolve(checkout);
const git = (...args) => execFileSync("git", ["-C", sourceRoot, ...args], { encoding: "utf8" }).trim();
const sourceCommit = git("rev-parse", "HEAD");
const sourcePaths = names.map((name) => `contract/${name}`);
if (git("status", "--porcelain", "--", ...sourcePaths)) {
  throw new Error("Commit or discard changes to the public contract files before syncing their provenance.");
}

const files = await Promise.all(names.map(async (name) => {
  // Require the file to exist at the recorded commit as well as in the checkout.
  git("cat-file", "-e", `${sourceCommit}:contract/${name}`);
  const bytes = await readFile(resolve(sourceRoot, "contract", name));
  JSON.parse(bytes.toString("utf8"));
  return { name, bytes, sha256: createHash("sha256").update(bytes).digest("hex") };
}));

const target = fileURLToPath(new URL("../skills/zenith-compose/references/", import.meta.url));
await mkdir(target, { recursive: true });
for (const { name, bytes } of files) {
  await writeFile(resolve(target, name), bytes);
}
await writeFile(resolve(target, "contract-source.json"), `${JSON.stringify({
  sourceCommit,
  files: Object.fromEntries(files.map(({ name, sha256 }) => [name, { sourcePath: `contract/${name}`, sha256 }])),
}, null, 2)}\n`);
console.log(`Synced ${files.length} public contract files at ${sourceCommit}.`);
