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
const publicFields = {
  xZenith: ["catalog", "expose", "storage", "configs", "env"],
  catalog: ["name", "description", "authors", "tags", "source", "license", "detail", "funding", "alternatives", "website"],
  expose: ["service", "port", "label", "web"],
  storage: ["volume", "label", "description", "public"],
  xZenithConfig: ["path", "description", "type"],
  input: ["label", "description", "default", "default_template", "required", "validator", "secret"],
  envVar: ["input", "generate", "template", "alias", "services", "transform"],
};

function filterFields(value, allowed) {
  if (Array.isArray(value)) {
    for (const entry of value) filterFields(entry, allowed);
  } else if (value !== null && typeof value === "object") {
    if (Array.isArray(value.required) && value.required.some((name) => !allowed.includes(name))) {
      throw new Error("Source contract requires a field outside the developer contract. Review the public field allowlists.");
    }
    if (value.properties) {
      value.properties = Object.fromEntries(
        Object.entries(value.properties).filter(([name]) => allowed.includes(name))
      );
    }
    for (const entry of Object.values(value)) filterFields(entry, allowed);
  }
}

function developerSchema(schema) {
  for (const [name, allowed] of Object.entries(publicFields)) {
    if (!schema.$defs?.[name]) throw new Error(`Missing contract definition: ${name}`);
    filterFields(schema.$defs[name], allowed);
  }
  const referenced = new Set();
  function visit(value) {
    if (Array.isArray(value)) {
      for (const entry of value) visit(entry);
    } else if (value !== null && typeof value === "object") {
      if (typeof value.$ref === "string" && value.$ref.startsWith("#/$defs/")) {
        const name = value.$ref.slice("#/$defs/".length);
        if (!referenced.has(name)) {
          if (!schema.$defs[name]) throw new Error(`Missing schema reference: ${name}`);
          referenced.add(name);
          visit(schema.$defs[name]);
        }
      }
      for (const [name, entry] of Object.entries(value)) {
        if (name !== "$defs") visit(entry);
      }
    }
  }
  visit(schema);
  schema.$defs = Object.fromEntries(
    Object.entries(schema.$defs).filter(([name]) => referenced.has(name))
  );
  return schema;
}
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
  const source = await readFile(resolve(sourceRoot, "contract", name));
  const schema = JSON.parse(source.toString("utf8"));
  const bytes = name === "zenith-compose.schema.json"
    ? Buffer.from(`${JSON.stringify(developerSchema(schema), null, 2)}\n`)
    : source;
  return {
    name,
    bytes,
    sourceSha256: createHash("sha256").update(source).digest("hex"),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}));

const target = fileURLToPath(new URL("../skills/zenith-compose/references/", import.meta.url));
await mkdir(target, { recursive: true });
for (const { name, bytes } of files) {
  await writeFile(resolve(target, name), bytes);
}
await writeFile(resolve(target, "contract-source.json"), `${JSON.stringify({
  sourceCommit,
  files: Object.fromEntries(files.map(({ name, sourceSha256, sha256 }) => [name, { sourcePath: `contract/${name}`, sourceSha256, sha256 }])),
}, null, 2)}\n`);
console.log(`Synced ${files.length} public contract files at ${sourceCommit}.`);
