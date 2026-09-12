#!/usr/bin/env node
/**
 * Dev-time scaffold for a new PWA component type.
 *
 * Usage:
 *   node scripts/scaffold-component.mjs <type_snake_case> "<Label>" [group] [icon]
 *
 * Example:
 *   node scripts/scaffold-component.mjs newsletter_signup "Newsletter Signup" content Mail
 *
 * This only wires up the mechanical parts (file stub, registry entry, the 3 fixed
 * type-lists). It does NOT write real UI code and does NOT touch the database —
 * see the printed "Still to do" list at the end.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + "/..";

const [, , typeArg, labelArg, groupArg, iconArg] = process.argv;

if (!typeArg || !labelArg) {
  console.error(
    'Usage: node scripts/scaffold-component.mjs <type_snake_case> "<Label>" [group] [icon]'
  );
  process.exit(1);
}

if (!/^[a-z][a-z0-9_]*$/.test(typeArg)) {
  console.error(`Invalid type "${typeArg}" — must be lowercase snake_case, e.g. "newsletter_signup".`);
  process.exit(1);
}

const GROUPS = ["layout", "content", "navigation"];
const group = groupArg || "content";
if (!GROUPS.includes(group)) {
  console.error(`Invalid group "${group}" — must be one of: ${GROUPS.join(", ")}.`);
  process.exit(1);
}

const icon = iconArg || "Puzzle";
const typeSnake = typeArg;
const kebab = typeSnake.replace(/_/g, "-");
const pascal = typeSnake
  .split("_")
  .map((w) => w[0].toUpperCase() + w.slice(1))
  .join("");
const label = labelArg;

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}
function write(relPath, content) {
  fs.writeFileSync(path.join(ROOT, relPath), content);
  console.log(`  wrote ${relPath}`);
}
function fail(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

// --- 1. Guard against duplicates -------------------------------------------------
const registryPath = "apps/pwa/renderer/component-registry.tsx";
const sharedTypesPath = "packages/shared-types/src/index.ts";
const paletteePath = "packages/component-schema/src/index.ts";
const backendModelPath = "backend/app/models/component.py";
const componentFilePath = `apps/pwa/components/${kebab}.tsx`;

if (fs.existsSync(path.join(ROOT, componentFilePath))) {
  fail(`${componentFilePath} already exists — pick a different type name.`);
}
const registrySrc = read(registryPath);
if (registrySrc.includes(`${typeSnake}:`)) {
  fail(`"${typeSnake}" already appears in ${registryPath} — this type already exists.`);
}

// --- 2. Component file stub --------------------------------------------------------
write(
  componentFilePath,
  `import { containerDesignStyle, textDesignStyle } from "@/lib/design-style";

import type { PwaComponentProps } from "./types";

// TODO: implement the real ${label} markup/behavior here.
// Read whatever this component needs from \`section.props\` (CMS-configured fields),
// \`section.resolved_design\` (Design panel overrides), and \`section.items\` (if this
// type is data-bound). Do not fetch data or import other components directly — see
// docs/pwa-data-and-design-tutorial.md for the full contract.
export function ${pascal}({ section }: PwaComponentProps) {
  return (
    <section className="px-4 py-4" style={containerDesignStyle(section.resolved_design)}>
      <p style={textDesignStyle(section.resolved_design)}>
        TODO: ${label} component not yet implemented.
      </p>
    </section>
  );
}
`
);

// --- 3. Register in componentRegistry ----------------------------------------------
{
  const importLine = `import { ${pascal} } from "@/components/${kebab}";\n`;
  const lastComponentImport = [...registrySrc.matchAll(/^import .* from "@\/components\/.*";\n/gm)].pop();
  let next = registrySrc;
  if (lastComponentImport) {
    const insertAt = lastComponentImport.index + lastComponentImport[0].length;
    next = next.slice(0, insertAt) + importLine + next.slice(insertAt);
  } else {
    fail(`Could not find an existing "@/components/*" import in ${registryPath} to anchor on.`);
  }
  const beforeReplace = next;
  next = next.replace(/(\n};\s*)$/, `\n  ${typeSnake}: ${pascal},$1`);
  if (next === beforeReplace) fail(`Could not find the componentRegistry closing brace in ${registryPath}.`);
  write(registryPath, next);
}

// --- 4. shared-types ComponentType union -------------------------------------------
{
  const src = read(sharedTypesPath);
  const next = src.replace(
    /(export type ComponentType =\n(?:\s*\|\s*"[a-z_]+"\n)*)(\s*\|\s*"bottom_navigation";)/,
    (_match, head, tail) => `${head}  | "${typeSnake}"\n${tail}`
  );
  if (next === src) fail(`Could not find ComponentType union in ${sharedTypesPath}.`);
  write(sharedTypesPath, next);
}

// --- 5. component-schema COMPONENT_PALETTE -----------------------------------------
{
  const src = read(paletteePath);
  const entry = `  { type: "${typeSnake}", label: "${label}", icon: "${icon}", group: "${group}" },\n`;
  const marker = "];\n\n/**\n * The named sub-elements";
  if (!src.includes(marker)) {
    fail(`Could not find COMPONENT_PALETTE end-marker in ${paletteePath}.`);
  }
  const next = src.replace(marker, `${entry}${marker}`);
  write(paletteePath, next);
}

// --- 6. backend COMPONENT_TYPES tuple ----------------------------------------------
{
  const src = read(backendModelPath);
  const next = src.replace(
    /(COMPONENT_TYPES = \(\n(?:\s*"[a-z_]+",\n)*)(\))/,
    (_match, head, tail) => `${head}    "${typeSnake}",\n${tail}`
  );
  if (next === src) fail(`Could not find the COMPONENT_TYPES tuple in ${backendModelPath}.`);
  write(backendModelPath, next);
}

console.log(`\n✓ Scaffolded "${typeSnake}" (${label}).`);
console.log(`
Still to do:
  1. Write the real JSX/behavior in ${componentFilePath}
  2. Create its Component metadata record in MongoDB (fields, variants, design_contract)
     — via a seed script entry, or POST /components (already supports it, no CMS button yet)
  3. Restart the backend and PWA dev servers so they pick up the code changes
`);
