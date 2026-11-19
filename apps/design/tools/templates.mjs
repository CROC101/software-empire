// Builds the clone templates in /templates into apps/design/public/tpl/<slug>/ (served
// sandboxed, see public/_headers) and zips each template's source to /tpl/<slug>.zip.
//   node apps/design/tools/templates.mjs [slug...]   build all or some
//   node apps/design/tools/templates.mjs --self-test zip writer round trip
// Each template is a standalone npm project: installed with --ignore-scripts, never part of the
// pnpm workspace. public/tpl is not in git; deploy.yml runs this before the design build.
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, inflateRawSync } from "node:zlib";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const src = join(root, "templates");
const pub = join(root, "apps/design/public/tpl");
const MAX_FILE = 25 * 1024 * 1024; // Cloudflare static assets: 25 MiB per file
const SKIP = new Set(["node_modules", ".next", "out", "dist", "next-env.d.ts", ".DS_Store"]);

// A sandboxed frame has an opaque origin. Two things break and are patched before any app script:
// - localStorage / sessionStorage throw: the clones keep state there, so an in-memory stand-in
//   lasts the visit.
// - every fetch to our own host is cross-origin, so Next's RSC headers (rsc, next-router-*) force a
//   CORS preflight a static host cannot answer. Same-host fetches keep only CORS-safelisted headers:
//   in a static export the .txt URL alone picks the payload.
const SHIM =
  "<script>(function(){function m(){var d=new Map();return{get length(){return d.size},key:function(i){var k=Array.from(d.keys())[i];return k===undefined?null:k},getItem:function(k){k=String(k);return d.has(k)?d.get(k):null},setItem:function(k,v){d.set(String(k),String(v))},removeItem:function(k){d.delete(String(k))},clear:function(){d.clear()}}}['localStorage','sessionStorage'].forEach(function(n){try{window[n].length}catch(e){try{Object.defineProperty(window,n,{value:m(),configurable:true})}catch(_){}}});var f=window.fetch;if(f)window.fetch=function(i,o){try{var r=new Request(i,o);if(new URL(r.url).host===location.host){var h=new Headers();r.headers.forEach(function(v,k){if(/^(accept|accept-language|content-language|content-type|range)$/.test(k))h.set(k,v)});return f.call(window,new Request(r,{headers:h}))}}catch(e){}return f.apply(window,arguments)}})();</script>";

/** Every file under dir (relative, forward slashes), skipping build output and installs. */
function files(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => !SKIP.has(e.name) && !e.name.endsWith(".tsbuildinfo"))
    .flatMap((e) =>
      e.isDirectory()
        ? files(join(dir, e.name), base)
        : [relative(base, join(dir, e.name)).split(sep).join("/")],
    )
    .sort();
}

/** Store-only zip (no compression: the sources are small, and it keeps this writer tiny). */
export function zip(entries) {
  const local = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const n = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0);
    head.writeUInt16LE(20, 4);
    head.writeUInt16LE(0x0800, 6); // utf-8 names
    head.writeUInt16LE(0, 8); // stored
    head.writeUInt32LE(0, 10); // dos time/date: 1980, keeps the zip reproducible
    head.writeUInt32LE(crc, 14);
    head.writeUInt32LE(data.length, 18);
    head.writeUInt32LE(data.length, 22);
    head.writeUInt16LE(n.length, 26);
    local.push(head, n, data);
    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4);
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(0x0800, 8);
    dir.writeUInt32LE(crc, 16);
    dir.writeUInt32LE(data.length, 20);
    dir.writeUInt32LE(data.length, 24);
    dir.writeUInt16LE(n.length, 28);
    dir.writeUInt32LE(offset, 42);
    central.push(dir, n);
    offset += 30 + n.length + data.length;
  }
  const size = central.reduce((s, b) => s + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(size, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, ...central, end]);
}

/** Reads a store-only zip back (for the self-test). */
function unzip(buf) {
  const out = [];
  let p = 0;
  while (buf.readUInt32LE(p) === 0x04034b50) {
    const method = buf.readUInt16LE(p + 8);
    const crc = buf.readUInt32LE(p + 14);
    const len = buf.readUInt32LE(p + 18);
    const nlen = buf.readUInt16LE(p + 26);
    const name = buf.subarray(p + 30, p + 30 + nlen).toString("utf8");
    const raw = buf.subarray(p + 30 + nlen, p + 30 + nlen + len);
    const data = method === 8 ? inflateRawSync(raw) : raw;
    if (crc32(data) !== crc) throw new Error(`crc mismatch: ${name}`);
    out.push({ name, data });
    p += 30 + nlen + len;
  }
  return out;
}

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith(".html"))
    .map((e) => join(e.parentPath, e.name));
}

function build(slug) {
  const dir = join(src, slug);
  const base = `/tpl/${slug}`;
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const run = (args) =>
    execFileSync(npm, args, {
      cwd: dir,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, TEMPLATE_BASE: base, NEXT_TELEMETRY_DISABLED: "1" },
    });
  if (!existsSync(join(dir, "node_modules")))
    run(["ci", "--ignore-scripts", "--no-audit", "--no-fund"]);
  run(["run", "build"]);

  const built = ["out", "dist"].map((d) => join(dir, d)).find(existsSync);
  if (!built) throw new Error(`${slug}: no out/ or dist/ after build`);
  const target = join(pub, slug);
  rmSync(target, { recursive: true, force: true });
  cpSync(built, target, { recursive: true });

  for (const f of htmlFiles(target)) {
    const html = readFileSync(f, "utf8");
    if (!html.includes("<head>")) throw new Error(`${slug}: no <head> in ${relative(target, f)}`);
    writeFileSync(f, html.replace("<head>", `<head>${SHIM}`));
  }
  for (const e of readdirSync(target, { withFileTypes: true, recursive: true })) {
    const f = join(e.parentPath, e.name);
    if (e.isFile() && statSync(f).size > MAX_FILE)
      throw new Error(`${slug}: ${e.name} is over 25 MiB`);
  }

  const entries = files(dir).map((name) => ({
    name: `${slug}/${name}`,
    data: readFileSync(join(dir, name)),
  }));
  writeFileSync(join(pub, `${slug}.zip`), zip(entries));
  console.log(`templates: ${slug} built, ${entries.length} source files zipped`);
}

if (process.argv.includes("--self-test")) {
  const entries = [
    { name: "a/readme.md", data: Buffer.from("สวัสดี template\n") },
    { name: "a/empty.txt", data: Buffer.alloc(0) },
    { name: "a/bin", data: Buffer.from([0, 255, 10, 13]) },
  ];
  const back = unzip(zip(entries));
  if (back.length !== 3) throw new Error("self-test: entry count");
  back.forEach((e, i) => {
    if (e.name !== entries[i].name || !e.data.equals(entries[i].data))
      throw new Error(`self-test: ${e.name}`);
  });
  if (!SHIM.startsWith("<script>") || !SHIM.endsWith("</script>"))
    throw new Error("self-test: shim");
  console.log("templates self-test: ok");
} else {
  const all = readdirSync(src, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  const pick = process.argv.slice(2);
  for (const s of pick) if (!all.includes(s)) throw new Error(`unknown template: ${s}`);
  mkdirSync(pub, { recursive: true });
  for (const slug of pick.length ? pick : all) build(slug);
}
