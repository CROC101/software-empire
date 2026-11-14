// Puts the web build of each crocwork Craft app (the rebranded forks made by rebrand.mjs) into
// public/craft/<slug>/, from the fork's release named in src/lib/craft-apps.ts:
//   node tools/craft/web.mjs [slug...]
//   node tools/craft/web.mjs --self-test
// The zip is checked against the release's SHA256SUMS and against a list of files a Craft web
// build is made of, before anything lands in public/. Bump `tag` in craft-apps.ts, then rerun.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { platform, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Buffer } from "node:buffer";
import process, { argv, exit } from "node:process";
import { gzipSync } from "node:zlib";
import console from "node:console";

const here = resolve(import.meta.dirname, "../..");
const out = join(here, "public/craft");

/** [slug, repo, tag] of each app with a release and a web build (EXE-only apps have no `web`), read from craft-apps.ts so the tag lives in one place */
export function releases(source) {
  return [...source.matchAll(/slug: "([a-z-]+)",[\s\S]*?(?=slug: |$)/g)].flatMap(([block, slug]) => {
    const repo = /repo: "([\w.-]+\/[\w.-]+)"/.exec(block)?.[1];
    const tag = /tag: "([\w.-]+)"/.exec(block)?.[1];
    return repo && tag && block.includes("web: ") ? [[slug, repo, tag]] : [];
  });
}

// what a Craft web build holds; anything else (a symlink, a server config, a stray binary) stops the run
export const ALLOWED =
  /^(index\.html|[\w-]+-[0-9a-f]{16}\.(ico|png)|[\w-]+-web(-boot)?-[0-9a-f]+(\.js|_bg\.wasm)|[\w-]+-ocr-worker-[0-9a-f]+(\.js|_loader\.js|_bg\.wasm)|models\/([\w-]+\.onnx(\.LICENCE\.txt)?|ATTRIBUTION\.txt)|[a-z]+_web(\.js|_bg\.wasm)|(worker|sw|audio-worklet)\.js|favicon\.svg|icon-\d+\.png|manifest\.webmanifest|app\/(parts\.txt|[\w-]+\.js|[\w-]+-[0-9a-f]+\.part-[a-z]{2})|snippets\/[\w./-]+\.js|icons\/(\d+\/)?[\w.]+\.(png|svg)|fonts\/[0-9a-f]{16}\/(OFL\.txt|[\w-]+\.ttf)|licenses\/([\w-]+\/)+[\w-]+(\.txt)?|(ATTRIBUTION|ASSETS)\.md|OFL-[\w-]+\.txt|NOTICE|LICENSE-(MIT|APACHE)|README\.md)$/;
// host configs and hosting notes for other servers: this site has its own (public/_headers)
export const DROP = /^(_headers|\.htaccess|HOSTING\.md)$/;

export function check(files) {
  for (const f of files) assert.ok(DROP.test(f) || ALLOWED.test(f), `unexpected file in the web build: ${f}`);
  assert.ok(files.includes("index.html") && files.includes("NOTICE"), "not a Craft web build");
  // models are third-party (pdf OCR: CC-BY-SA-4.0): each ships with its licence text
  for (const f of files.filter((f) => f.endsWith(".onnx"))) assert.ok(files.includes(`${f}.LICENCE.txt`), `${f}: no licence`);
}

// Cloudflare serves no single asset over 25 MiB, and most Craft web builds are one 40-70 MB wasm.
// Store it gzipped in parts of at most 20 MiB; the page fetches them, joins them and inflates
// them (DecompressionStream) into the Response wasm-bindgen's init accepts.
export const PART = 20 * 1024 * 1024;

/**
 * Rewrites index.html to load `wasm` from `parts`; throws if the page is not a shape we know:
 * Trunk (`init({ module_or_path: './x_bg.wasm' })`) or EffectCraft's (`fetch(wasmUrl)`, it compiles
 * the module once and hands it to its workers).
 */
export function bootFromParts(html, wasm, parts) {
  const trunk = `init({ module_or_path: './${wasm}' })`;
  const direct = html.includes(`new URL("${wasm}", location.href)`) && html.includes("fetch(wasmUrl)");
  assert.ok(html.split(trunk).length === 2 || direct, `${wasm}: index.html does not start the app the way we know`);
  const list = JSON.stringify(parts.map((p) => `./${p}`));
  // the parts are streamed in order, never put in a Blob: a 20 MiB Blob from fetch fails with
  // "Failed to fetch" when Chrome cannot write its blob store to disk (seen in a test browser).
  // A function, since a Response body reads once and EffectCraft may fetch twice (its fallback).
  const load = `const craftWasm = () => {
  const parts = ${list}.map((p) => fetch(p).then((r) => { if (!r.ok) throw new Error(p + ": " + r.status); return r; }));
  const gz = new ReadableStream({ async start(c) { for (const part of parts) { const r = (await part).body.getReader(); for (let x; !(x = await r.read()).done; ) c.enqueue(x.value); } c.close(); } });
  return new Response(gz.pipeThrough(new DecompressionStream("gzip")), { headers: { "Content-Type": "application/wasm" } });
};
`;
  const out = html
    .replace(/<link rel="preload" href="\.\/[^"]+_bg\.wasm"[^>]*>/, "")
    .replace(/(<script type="module">\n?(?:[ \t]*import [^\n]+\n)+)/, `$1${load}`);
  assert.ok(out.includes("const craftWasm"), `${wasm}: no module script with imports to start from`);
  return direct ? out.replaceAll("fetch(wasmUrl)", "craftWasm()") : out.replace(trunk, "init({ module_or_path: craftWasm() })");
}

function splitBigWasm(dest) {
  for (const wasm of readdirSync(dest).filter((f) => f.endsWith("_bg.wasm") && statSync(join(dest, f)).size > PART)) {
    const gz = gzipSync(readFileSync(join(dest, wasm)), { level: 9 });
    const parts = [];
    for (let i = 0; i * PART < gz.length; i++) {
      const name = `${wasm.slice(0, -".wasm".length)}.part-${String.fromCharCode(97 + Math.floor(i / 26), 97 + (i % 26))}`;
      writeFileSync(join(dest, name), gz.subarray(i * PART, (i + 1) * PART));
      parts.push(name);
    }
    const page = join(dest, "index.html");
    writeFileSync(page, bootFromParts(readFileSync(page, "utf8"), wasm, parts));
    // a service worker that precaches the wasm would fail to install without it: precache the parts
    const sw = join(dest, "sw.js");
    if (existsSync(sw)) writeFileSync(sw, readFileSync(sw, "utf8").replace(`"./${wasm}"`, parts.map((p) => `"./${p}"`).join(", ")));
    rmSync(join(dest, wasm));
  }
}

async function get(url) {
  const res = await globalThis.fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function place(slug, repo, tag) {
  const base = `https://github.com/${repo}/releases/download/${tag}`;
  const sums = (await get(`${base}/SHA256SUMS`)).toString("utf8");
  const [, sha, name] = /^([0-9a-f]{64}) [ *]?(\S+-web-\S+\.zip)$/m.exec(sums) ?? [];
  if (!name) throw new Error(`${repo}@${tag}: no web zip in SHA256SUMS`);
  const zip = await get(`${base}/${name}`);
  assert.equal(createHash("sha256").update(zip).digest("hex"), sha, `${name}: checksum mismatch`);

  // downloaded data: its own empty folder, nothing run from inside it
  const tmp = mkdtempSync(join(tmpdir(), "craft-web-"));
  writeFileSync(join(tmp, "web.zip"), zip);
  const x = join(tmp, "x");
  mkdirSync(x);
  // bsdtar (Windows, macOS) reads zips; Linux runners have unzip. Both refuse ../ paths.
  if (platform() === "linux") execFileSync("unzip", ["-q", "web.zip", "-d", "x"], { cwd: tmp, stdio: "inherit" });
  // Git Bash puts GNU tar (no zip support) first on PATH: on Windows name the system bsdtar
  else execFileSync(platform() === "win32" ? join(process.env.SystemRoot ?? "C:/Windows", "System32", "tar.exe") : "tar", ["-xf", "web.zip", "-C", "x"], { cwd: tmp, stdio: "inherit" });
  const [top] = readdirSync(x);
  const dir = join(x, top);
  const files = readdirSync(dir, { recursive: true, encoding: "utf8" })
    .map((f) => f.replaceAll("\\", "/"))
    .filter((f) => !lstatSync(join(dir, f)).isDirectory());
  for (const f of files) assert.ok(lstatSync(join(dir, f)).isFile(), `${f}: not a plain file`);
  check(files);

  const dest = join(out, slug);
  rmSync(dest, { recursive: true, force: true });
  for (const f of files.filter((f) => !DROP.test(f))) cpSync(join(dir, f), join(dest, f));
  splitBigWasm(dest);
  writeFileSync(join(dest, "VERSION"), `${repo}@${tag}\n`);
  rmSync(tmp, { recursive: true, force: true });
  console.log(`${slug}: ${name} from ${repo}@${tag}`);
}

function selfTest() {
  const src = `{ slug: "a", web: "/craft/a/", repo: "o/a", tag: "v1-crocwork.2" }, { slug: "exe", repo: "o/exe", tag: "v1" }, { slug: "icons", web: "/icons" }`;
  assert.deepEqual(releases(src), [["a", "o/a", "v1-crocwork.2"]]);
  check(["index.html", "NOTICE", "_headers", "app/parts.txt", "app/x-web-0a.part-aa", "x-web-boot-0f_bg.wasm", "x-web-589f.js", "x-web-589f_bg.wasm"]);
  check(["index.html", "NOTICE", "x-e78c8564b81d2af2.ico", "OFL-noto-sans-cjk-sc.txt"]);
  assert.throws(() => check(["index.html", "NOTICE", "run.exe"]));
  assert.throws(() => check(["index.html", "NOTICE", "../evil.js"]));
  assert.throws(() => check(["README.md"]));
  const page = `<script type="module">
import init, * as bindings from './x-web-0a.js';
const wasm = await init({ module_or_path: './x-web-0a_bg.wasm' });
</script><link rel="preload" href="./x-web-0a_bg.wasm" as="fetch" type="application/wasm"></head>`;
  const booted = bootFromParts(page, "x-web-0a_bg.wasm", ["x-web-0a_bg.part-aa", "x-web-0a_bg.part-ab"]);
  assert.ok(booted.includes("init({ module_or_path: craftWasm() })") && booted.includes('"./x-web-0a_bg.part-ab"'));
  assert.ok(!booted.includes("_bg.wasm") && booted.indexOf("const craftWasm") > booted.indexOf("import init"));
  assert.throws(() => bootFromParts("<html></html>", "x-web-0a_bg.wasm", []));
  const effect = `<script type="module">
    import init, * as ec from "./e_web.js";
    const wasmUrl = new URL("e_web_bg.wasm", location.href);
    try { module = await WebAssembly.compileStreaming(fetch(wasmUrl)); } catch { module = await WebAssembly.compile(await (await fetch(wasmUrl)).arrayBuffer()); }
</script>`;
  const fx = bootFromParts(effect, "e_web_bg.wasm", ["e_web_bg.part-aa"]);
  assert.ok(!fx.includes("fetch(wasmUrl)") && fx.split("craftWasm()").length === 3 && fx.indexOf("const craftWasm") > fx.indexOf("import init"));
  check(["index.html", "NOTICE", "e_web.js", "e_web_bg.wasm", "sw.js", "worker.js", "audio-worklet.js", "favicon.svg", "icon-512.png", "manifest.webmanifest"]);
  check(["index.html", "NOTICE", "ASSETS.md", "icons/32/ai.x.png", "icons/ai.x.svg", "fonts/dc591156f36842d3/OFL.txt", "fonts/dc591156f36842d3/NotoSansThai.ttf", "licenses/a/b/LICENSE-MIT", "licenses/a/assets/CGATS_LICENSE.txt"]);
  assert.throws(() => check(["index.html", "NOTICE", "licenses/../x.js"]));
  check(["index.html", "NOTICE", "p-ocr-worker-3a24_loader.js", "p-ocr-worker-3a24_bg.wasm", "models/ATTRIBUTION.txt", "models/t.onnx", "models/t.onnx.LICENCE.txt"]);
  assert.throws(() => check(["index.html", "NOTICE", "models/t.onnx"]));
  assert.throws(() => check(["index.html", "NOTICE", "fonts/dc591156f36842d3/run.exe"]));
  console.log("web self-test ok");
}

if (import.meta.main ?? argv[1] === import.meta.filename) {
  if (argv[2] === "--self-test") selfTest();
  else {
    const all = releases(readFileSync(join(here, "src/lib/craft-apps.ts"), "utf8"));
    const want = argv.slice(2);
    const picked = want.length ? all.filter(([s]) => want.includes(s)) : all;
    if (!picked.length) {
      console.error(`unknown app; known: ${all.map(([s]) => s).join(", ")}`);
      exit(1);
    }
    for (const r of picked) await place(...r);
  }
}
