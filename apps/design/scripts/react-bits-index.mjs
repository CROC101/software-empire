// Builds src/lib/react-bits.json (names and categories only) from a local clone of
// github.com/DavidHDev/react-bits. The clone is read as text and never run.
// React Bits code is not copied here: its licence (MIT + Commons Clause) forbids
// redistributing the components themselves, so the registry links to reactbits.dev instead.
//   node apps/design/scripts/react-bits-index.mjs D:/projects/_tools/reference/react-bits
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const VARIANTS = ["JS-CSS", "JS-TW", "TS-CSS", "TS-TW"];
const clone = process.argv[2];
if (!clone || !existsSync(join(clone, "src/constants/Categories.js"))) {
  console.error("usage: react-bits-index.mjs <path to a react-bits clone>");
  process.exit(1);
}

const text = readFileSync(join(clone, "src/constants/Categories.js"), "utf8");
const block = text.slice(text.indexOf("export const CATEGORIES"));
const categories = [];
const missing = [];
for (const m of block.matchAll(/name:\s*'([^']+)',\s*subcategories:\s*\[([^\]]*)\]/g)) {
  const [, name, list] = m;
  if (name === "Get Started") continue;
  const items = [];
  for (const [, title] of list.matchAll(/'([^']+)'/g)) {
    const component = title.replace(/\s+/g, "");
    if (VARIANTS.every((v) => existsSync(join(clone, "public/r", `${component}-${v}.json`))))
      items.push({ title, component });
    else missing.push(title);
  }
  categories.push({ name, items });
}

const total = categories.reduce((n, c) => n + c.items.length, 0);
console.assert(
  categories.length >= 4 && total >= 100,
  "parsed too little: Categories.js changed shape?",
);
const commit = execFileSync("git", ["-C", clone, "log", "-1", "--format=%h"], {
  encoding: "utf8",
}).trim();
const out = new URL("../src/lib/react-bits.json", import.meta.url);
writeFileSync(out, `${JSON.stringify({ commit, variants: VARIANTS, categories }, null, 2)}\n`);
console.log(`${String(total)} components in ${String(categories.length)} categories (${commit})`);
if (missing.length) console.log(`skipped, no registry files: ${missing.join(", ")}`);
