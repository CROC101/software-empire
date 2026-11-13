// Builds the crocwork apps from their source repo into public/apps/<app>/ (Tier B modules).
//   node tools/apps.mjs [path-to-source-clone] [app ...]
// Without a path it clones the pinned commit into a temp folder. The apps are crocwork's
// (public/apps/LICENSE); the MIT notice of the code they started from stays in
// public/apps/THIRD_PARTY_NOTICES.txt. AGPL code can't be relicensed, so it is never built.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { platform, tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { argv, exit } from "node:process";
import console from "node:console";

// change the apps in their source repo, then bump COMMIT
const REPO = "https://github.com/CROC101/crocwork-apps";
const COMMIT = "ae8af993";
const here = resolve(import.meta.dirname, "..");
const out = join(here, "public/apps");
const root = resolve(here, "../..");
const manifest = join(here, "src/lib/apps.json");
if (argv[2] === "stamp") {
  stamp();
  exit(0);
}
if (argv[2] === "brand") {
  for (const d of readdirSync(out, { withFileTypes: true }))
    if (d.isDirectory() && d.name !== "fonts") brandApp(join(out, d.name));
  console.log("branded");
  exit(0);
}
const [src = cloneSource(), ...only] = argv.slice(2);
const npm = platform() === "win32" ? "npm.cmd" : "npm";
const sh = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: "inherit", shell: platform() === "win32" });

function cloneSource() {
  const dir = mkdtempSync(join(tmpdir(), "crocwork-apps-"));
  sh("git", ["clone", "--filter=blob:none", REPO, dir]);
  sh("git", ["checkout", COMMIT], dir);
  return dir;
}

const licenceOf = (dir) => {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const licence = readdirSync(dir).find((f) => /^licen[cs]e/i.test(f));
  const agpl =
    /AGPL/i.test(pkg.license ?? "") ||
    (licence && /AFFERO/.test(readFileSync(join(dir, licence), "utf8")));
  return agpl ? "AGPL-3.0-only" : "MIT";
};

export function themeHtml(html) {
  // the games (backgammon, chess, checkers) inject Puter's SDK only when window.puter is missing
  // first in <head>, so inline loaders (3d) already see window.puter
  if (!/js\.puter\.com[^>]*><\/script>/.test(html))
    html = html.replace(/<head[^>]*>/, '$&\n    <script src="../crocwork-sdk.js"></script>');
  return (
    html
      .replace(
        /<script[^>]*js\.puter\.com[^>]*><\/script>\s*/g,
        '<script src="../crocwork-sdk.js"></script>\n',
      )
      .replace(/<link rel="canonical"[^>]*>\s*/g, "")
      // no third-party traffic: upstream's analytics (its inline stub stays and only queues
      // in memory) and connection hints to Puter's CDN
      .replace(/<script[^>]*plausible\.io[^>]*><\/script>\s*/g, "")
      .replace(/<link[^>]*js\.puter\.com[^>]*>\s*/g, "")
      // inline scripts that inject the SDK themselves (3d) get the shim, a no-op the second time
      .replaceAll("https://js.puter.com/v2/", "../crocwork-sdk.js")
      .replace("</head>", '  <link rel="stylesheet" href="../crocwork.css" />\n</head>')
  );
}

// The apps are crocwork's: Puter's name becomes ours in what users read, and links to Puter's
// app store, an app's own puter.com site or its old GitHub repo lead back to our gallery.
// Whole word only: internal names like PuterOCR keep theirs.
// (a declaration, not a const: "brand" mode at the top runs before the module body gets here)
export function brand(text) {
  const sites = { captable: "cap-table", inventory: "inventory" };
  return text
    .replace(/\bPuter(?:\.js| SDK)?\b/g, "crocwork")
    .replace(/https:\/\/(?:www\.|apps\.|builder\.)?puter\.com\/?(?=["'`])/g, "/apps/")
    .replace(/https:\/\/github\.com\/heyputer\/[\w-]+/gi, "/apps/")
    .replaceAll("-//Everything//", "-//crocwork//")
    .replace(/https:\/\/(captable|inventory)\.puter\.com\/?/g, (_, s) => `/apps/${sites[s]}/`);
}

// shortcut: bundle names keep their hash, so an app's service worker may show its cached copy
// (old wording) until it updates; fine before launch, rebuild from the fork to get new hashes
function brandApp(dir) {
  const name = basename(dir);
  for (const f of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!f.isFile() || !/\.(html|js|json|webmanifest)$/.test(f.name)) continue;
    const file = join(f.parentPath, f.name);
    const text = readFileSync(file, "utf8");
    let next = brand(text);
    // every page, not just index.html (cap-table and inventory ship docs sites): no analytics,
    // and "/docs/", "/assets/x.css", "/" mean this app's own folder, not our site root
    if (f.name.endsWith(".html")) {
      // the tag has a line of its own; the guard test fails if one is ever left
      next = next
        .split("\n")
        .filter((line) => !/^\s*<script[^>]*plausible\.io[^>]*><\/script>\s*$/.test(line))
        .join("\n")
        .replace(/((?:href|src|content)=")\/(?!\/|apps\/)([^"#?]*)/g, (m, attr, path) =>
          existsSync(join(dir, path)) ? `${attr}/apps/${name}/${path}` : m,
        );
    }
    if (next !== text) writeFileSync(file, next);
  }
}

// The apps' service workers cache ../crocwork-sdk.js and ../crocwork.css; a content hash in the
// URL makes them fetch a changed copy (each index.html is fetched network-first).
// shortcut: palette.css and the fonts are not versioned, restamp by hand if they change.
function stamp() {
  const v = createHash("sha256")
    .update(readFileSync(join(out, "crocwork-sdk.js")))
    .update(readFileSync(join(out, "crocwork.css")))
    .digest("hex")
    .slice(0, 8);
  for (const d of readdirSync(out, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name === "fonts") continue;
    const index = join(out, d.name, "index.html");
    const html = readFileSync(index, "utf8");
    writeFileSync(
      index,
      html.replace(/\.\.\/(crocwork-sdk.js|crocwork\.css)(\?v=\w+)?/g, `../$1?v=${v}`),
    );
  }
  console.log(`stamped ?v=${v}`);
}

// categories, names and descriptions (th, en) in the manifest are edited by hand: keep them on a rebuild
let saved = "[]";
try {
  saved = readFileSync(manifest, "utf8");
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const known = Object.fromEntries(JSON.parse(saved).map((a) => [a.slug, a]));
const apps = [];
for (const name of readdirSync(join(src, "src")).sort()) {
  const dir = join(src, "src", name);
  if (!existsSync(join(dir, "package.json")) || (only.length && !only.includes(name))) continue;
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  if (licenceOf(dir) !== "MIT") {
    console.error(`!! ${name} is not MIT, skipped (its code can't become crocwork's)`);
    continue;
  }
  const dest = join(out, name);
  console.log(`\n== ${name}`);
  try {
    sh(npm, ["ci", "--no-audit", "--no-fund", "--ignore-scripts"], dir);
    rmSync(dest, { recursive: true, force: true });
    sh(
      npm,
      [
        "exec",
        "--",
        "vite",
        "build",
        "--base=./",
        `--outDir=${dest}`,
        "--emptyOutDir",
        "--sourcemap=false",
      ],
      dir,
    );
  } catch {
    console.error(`!! ${name} failed to build, skipped`);
    rmSync(dest, { recursive: true, force: true });
    continue;
  }
  const index = join(dest, "index.html");
  const html = readFileSync(index, "utf8");
  writeFileSync(index, themeHtml(html));
  // calendar's guest pages answer booking links served by Puter Workers, which the shim never
  // creates, and they would call *.puter.work
  for (const f of ["book.html", "rsvp.html"]) rmSync(join(dest, f), { force: true });
  // a worker registered at "/sw.js" is written for the site root (it caches "/" as its shell):
  // under /apps/<app>/ it would cache our home page, so it is not registered at all
  for (const f of readdirSync(join(dest, "assets")).filter((f) => f.endsWith(".js"))) {
    const js = readFileSync(join(dest, "assets", f), "utf8");
    // "/app-icon.png", "/photo-engine.wasm": files at the app's own root, which here is
    // /apps/<app>/ (pages and workers alike)
    const fixed = js
      .replace(/\.register\((["'`])\/sw\.js\1\)/g, ".getRegistration()")
      .replace(/(["'`])\/([\w.-]+\.\w+)\1/g, (m, q, file) =>
        existsSync(join(dest, file)) ? `${q}/apps/${name}/${file}${q}` : m,
      );
    if (fixed !== js) writeFileSync(join(dest, "assets", f), fixed);
  }
  brandApp(dest);
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1].trim() || name;
  const description = pkg.description ?? "";
  apps.push(
    known[name] ?? {
      slug: name,
      category: "other",
      name: { th: title, en: title },
      description: { th: description, en: description },
    },
  );
}
stamp();
// the MIT licence asks for its notice in every copy: one file for all the apps (older commits of
// the source repo still have it as their root LICENSE)
const notices = join(src, "THIRD_PARTY_NOTICES.txt");
writeFileSync(
  join(out, "THIRD_PARTY_NOTICES.txt"),
  existsSync(notices)
    ? readFileSync(notices, "utf8")
    : `Notices for third-party code used in the crocwork apps.\n\n${readFileSync(join(src, "LICENSE"), "utf8")}`,
);

mkdirSync(join(out, "fonts"), { recursive: true });
cpSync(join(root, "packages/ui/src/palette.css"), join(out, "palette.css"));
for (const f of ["NotoSansThai-Variable.woff2", "OFL-NotoSansThai.txt"])
  cpSync(join(root, "apps/hub/public/fonts", f), join(out, "fonts", f));
if (!only.length) writeFileSync(manifest, `${JSON.stringify(apps, null, 2)}\n`);
console.log(`\nbuilt ${apps.length} apps into ${out}`);
