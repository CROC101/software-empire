// Builds the MIT apps of HeyPuter/everything into public/everything/<app>/ (Tier B modules).
//   node tools/everything.mjs [path-to-everything-clone] [app ...]
// Without a path it clones the pinned commit into a temp folder. AGPL apps are skipped on
// purpose: hosting them would oblige us to publish their source.
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
import { join, resolve } from "node:path";
import { argv, exit } from "node:process";
import console from "node:console";

const REPO = "https://github.com/HeyPuter/everything";
const COMMIT = "ae8af993";
const here = resolve(import.meta.dirname, "..");
const out = join(here, "public/everything");
const root = resolve(here, "../..");
const manifest = join(here, "src/lib/everything-apps.json");
if (argv[2] === "stamp") {
  stamp();
  exit(0);
}
const [src = cloneEverything(), ...only] = argv.slice(2);
const npm = platform() === "win32" ? "npm.cmd" : "npm";
const sh = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: "inherit", shell: platform() === "win32" });

function cloneEverything() {
  const dir = mkdtempSync(join(tmpdir(), "everything-"));
  sh("git", ["clone", "--filter=blob:none", REPO, dir]);
  sh("git", ["checkout", COMMIT], dir);
  return dir;
}

const isAgpl = (dir) => {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const licence = readdirSync(dir).find((f) => /^licen[cs]e/i.test(f));
  return (
    /AGPL/i.test(pkg.license ?? "") ||
    (licence && /AFFERO/.test(readFileSync(join(dir, licence), "utf8")))
  );
};

export function themeHtml(html) {
  // the games (backgammon, chess, checkers) inject Puter's SDK only when window.puter is missing
  if (!/js\.puter\.com[^>]*><\/script>/.test(html))
    html = html.replace("</head>", '  <script src="../puter-shim.js"></script>\n</head>');
  return (
    html
      .replace(
        /<script[^>]*js\.puter\.com[^>]*><\/script>\s*/g,
        '<script src="../puter-shim.js"></script>\n',
      )
      .replace(/<link rel="canonical"[^>]*>\s*/g, "")
      // no third-party traffic: upstream's analytics (its inline stub stays and only queues
      // in memory) and connection hints to Puter's CDN
      .replace(/<script[^>]*plausible\.io[^>]*><\/script>\s*/g, "")
      .replace(/<link[^>]*js\.puter\.com[^>]*>\s*/g, "")
      .replace("</head>", '  <link rel="stylesheet" href="../crocwork.css" />\n</head>')
  );
}

// The apps' service workers cache ../puter-shim.js and ../crocwork.css; a content hash in the
// URL makes them fetch a changed copy (each index.html is fetched network-first).
// shortcut: palette.css and the fonts are not versioned, restamp by hand if they change.
function stamp() {
  const v = createHash("sha256")
    .update(readFileSync(join(out, "puter-shim.js")))
    .update(readFileSync(join(out, "crocwork.css")))
    .digest("hex")
    .slice(0, 8);
  for (const name of readdirSync(out)) {
    const index = join(out, name, "index.html");
    if (!existsSync(index)) continue;
    const html = readFileSync(index, "utf8");
    writeFileSync(
      index,
      html.replace(/\.\.\/(puter-shim\.js|crocwork\.css)(\?v=\w+)?/g, `../$1?v=${v}`),
    );
  }
  console.log(`stamped ?v=${v}`);
}

// names and Thai descriptions in the manifest are edited by hand: keep them on a rebuild
const known = existsSync(manifest)
  ? Object.fromEntries(JSON.parse(readFileSync(manifest, "utf8")).map((a) => [a.slug, a]))
  : {};
const apps = [];
for (const name of readdirSync(join(src, "src")).sort()) {
  const dir = join(src, "src", name);
  if (!existsSync(join(dir, "package.json")) || (only.length && !only.includes(name))) continue;
  if (isAgpl(dir)) continue;
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
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
  // a worker registered at "/sw.js" is written for the site root (it caches "/" as its shell):
  // under /everything/<app>/ it would cache our home page, so it is not registered at all
  for (const f of readdirSync(join(dest, "assets")).filter((f) => f.endsWith(".js"))) {
    const js = readFileSync(join(dest, "assets", f), "utf8");
    const fixed = js.replace(/\.register\((["'`])\/sw\.js\1\)/g, ".getRegistration()");
    if (fixed !== js) writeFileSync(join(dest, "assets", f), fixed);
  }
  const own = readdirSync(dir).find((f) => /^licen[cs]e/i.test(f));
  cpSync(own ? join(dir, own) : join(src, "LICENSE"), join(dest, "LICENSE"));
  writeFileSync(
    join(dest, "SOURCE.md"),
    `${pkg.name} from ${REPO}/tree/${COMMIT}/src/${name} (MIT). Built by apps/toolboxes/tools/everything.mjs.\n`,
  );
  if (existsSync(join(dir, "icon-128.png")))
    cpSync(join(dir, "icon-128.png"), join(dest, "icon-128.png"));
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1].trim() || name;
  apps.push(known[name] ?? { slug: name, name: title, description: pkg.description ?? "" });
}
stamp();

mkdirSync(join(out, "fonts"), { recursive: true });
cpSync(join(root, "packages/ui/src/palette.css"), join(out, "palette.css"));
for (const f of ["NotoSansThai-Variable.woff2", "OFL-NotoSansThai.txt"])
  cpSync(join(root, "apps/hub/public/fonts", f), join(out, "fonts", f));
if (!only.length) writeFileSync(manifest, `${JSON.stringify(apps, null, 2)}\n`);
console.log(`\nbuilt ${apps.length} apps into ${out}`);
