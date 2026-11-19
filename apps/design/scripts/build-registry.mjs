// Builds the public registry from src/registry (meta + ui files), shadcn compatible:
//   public/r/<slug>.json   one registry-item per part (https://ui.shadcn.com/schema/registry-item.json)
//   public/r/index.json    the catalogue (https://ui.shadcn.com/schema/registry.json, files without content)
//   public/llms.txt        short index for agents, llms-full.txt the full docs
//   public/croc-ui.mjs     our zero-dependency CLI (copied from scripts/croc-ui.mjs)
// All of these are generated: gitignored, rebuilt by `build` and `dev`. `--self-test` checks the parsers.
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");
const uiRoot = path.resolve(app, "../../packages/ui");
const FALLBACK_URL = "https://crocwork-design.crocwork.workers.dev";
const ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";
const TOKENS = "croc-tokens";
const PEERS = new Set(["react", "react-dom"]);

/** Every import statement of a module: its specifier and the named bindings (type-only ones dropped). */
export function importsOf(src) {
  const out = [];
  const re =
    /^import\s+(?:(type)\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["'];?[ \t]*$|^import\s+["']([^"']+)["'];?[ \t]*$/gm;
  for (const m of src.matchAll(re)) {
    if (m[4]) {
      out.push({ statement: m[0], spec: m[4], names: [], typeOnly: false });
      continue;
    }
    const clause = m[2];
    const braces = clause.match(/\{([\s\S]*)\}/);
    const names = braces
      ? braces[1]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    out.push({ statement: m[0], spec: m[3], names, typeOnly: Boolean(m[1]) });
  }
  return out;
}

/** "motion/react" -> "motion", "@radix-ui/react-slot/x" -> "@radix-ui/react-slot" */
export const pkgName = (spec) =>
  spec
    .split("/")
    .slice(0, spec.startsWith("@") ? 2 : 1)
    .join("/");

const external = (spec) =>
  !spec.startsWith(".") && !spec.startsWith("@/") && !spec.startsWith("@empire/");

/** exported name -> "components/x" | "lib/x", read from the packages/ui barrel */
export function exportMap(barrel) {
  const map = new Map();
  for (const m of barrel.matchAll(/export\s*\{([\s\S]*?)\}\s*from\s*["']\.\/([^"']+)["']/g)) {
    for (const raw of m[1].split(",")) {
      const name = raw
        .trim()
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)
        .pop();
      if (name) map.set(name, m[2]);
    }
  }
  return map;
}

/** packages/ui "components/x" | "lib/x" -> the path the consumer gets under its @/ root */
const consumerPath = (rel) =>
  rel.startsWith("lib/") ? `@/lib/${rel.slice(4)}` : `@/components/ui/${rel.split("/").pop()}`;

/** `import { a, type B } from "@empire/ui"` -> one import per source file, at consumer paths */
export function rewriteEmpire(src, map) {
  for (const imp of importsOf(src)) {
    if (imp.spec !== "@empire/ui") continue;
    const byFile = new Map();
    for (const n of imp.names) {
      const bare = n
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)[0]
        .trim();
      const file = map.get(bare);
      if (!file) throw new Error(`@empire/ui does not export ${bare}`);
      byFile.set(file, [...(byFile.get(file) ?? []), n]);
    }
    const lines = [...byFile].map(
      ([file, names]) =>
        `import ${imp.typeOnly ? "type " : ""}{ ${names.join(", ")} } from "${consumerPath(file)}";`,
    );
    src = src.replace(imp.statement, lines.join("\n"));
  }
  return src;
}

/** a packages/ui source as the consumer stores it: ../lib/x -> @/lib/x (components and lib live apart) */
export const rewriteUiSource = (src) =>
  src.replace(/from\s+["']\.\.\/lib\/([^"']+)["']/g, 'from "@/lib/$1"');

const readUi = (rel) => {
  for (const ext of [".tsx", ".ts"]) {
    const f = path.join(uiRoot, "src", rel + ext);
    if (existsSync(f)) return { file: rel + ext, src: readFileSync(f, "utf8") };
  }
  throw new Error(`packages/ui/src/${rel} not found`);
};

/** a packages/ui file and every relative file it pulls in, as registry files */
function collectUi(rel, acc) {
  if (acc.has(rel)) return;
  const { file, src } = readUi(rel);
  acc.set(rel, null);
  for (const imp of importsOf(src)) {
    if (imp.spec.startsWith("@empire/"))
      throw new Error(
        `packages/ui/src/${file} imports ${imp.spec}: not portable to the registry yet`,
      );
    if (imp.spec.startsWith("."))
      collectUi(path.posix.normalize(path.posix.join(path.posix.dirname(rel), imp.spec)), acc);
  }
  const lib = rel.startsWith("lib/");
  acc.set(rel, {
    path: `packages/ui/src/${file}`,
    content: rewriteUiSource(src),
    type: lib ? "registry:lib" : "registry:ui",
  });
}

const itemType = {
  exclusive: "registry:block",
  component: "registry:component",
  block: "registry:block",
  template: "registry:page",
};

/** `export default function Dock` | `export default Dock;` -> "Dock" */
export const defaultName = (src) =>
  src.match(/export\s+default\s+function\s+([A-Z]\w*)/)?.[1] ??
  src.match(/export\s+default\s+([A-Z]\w*)\s*;/)?.[1] ??
  null;

const propValue = (c) => (typeof c.value === "string" ? `"${c.value}"` : `{${String(c.value)}}`);

export function usage(e, name) {
  const props = e.controls.map((c) => ` ${c.key}=${propValue(c)}`).join("");
  return `import ${name} from "@/components/ui/${e.slug}";\n\n<${name}${props} />`;
}

export function buildItem(e, { base, map, versions, kindOf, promptFor, slugs }) {
  const demo = readFileSync(path.join(app, "src/registry/ui", `${e.slug}.tsx`), "utf8");
  const libs = new Map();
  for (const imp of importsOf(demo))
    if (imp.spec === "@empire/ui")
      for (const n of imp.names) {
        const rel = map.get(
          n
            .replace(/^type\s+/, "")
            .split(/\s+as\s+/)[0]
            .trim(),
        );
        if (rel) collectUi(rel, libs);
      }
  const files = [
    {
      path: `src/registry/ui/${e.slug}.tsx`,
      content: rewriteEmpire(demo, map),
      type: "registry:ui",
    },
    ...libs.values(),
  ];
  const deps = new Set();
  const regDeps = new Set();
  for (const f of files)
    for (const imp of importsOf(f.content)) {
      if (imp.typeOnly) continue;
      if (external(imp.spec) && !PEERS.has(pkgName(imp.spec))) {
        const name = pkgName(imp.spec);
        const v = versions[name];
        if (!v) throw new Error(`${f.path}: no version for ${name} in apps/design or packages/ui`);
        deps.add(`${name}@${v}`);
      }
      const sib = imp.spec.match(/^\.\/([a-z0-9-]+)$/)?.[1];
      if (f === files[0] && sib) {
        if (!slugs.has(sib))
          throw new Error(`${f.path} imports ./${sib}, which is not a registry part`);
        regDeps.add(`${base}/r/${sib}.json`);
      }
    }
  if (files.some((f) => f.content.includes("--em-"))) regDeps.add(`${base}/r/${TOKENS}.json`);
  const name = defaultName(demo);
  return {
    $schema: ITEM_SCHEMA,
    name: e.slug,
    type: itemType[kindOf(e)],
    title: e.name,
    description: e.summary,
    author: "crocwork",
    dependencies: [...deps].sort(),
    registryDependencies: [...regDeps].sort(),
    files,
    categories: [e.category],
    docs: name ? usage(e, name) : undefined,
    meta: {
      kind: kindOf(e),
      blend: e.blend,
      added: e.added,
      rank: e.rank ?? null,
      props: e.controls,
      component: name,
      prompt: promptFor(e),
      page: `${base}/c/${e.slug}`,
    },
  };
}

/** the --em-* scales from packages/ui/palette.css, as shadcn cssVars (keys without the dashes) */
export function tokensItem(palette) {
  const light = {};
  for (const m of palette.matchAll(/--(em-[\w-]+)\s*:\s*([^;]+);/g)) light[m[1]] = m[2].trim();
  return {
    $schema: ITEM_SCHEMA,
    name: TOKENS,
    type: "registry:theme",
    title: "crocwork tokens",
    description: "The --em-* colour scales every part reads (ink, blue, sky, coral ...)",
    cssVars: { light },
    files: [],
  };
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FILE_TYPES = new Set([
  "registry:ui",
  "registry:lib",
  "registry:component",
  "registry:hook",
  "registry:file",
]);

/** structural check of what the shadcn CLI and croc-ui rely on; throws on the first problem */
export function checkItem(it) {
  const where = `r/${it.name}.json`;
  if (it.$schema !== ITEM_SCHEMA) throw new Error(`${where}: $schema`);
  if (!SLUG.test(it.name)) throw new Error(`${where}: name`);
  if (!/^registry:(component|block|page|theme|ui|lib)$/.test(it.type))
    throw new Error(`${where}: type`);
  for (const d of it.dependencies ?? [])
    if (!/^(@[a-z0-9-]+\/)?[a-z0-9.-]+@[\^~]?\d[\w.-]*$/.test(d))
      throw new Error(`${where}: dependency ${d}`);
  for (const f of it.files) {
    if (!FILE_TYPES.has(f.type)) throw new Error(`${where}: file type ${f.type}`);
    if (typeof f.content !== "string" || !f.content) throw new Error(`${where}: empty ${f.path}`);
    if (f.target && (f.target.includes("..") || path.isAbsolute(f.target)))
      throw new Error(`${where}: unsafe target ${f.target}`);
    if (/from\s+["']@empire\//.test(f.content))
      throw new Error(`${where}: ${f.path} still imports @empire`);
  }
  return true;
}

function llms(items, base) {
  const head = [
    "# crocwork Design Registry",
    "",
    `> ${items.length} React parts (components, page blocks, whole-page templates) for Next.js and Vite with Tailwind v4 and motion/react. Every part installs with the shadcn CLI or with croc-ui, and reads colour from CSS tokens so it follows light and dark themes.`,
    "",
    `- Registry index: ${base}/r/index.json`,
    `- Install one part: \`npx shadcn@latest add ${base}/r/<name>.json\``,
    `- Without shadcn: \`curl -fsSL ${base}/croc-ui.mjs -o croc-ui.mjs && node croc-ui.mjs add <name>\``,
    `- Tokens: parts use shadcn semantic tokens (--background, --primary ...) plus the --em-* scales from ${base}/r/${TOKENS}.json`,
    `- Full docs with props and usage: ${base}/llms-full.txt`,
    "",
  ];
  const groups = [
    ["Components", "registry:component"],
    ["Blocks", "registry:block"],
    ["Templates", "registry:page"],
  ];
  const short = [...head];
  const full = [...head];
  for (const [title, type] of groups) {
    const list = items.filter((i) => i.type === type);
    short.push(`## ${title}`, "");
    full.push(`## ${title}`, "");
    for (const i of list) {
      short.push(`- [${i.title}](${base}/r/${i.name}.json): ${i.meta.blend.join(", ")}`);
      const props = i.meta.props.length
        ? i.meta.props.map(
            (p) =>
              `  - \`${p.key}\` (${p.type}${p.type === "range" ? ` ${p.min}-${p.max}` : p.type === "select" ? `: ${p.options.join(" | ")}` : ""}) default \`${String(p.value)}\``,
          )
        : ["  - none"];
      full.push(
        `### ${i.title} (\`${i.name}\`)`,
        "",
        `${i.meta.blend.join(", ")}. ${i.description}`,
        "",
        `- Install: \`npx shadcn@latest add ${base}/r/${i.name}.json\``,
        `- Dependencies: ${i.dependencies.length ? i.dependencies.map((d) => `\`${d}\``).join(", ") : "React only"}`,
        ...(i.registryDependencies.length
          ? [`- Registry dependencies: ${i.registryDependencies.map((d) => `\`${d}\``).join(", ")}`]
          : []),
        `- Files: ${i.files.map((f) => `\`${f.type === "registry:lib" ? "lib" : "components/ui"}/${path.posix.basename(f.path)}\``).join(", ")}`,
        "- Props:",
        ...props,
        "",
        ...(i.docs ? ["```tsx", i.docs, "```", ""] : []),
      );
    }
    short.push("");
  }
  return { short: short.join("\n"), full: full.join("\n") };
}

async function loadRegistry() {
  // the registry is TypeScript with extensionless imports; Node strips the types, this adds the ".ts"
  registerHooks({
    resolve(spec, ctx, next) {
      try {
        return next(spec, ctx);
      } catch (err) {
        if (spec.startsWith(".") && !path.extname(spec)) return next(`${spec}.ts`, ctx);
        throw err;
      }
    },
  });
  return import(pathToFileURL(path.join(app, "src/registry/meta.ts")).href);
}

function baseUrl() {
  if (!process.env.REGISTRY_URL && !process.env.NEXT_PUBLIC_SITE_URL)
    for (const f of [".env.production.local", ".env.production"])
      if (existsSync(path.join(app, f))) {
        process.loadEnvFile(path.join(app, f));
        break;
      }
  const url = process.env.REGISTRY_URL || process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_URL;
  return url.replace(/\/+$/, "");
}

async function build() {
  const base = baseUrl();
  const { registry, kindOf, promptFor } = await loadRegistry();
  const map = exportMap(readFileSync(path.join(uiRoot, "src/index.ts"), "utf8"));
  const versions = {
    ...JSON.parse(readFileSync(path.join(uiRoot, "package.json"), "utf8")).dependencies,
    ...JSON.parse(readFileSync(path.join(app, "package.json"), "utf8")).dependencies,
  };
  const slugs = new Set(registry.map((e) => e.slug));
  const ctx = { base, map, versions, kindOf, promptFor, slugs };
  const items = registry.map((e) => buildItem(e, ctx));
  const tokens = tokensItem(readFileSync(path.join(uiRoot, "src/palette.css"), "utf8"));
  [...items, tokens].forEach(checkItem);

  const out = path.join(app, "public/r");
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const it of [...items, tokens])
    writeFileSync(path.join(out, `${it.name}.json`), `${JSON.stringify(it, null, 2)}\n`);
  const index = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "crocwork",
    homepage: base,
    items: [tokens, ...items].map(({ $schema: _s, files, ...rest }) => ({
      ...rest,
      files: files.map(({ content: _c, ...f }) => f),
    })),
  };
  writeFileSync(path.join(out, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
  const { short, full } = llms(items, base);
  writeFileSync(path.join(app, "public/llms.txt"), short);
  writeFileSync(path.join(app, "public/llms-full.txt"), full);
  copyFileSync(path.join(here, "croc-ui.mjs"), path.join(app, "public/croc-ui.mjs"));
  console.log(`registry: ${items.length} parts + ${TOKENS} -> public/r (${base})`);
}

async function selfTest() {
  const assert = (await import("node:assert/strict")).default;
  const src = [
    '"use client";',
    'import { motion, useSpring } from "motion/react";',
    "import {",
    "  useReducedMotionAfterMount,",
    "  useTokenColors,",
    "  type ThemeEffect,",
    '} from "@empire/ui";',
    'import type { ReactNode } from "react";',
    'import Footer from "./footer-columns";',
    'import "./side.css";',
    "export default Thing;",
  ].join("\n");
  const imps = importsOf(src);
  assert.deepEqual(
    imps.map((i) => i.spec),
    ["motion/react", "@empire/ui", "react", "./footer-columns", "./side.css"],
  );
  assert.deepEqual(imps[1].names, [
    "useReducedMotionAfterMount",
    "useTokenColors",
    "type ThemeEffect",
  ]);
  assert.equal(imps[2].typeOnly, true);
  assert.equal(pkgName("motion/react"), "motion");
  assert.equal(pkgName("@radix-ui/react-slot"), "@radix-ui/react-slot");
  const map = exportMap(
    'export { cn } from "./lib/cn";\nexport {\n  SunMoonThemeToggle,\n  type ThemeEffect,\n} from "./components/sun-moon-theme-toggle";\nexport { useTokenColors } from "./lib/token-colors";\nexport { useReducedMotionAfterMount } from "./lib/use-reduced-motion";',
  );
  assert.equal(map.get("ThemeEffect"), "components/sun-moon-theme-toggle");
  const out = rewriteEmpire(src, map);
  assert.match(out, /import \{ useReducedMotionAfterMount \} from "@\/lib\/use-reduced-motion";/);
  assert.match(out, /import \{ useTokenColors \} from "@\/lib\/token-colors";/);
  assert.match(
    out,
    /import \{ type ThemeEffect \} from "@\/components\/ui\/sun-moon-theme-toggle";/,
  );
  assert.doesNotMatch(out, /@empire\/ui/);
  assert.throws(
    () => rewriteEmpire('import { Nope } from "@empire/ui";', map),
    /does not export Nope/,
  );
  assert.equal(
    rewriteUiSource('import { cn } from "../lib/cn";'),
    'import { cn } from "@/lib/cn";',
  );
  assert.equal(defaultName(src), "Thing");
  assert.equal(defaultName("export default function Dock() {}"), "Dock");
  const e = {
    slug: "dock",
    controls: [
      { key: "magnify", value: 1.6 },
      { key: "label", value: "Hi" },
    ],
  };
  assert.equal(
    usage(e, "Dock"),
    'import Dock from "@/components/ui/dock";\n\n<Dock magnify={1.6} label="Hi" />',
  );
  const tok = tokensItem(
    ":root {\n  --em-ink-50: oklch(0.98 0 0);\n  --em-blue-500: oklch(0.6 0.2 250);\n}",
  );
  assert.deepEqual(tok.cssVars.light, {
    "em-ink-50": "oklch(0.98 0 0)",
    "em-blue-500": "oklch(0.6 0.2 250)",
  });
  const good = {
    $schema: ITEM_SCHEMA,
    name: "dock",
    type: "registry:component",
    dependencies: ["motion@^14.14.0", "@radix-ui/react-slot@^1.5.0"],
    files: [{ path: "x", content: "x", type: "registry:ui", target: "components/ui/dock.tsx" }],
  };
  assert.equal(checkItem(good), true);
  assert.throws(
    () => checkItem({ ...good, files: [{ ...good.files[0], target: "../../etc/x" }] }),
    /unsafe/,
  );
  assert.throws(() => checkItem({ ...good, name: "Dock!" }), /name/);
  assert.throws(() => checkItem({ ...good, dependencies: ["motion; rm -rf /"] }), /dependency/);
  console.log("build-registry self-test ok");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--self-test")) await selfTest();
  else await build();
}
