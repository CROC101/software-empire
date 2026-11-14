// Builds the crocwork icon library (route /icons) into public/icons/ from theSVG
// (github.com/glincker/thesvg, MIT) at a pinned commit:
//   node tools/icons.mjs [path-to-thesvg-clone]
// Only icons whose own licence lets us redistribute them (OK below) are copied, default variant
// only. The logos stay their owners' trademarks: the page and NOTICE.txt say so, and each
// icon shows its licence. Files that could run code or load from elsewhere are left out.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { argv } from "node:process";
import console from "node:console";

const REPO = "https://github.com/glincker/thesvg";
const COMMIT = "389ef0d727ed09e78749e2de8b1ba1273439a146";
export const OK = /^(MIT|CC0-1\.0|Apache-2\.0|ISC|BSD-[23]-Clause|Unlicense|CC-BY-[34]\.0)$/;
// script, event handlers, embedded HTML, links out (an <img> would not run them, but people
// paste the copied SVG into their own pages)
export const UNSAFE =
  /<script|<foreignObject|\son\w+\s*=|javascript:|(?:href|src)\s*=\s*["'](?!#|data:image\/)|@import|url\(\s*["']?(?!#|data:image\/)/i;
const here = resolve(import.meta.dirname, "..");
const out = join(here, "public/icons");

function clone() {
  const dir = mkdtempSync(join(tmpdir(), "thesvg-"));
  const git = (...a) => execFileSync("git", a, { cwd: dir, stdio: "inherit" });
  git("init", "-q");
  git("remote", "add", "origin", REPO);
  git(
    "sparse-checkout",
    "set",
    "--no-cone",
    "/LICENSE",
    "/src/data/icons.json",
    "/public/icons/*/default.svg",
  );
  git("fetch", "-q", "--depth=1", "--filter=blob:none", "origin", COMMIT);
  git("checkout", "-q", "FETCH_HEAD");
  return dir;
}

function build(src) {
  const icons = JSON.parse(readFileSync(join(src, "src/data/icons.json"), "utf8"));
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const index = [];
  const licences = {};
  let unsafe = 0;
  for (const i of icons) {
    if (!OK.test(i.license) || !/^[a-z0-9-]+$/.test(i.slug)) continue;
    const file = join(src, "public/icons", i.slug, "default.svg");
    if (!existsSync(file)) continue;
    const svg = readFileSync(file, "utf8");
    if (UNSAFE.test(svg)) {
      unsafe++;
      continue;
    }
    writeFileSync(join(out, `${i.slug}.svg`), svg);
    licences[i.license] = (licences[i.license] ?? 0) + 1;
    // [slug, title, hex, licence, collection, categories, aliases]
    index.push([
      i.slug,
      i.title,
      i.hex ?? "",
      i.license,
      i.collection ?? "brands",
      (i.categories ?? []).join(","),
      (i.aliases ?? []).join(","),
    ]);
  }
  index.sort((a, b) => a[1].localeCompare(b[1]));
  writeFileSync(join(out, "index.json"), JSON.stringify(index));
  writeFileSync(
    join(out, "NOTICE.txt"),
    `crocwork icon library

The icons come from theSVG (${REPO}, commit ${COMMIT}). Only icons published under one of
these licences are included (count each):
${Object.entries(licences)
  .map(([l, n]) => `  ${l}: ${n}`)
  .join("\n")}
Each icon's licence is shown on the library page next to it.

The brand names and logos are trademarks of their owners. crocwork is not affiliated with,
endorsed by or sponsored by any of them. Use a logo only to refer to its brand, and follow
the brand's own guidelines.

theSVG's licence for its code and collection:

${readFileSync(join(src, "LICENSE"), "utf8")}`,
  );
  console.log(`icons: ${index.length} copied, ${unsafe} left out as unsafe`);
}

if (import.meta.main ?? argv[1] === import.meta.filename) build(argv[2] ?? clone());
