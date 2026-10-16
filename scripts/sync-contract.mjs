#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const checkout = process.argv[2];
if (!checkout || process.argv.length !== 3) {
  throw new Error("Usage: node scripts/sync-contract.mjs <zenith-cli-checkout>");
}

// Only these public contract files belong in the distributable skill.
const sources = [
  { sourcePath: "src/lint/compose.schema.json", name: "zenith-compose.schema.json" },
  { sourcePath: "src/lint/dev-compose.schema.json", name: "zenith-dev-compose.schema.json" },
  { sourcePath: "src/lint/dev-env-policy.json", name: "dev-env-policy.json" },
];
const sourceRepository = "https://github.com/zenith-hosting/zenith-cli";
const schemaScope = "Structural validation aid only, not a guarantee of Zenith runtime support or acceptance. Live documentation is authoritative: https://docs.zenith.hosting/content/zenith-compose.md and https://docs.zenith.hosting/content/zenith-compose-reference.md. Run the documented CLI checks as well.";
const publicFields = {
  xZenith: ["catalog", "expose", "storage", "configs", "env"],
  catalog: ["name", "description", "authors", "tags", "source", "license", "detail", "funding", "alternatives", "website"],
  expose: ["service", "port", "label", "web"],
  storage: ["volume", "label", "description", "public"],
  xZenithConfig: ["path", "description", "type"],
  input: ["label", "description", "default", "default_template", "required", "validator", "secret"],
  envVar: ["input", "generate", "template", "alias", "services", "legacy", "transform"],
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

// Fail closed when upstream moves or changes a description we override.
function overrideDescription(schema, path, expected, description) {
  const node = path.reduce((value, key) => value?.[key], schema);
  if (!node || node.description !== expected) {
    throw new Error(`Unexpected source schema at ${path.join("/")}; review the Zenith description override.`);
  }
  node.description = description;
}

function zenithDescriptions(schema) {
  overrideDescription(schema,
    ["$defs", "service_config_or_secret", "items", "oneOf", 1, "properties", "mode"],
    "File permission mode inside the container, in octal. Default is 0444 for configs and 0400 for secrets.",
    "File permission mode inside the container, in octal. Zenith config mounts default to the Kubernetes ConfigMap mode, 0644. Quote octal values if your YAML tooling would otherwise convert them. See the live documentation for secret mount behavior.");
  overrideDescription(schema,
    ["$defs", "workload_spec", "properties", "depends_on"],
    "Express dependency between services. Service dependencies cause services to be started in dependency order. The dependent service will wait for the dependency to be ready before starting.",
    "Express dependencies between services. In Zenith, only long-form condition: service_healthy creates a wait for readiness. Short-form dependencies, service_started, and service_completed_successfully do not create runtime ordering.");
  overrideDescription(schema,
    ["$defs", "workload_spec", "properties", "depends_on", "oneOf", 1, "patternProperties", "^[a-zA-Z0-9._-]+$", "properties", "condition"],
    "Condition to wait for. 'service_started' waits until the service has started, 'service_healthy' waits until the service is healthy (as defined by its healthcheck), 'service_completed_successfully' waits until the service has completed successfully.",
    "In Zenith, only service_healthy waits for the dependency's readiness signal. service_started and service_completed_successfully do not create runtime ordering.");
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
const sourcePaths = sources.map(({ sourcePath }) => sourcePath);
if (git("status", "--porcelain", "--", ...sourcePaths)) {
  throw new Error("Commit or discard changes to the public contract files before syncing their provenance.");
}

const files = await Promise.all(sources.map(async ({ name, sourcePath }) => {
  // Require the file to exist at the recorded commit as well as in the checkout.
  const committed = execFileSync("git", ["-C", sourceRoot, "show", `${sourceCommit}:${sourcePath}`]);
  const source = await readFile(resolve(sourceRoot, sourcePath));
  if (!source.equals(committed)) throw new Error(`Source differs from ${sourceCommit}: ${sourcePath}`);
  const schema = JSON.parse(source.toString("utf8"));
  let bytes = source;
  if (name.endsWith(".schema.json")) {
    if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema" || schema.type !== "object") {
      throw new Error(`Unexpected source schema: ${sourcePath}`);
    }
    if (name === "zenith-compose.schema.json") {
      zenithDescriptions(schema);
      developerSchema(schema);
    }
    schema.$comment = schemaScope;
    bytes = Buffer.from(`${JSON.stringify(schema, null, 2)}\n`);
  }
  return {
    name,
    sourcePath,
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
  sourceRepository,
  sourceCommit,
  files: Object.fromEntries(files.map(({ name, sourcePath, sourceSha256, sha256 }) => [name, { sourcePath, sourceSha256, sha256 }])),
}, null, 2)}\n`);
console.log(`Synced ${files.length} public contract files at ${sourceCommit}.`);
