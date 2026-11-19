#!/usr/bin/env node
// croc-ui: install crocwork Design Registry parts without the shadcn CLI. Zero dependencies, Node 20+.
//   node croc-ui.mjs add <name|url> [more ...] [--registry <url>] [--overwrite] [--dry-run]
//   node croc-ui.mjs list
// It fetches <registry>/r/<name>.json, follows registryDependencies, installs missing npm packages
// with the package manager it finds (pnpm, bun, yarn, npm), and writes the files under the folder
// your tsconfig maps "@/*" to (or src/, or the project root), rewriting "@/" to your alias.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_REGISTRY = "https://crocwork-design.crocwork.workers.dev";
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DEP = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*(@[\w.^~<>=*|-]+)?$/i;
const DIRS = {
  "registry:ui": "components/ui",
  "registry:component": "components",
  "registry:block": "components",
  "registry:lib": "lib",
  "registry:hook": "hooks",
};

/** walk up from dir to the first lockfile; the user agent of `npx`/`pnpm dlx` wins when set */
export function detectPm(dir, agent = process.env.npm_config_user_agent ?? "") {
  const fromAgent = agent.match(/^(pnpm|yarn|bun|npm)\//)?.[1];
  if (fromAgent && fromAgent !== "npm") return fromAgent;
  for (let d = path.resolve(dir); ; d = path.dirname(d)) {
    if (existsSync(path.join(d, "pnpm-lock.yaml"))) return "pnpm";
    if (existsSync(path.join(d, "bun.lock")) || existsSync(path.join(d, "bun.lockb"))) return "bun";
    if (existsSync(path.join(d, "yarn.lock"))) return "yarn";
    if (existsSync(path.join(d, "package-lock.json"))) return "npm";
    if (path.dirname(d) === d) return fromAgent ?? "npm";
  }
}

export const installArgs = (pm, deps) => (pm === "npm" ? ["install", ...deps] : ["add", ...deps]);

/** tsconfig is JSONC: drop comments and trailing commas, keep strings intact */
export function readJsonc(text) {
  const noComments = text.replace(
    /("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
    (m, s) => s ?? "",
  );
  return JSON.parse(noComments.replace(/,(\s*[}\]])/g, "$1"));
}

/** { alias: "@/", root: "<abs dir>" } from tsconfig paths, else src/ when present, else the project */
export function resolveAlias(cwd) {
  for (const f of ["tsconfig.json", "jsconfig.json"]) {
    const file = path.join(cwd, f);
    if (!existsSync(file)) continue;
    try {
      const opts = readJsonc(readFileSync(file, "utf8")).compilerOptions ?? {};
      for (const [key, targets] of Object.entries(opts.paths ?? {})) {
        if (!key.endsWith("/*") || !Array.isArray(targets) || !targets[0]?.endsWith("/*")) continue;
        const root = path.resolve(cwd, opts.baseUrl ?? ".", targets[0].slice(0, -2));
        if (root.startsWith(path.resolve(cwd))) return { alias: key.slice(0, -1), root };
      }
    } catch {
      // unreadable tsconfig: fall through to the folder guess
    }
  }
  return { alias: "@/", root: existsSync(path.join(cwd, "src")) ? path.join(cwd, "src") : cwd };
}

export const rewriteAlias = (src, alias) =>
  alias === "@/" ? src : src.replace(/(from\s+["']|import\(\s*["'])@\//g, `$1${alias}`);

/** where a registry file lands; null when the item asks for a path outside the alias root */
export function targetOf(file, root) {
  const rel =
    file.target ?? (DIRS[file.type] && `${DIRS[file.type]}/${path.posix.basename(file.path)}`);
  if (!rel || rel.startsWith("~") || path.isAbsolute(rel)) return null;
  const abs = path.resolve(root, rel);
  return abs.startsWith(root + path.sep) ? abs : null;
}

/** the CSS a theme item adds: its cssVars.light as a :root block */
export const cssOf = (item) =>
  `:root {\n${Object.entries(item.cssVars?.light ?? {})
    .map(([k, v]) => `  --${k}: ${v};`)
    .join("\n")}\n}\n`;

export function itemUrl(ref, registry) {
  if (/^https?:\/\//.test(ref)) return ref;
  if (!NAME.test(ref)) throw new Error(`not a part name or URL: ${ref}`);
  return `${registry.replace(/\/+$/, "")}/r/${ref}.json`;
}

const allowedUrl = (u) => {
  const url = new URL(u);
  return url.protocol === "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
};

/** fetched JSON is untrusted: check what we act on before touching the disk or the shell */
export function validate(item, url) {
  if (!item || typeof item !== "object" || !NAME.test(item.name ?? ""))
    throw new Error(`${url}: bad item`);
  for (const d of item.dependencies ?? [])
    if (!DEP.test(d)) throw new Error(`${url}: bad dependency ${d}`);
  for (const f of item.files ?? [])
    if (typeof f.content !== "string" || typeof f.path !== "string")
      throw new Error(`${url}: bad file`);
  return item;
}

async function fetchTree(refs, registry) {
  const seen = new Map();
  const visit = async (ref) => {
    const url = itemUrl(ref, registry);
    if (seen.has(url)) return;
    if (!allowedUrl(url)) throw new Error(`refusing ${url}: https only (or localhost)`);
    seen.set(url, null);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const item = validate(await res.json(), url);
    for (const dep of item.registryDependencies ?? []) await visit(dep);
    seen.set(url, item);
  };
  for (const r of refs) await visit(r);
  return [...seen.values()];
}

function installed(cwd) {
  const file = path.join(cwd, "package.json");
  if (!existsSync(file))
    throw new Error("no package.json here: run croc-ui from your project folder");
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  return new Set(
    Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies }),
  );
}

const bare = (dep) => dep.replace(/(.)@.*$/, "$1");

async function add(refs, { registry, overwrite, dry, cwd }) {
  const items = await fetchTree(refs, registry);
  const have = installed(cwd);
  const { alias, root } = resolveAlias(cwd);
  const deps = [...new Set(items.flatMap((i) => i.dependencies ?? []))].filter(
    (d) => !have.has(bare(d)),
  );
  const pm = detectPm(cwd);
  if (deps.length) {
    console.log(`${pm} ${installArgs(pm, deps).join(" ")}`);
    if (!dry) {
      // .cmd shims need a shell on Windows; every dep already passed the DEP pattern above
      const r = spawnSync(pm, installArgs(pm, deps), {
        cwd,
        stdio: "inherit",
        shell: process.platform === "win32",
      });
      if (r.status !== 0) throw new Error(`${pm} exited with ${r.status}`);
    }
  }
  for (const item of items) {
    const writes = (item.files ?? []).map((f) => [
      targetOf(f, root),
      rewriteAlias(f.content, alias),
      f.path,
    ]);
    if (item.cssVars?.light)
      writes.push([path.join(root, "styles", `${item.name}.css`), cssOf(item), "cssVars"]);
    for (const [abs, content, from] of writes) {
      if (!abs) throw new Error(`${item.name}: ${from} wants a path outside ${root}`);
      const rel = path.relative(cwd, abs);
      if (existsSync(abs) && !overwrite) {
        console.log(`skip  ${rel} (exists, --overwrite to replace)`);
        continue;
      }
      console.log(`${dry ? "would write" : "write"} ${rel}`);
      if (!dry) {
        mkdirSync(path.dirname(abs), { recursive: true });
        writeFileSync(abs, content);
      }
    }
    if (item.cssVars?.light)
      console.log(`note  import "${alias}styles/${item.name}.css" once in your global CSS`);
  }
}

async function list(registry) {
  const res = await fetch(`${registry.replace(/\/+$/, "")}/r/index.json`);
  if (!res.ok) throw new Error(`index: HTTP ${res.status}`);
  for (const i of (await res.json()).items ?? [])
    console.log(`${i.name.padEnd(28)} ${i.title ?? ""}`);
}

async function selfTest() {
  const assert = (await import("node:assert/strict")).default;
  const os = await import("node:os");
  const fs = await import("node:fs");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "croc-ui-"));
  const proj = path.join(tmp, "app");
  fs.mkdirSync(path.join(proj, "src"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "yarn.lock"), "");
  assert.equal(detectPm(proj, ""), "yarn");
  fs.writeFileSync(path.join(proj, "pnpm-lock.yaml"), "");
  assert.equal(detectPm(proj, ""), "pnpm");
  assert.equal(detectPm(proj, "bun/1.2.0 npm/? node/v24"), "bun");
  assert.deepEqual(installArgs("npm", ["motion@^14"]), ["install", "motion@^14"]);
  assert.deepEqual(installArgs("pnpm", ["motion@^14"]), ["add", "motion@^14"]);

  assert.deepEqual(resolveAlias(proj), { alias: "@/", root: path.join(proj, "src") });
  fs.writeFileSync(
    path.join(proj, "tsconfig.json"),
    '{\n  // app\n  "compilerOptions": { "baseUrl": ".", "paths": { "~/*": ["./app/*"], }, "x": "a//b" },\n}',
  );
  assert.deepEqual(resolveAlias(proj), { alias: "~/", root: path.join(proj, "app") });
  assert.equal(readJsonc('{"u":"http://x/*y*/"}').u, "http://x/*y*/");
  assert.equal(
    rewriteAlias('import { cn } from "@/lib/cn";\nconst a = "@/not-an-import";', "~/"),
    'import { cn } from "~/lib/cn";\nconst a = "@/not-an-import";',
  );

  const root = path.join(proj, "app");
  assert.equal(
    targetOf({ path: "x/dock.tsx", type: "registry:ui" }, root),
    path.join(root, "components/ui/dock.tsx"),
  );
  assert.equal(
    targetOf({ path: "x", type: "registry:lib", target: "lib/cn.ts" }, root),
    path.join(root, "lib/cn.ts"),
  );
  assert.equal(targetOf({ path: "x", type: "registry:ui", target: "../../evil.ts" }, root), null);
  assert.equal(targetOf({ path: "x", type: "registry:file", target: "~/evil.ts" }, root), null);
  assert.equal(targetOf({ path: "x", type: "registry:page" }, root), null);

  assert.equal(itemUrl("dock", "https://r.example/"), "https://r.example/r/dock.json");
  assert.throws(() => itemUrl("../dock", "https://r.example"), /not a part name/);
  assert.equal(allowedUrl("http://evil.example/r/x.json"), false);
  assert.equal(allowedUrl("http://localhost:3005/r/x.json"), true);
  assert.throws(
    () => validate({ name: "x", dependencies: ["motion && calc"] }, "u"),
    /bad dependency/,
  );
  assert.equal(
    validate({ name: "x", dependencies: ["@radix-ui/react-slot@^1.5.0"] }, "u").name,
    "x",
  );
  assert.equal(bare("@radix-ui/react-slot@^1.5.0"), "@radix-ui/react-slot");
  assert.equal(bare("motion"), "motion");
  assert.equal(
    cssOf({ cssVars: { light: { "em-ink-50": "oklch(1 0 0)" } } }),
    ":root {\n  --em-ink-50: oklch(1 0 0);\n}\n",
  );
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("croc-ui self-test ok");
}

async function main(argv) {
  const flag = (n) => argv.includes(n);
  const opt = (n) => {
    const i = argv.indexOf(n);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  if (flag("--self-test")) return selfTest();
  const registry = opt("--registry") ?? process.env.CROC_UI_REGISTRY ?? DEFAULT_REGISTRY;
  const [cmd, ...rest] = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--registry");
  if (cmd === "list") return list(registry);
  if (cmd === "add" && rest.length)
    return add(rest, {
      registry,
      overwrite: flag("--overwrite"),
      dry: flag("--dry-run"),
      cwd: process.cwd(),
    });
  console.log(
    "usage: node croc-ui.mjs add <name|url> [...] [--registry <url>] [--overwrite] [--dry-run]\n       node croc-ui.mjs list",
  );
  process.exitCode = cmd ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main(process.argv.slice(2)).catch((err) => {
    console.error(`croc-ui: ${err.message}`);
    process.exitCode = 1;
  });
