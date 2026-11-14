// Makes a clone of a storytold Craft app (MIT OR Apache-2.0) crocwork's:
//   node tools/craft/rebrand.mjs <clone> <app>      app: a key of APPS (photocraft, pdfcraft, ...)
//   node tools/craft/rebrand.mjs --self-test
// What users see becomes crocwork: name, links, installer, update source, icons, and the ArtCraft
// marks (not open source, forks must remove them) are replaced by our own artwork. Copyright and
// licence lines are never touched (MIT and Apache ask us to keep them). Internal names (crates,
// binaries, env vars) keep theirs. Rerun it after merging upstream: it only rewrites what is left.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { Buffer } from "node:buffer";
import { basename, join, resolve } from "node:path";
import { argv, exit } from "node:process";
import { pathToFileURL } from "node:url";
import console from "node:console";

const here = resolve(import.meta.dirname, "../..");
const root = resolve(here, "../..");

// glyph: a lucide icon (ISC) on our 24-unit grid, drawn white on a water tile
// web: false when upstream ships no web build; webFonts: its web build embeds craft-fonts too
export const APPS = {
  photocraft: {
    upstream: "PhotoCraft",
    title: "crocwork Photo",
    repo: "CROC101/crocwork-photo",
    glyph:
      '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  },
  pdfcraft: {
    upstream: "PdfCraft",
    title: "crocwork PDF",
    repo: "CROC101/crocwork-pdf",
    glyph:
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  },
  wordcraft: {
    upstream: "WordCraft",
    title: "crocwork Word",
    repo: "CROC101/crocwork-word",
    webFonts: true,
    glyph: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>',
  },
  anicraft: {
    upstream: "AniCraft",
    title: "crocwork Animate",
    repo: "CROC101/crocwork-animate",
    web: false,
    glyph:
      '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/>',
  },
  cadcraft: {
    upstream: "CADCraft",
    title: "crocwork CAD",
    repo: "CROC101/crocwork-cad",
    glyph:
      '<path d="m12.99 6.74 1.93 3.44"/><path d="M19.136 12a10 10 0 0 1-14.271 0"/><path d="m21 21-2.16-3.84"/><path d="m3 21 8.02-14.26"/><circle cx="12" cy="5" r="2"/>',
  },
  deckcraft: {
    upstream: "DeckCraft",
    title: "crocwork Slides",
    repo: "CROC101/crocwork-slides",
    glyph: '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
  },
  designcraft: {
    upstream: "DesignCraft",
    title: "crocwork Layout",
    repo: "CROC101/crocwork-layout",
    webFonts: true,
    glyph:
      '<rect width="18" height="7" x="3" y="3" rx="1"/><rect width="9" height="7" x="3" y="14" rx="1"/><rect width="5" height="7" x="16" y="14" rx="1"/>',
  },
  effectcraft: {
    upstream: "EffectCraft",
    title: "crocwork Motion",
    repo: "CROC101/crocwork-motion",
    glyph:
      '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
  },
  figcraft: {
    upstream: "FigCraft",
    title: "crocwork Interface",
    repo: "CROC101/crocwork-interface",
    webFonts: true,
    glyph:
      '<line x1="22" x2="2" y1="6" y2="6"/><line x1="22" x2="2" y1="18" y2="18"/><line x1="6" x2="6" y1="2" y2="22"/><line x1="18" x2="18" y1="2" y2="22"/>',
  },
  materialcraft: {
    upstream: "MaterialCraft",
    title: "crocwork Material",
    repo: "CROC101/crocwork-material",
    webFonts: true,
    glyph:
      '<rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/>',
  },
  texturecraft: {
    upstream: "TextureCraft",
    title: "crocwork Texture",
    repo: "CROC101/crocwork-texture",
    webFonts: true,
    glyph:
      '<path d="m14.622 17.897-10.68-2.913"/><path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z"/><path d="M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15"/>',
  },
  vectorcraft: {
    upstream: "VectorCraft",
    title: "crocwork Vector",
    repo: "CROC101/crocwork-vector",
    webFonts: true,
    glyph:
      '<path d="m18 13-.654-4.736a4 4 0 00-2.756-3.266l-9.163-2.9a2 2 0 00-2.017.493l-.82.819a2 2 0 00-.492 2.017l2.9 9.163a4 4 0 003.266 2.756L13 18"/><path d="M18.648 12.352a1.205 1.205 0 011.704 0l1.296 1.296a1.205 1.205 0 010 1.704l-6.296 6.296a1.205 1.205 0 01-1.704 0l-1.296-1.296a1.205 1.205 0 010-1.704z"/><path d="m3 3 6.586 6.586"/><circle cx="11" cy="11" r="2"/>',
  },
};

// Whole words only: PhotocraftApp, PHOTOCRAFT_VERSION and ns.getartcraft.com (an XMP namespace
// saved inside files) stay as they are.
export function rebrandText(text, id, { inflected = false } = {}) {
  const app = APPS[id];
  // translations decline the name ("O PhotoCraftu", "ArtCrafta"): there the whole word goes
  const tail = inflected ? String.raw`[\p{L}\p{M}]*` : String.raw`\b`;
  // an escaped "\n" or "\t" in a string or catalog ends the word before the name, too
  const lead = String.raw`(?:(?<=\\[nt])|\b)`;
  const url = `https://github.com/${app.repo}`;
  return text
    .split("\n")
    .map((line) =>
      // who made what stays theirs: copyright, author and contributor lines
      /copyright|©|\(c\) \d|author|contributor/i.test(line)
        ? line
        : line
            // code names stay: Rust paths and enum variants (FileKind::FigCraft, "FigCraft,"), PowerShell
            // types ([DeckCraft.Shell], -Namespace DeckCraft), JS globals (var AniCraft =) and macOS bundles (PhotoCraft.app)
            .replace(
              new RegExp(`(?<!::|-Namespace |(?:var|let|const|function|class) )${lead}${app.upstream}${tail}(?!::|\\.\\p{L}|,\\s*$)`, "gu"),
              app.title,
            )
            // "PdfCraft PDF workbench" would read "crocwork PDF PDF workbench"
            .replaceAll(`${app.title} ${app.title.split(" ").pop()} `, `${app.title} `)
            // lower-case tail: declined forms in inline translation tables ("ArtCrafts"), not identifiers
            .replace(new RegExp(`${lead}ArtCraft${inflected ? tail : String.raw`\p{Ll}*\b`}`, "gu"), "crocwork")
            .replace(/\bLearning Machines LLC\b/g, "crocwork")
            .replace(/https:\/\/getartcraft\.com[\w./-]*/g, url)
            .replace(/https:\/\/discord\.gg\/artcraft\b/g, url)
            // the same addresses shown as link text
            .replace(/(?<![\w./])(?:getartcraft\.com(?:\/apps\/\w+)?|discord\.gg\/artcraft)\b/g, url.slice(8))
            // links to upstream's own pull requests, issues and runs stay: that history is theirs
            .replace(
              new RegExp(`github\\.com/storytold/${id}(?![\\w-]|/(?:pull|issues|actions|commits?|blob|tree|compare)/)`, "g"),
              `github.com/${app.repo}`,
            )
            // shortcut: issues stay off on our forks (no public inbox before launch), so "report a
            // problem" opens the repo; enable issues and drop this line when we take reports
            .replace(new RegExp(`(github\\.com/${app.repo})/issues(?![/\\w])`, "g"), "$1"),
    )
    .join("\n");
}

// The MSI's UpgradeCode decides which installed app an installer replaces: ours must never
// replace (or be replaced by) upstream's. Derived from the app id so every rebuild keeps it.
export function upgradeCode(id) {
  const h = createHash("sha1").update(`crocwork:${id}`).digest("hex");
  const v = `5${h.slice(13, 16)}`;
  const variant = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${v}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`.toUpperCase();
}

// palette.css holds OKLCH; a raster icon needs sRGB
export function oklchHex(l, c, h) {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
  return `#${linear
    .map((x) => {
      const v = Math.min(1, Math.max(0, x));
      const s = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
      return Math.round(s * 255)
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
}

function token(name) {
  const css = readFileSync(join(root, "packages/ui/src/palette.css"), "utf8");
  const m = new RegExp(`--em-${name}:\\s*oklch\\(([\\d.]+) ([\\d.]+) ([\\d.]+)\\)`).exec(css);
  if (!m) throw new Error(`--em-${name} is not an oklch() value in palette.css`);
  return oklchHex(+m[1], +m[2], +m[3]);
}

// the water tile (crocwork-design: water is the only gradient), corners as upstream's tile
export function iconSvg(id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${token("sky-500")}"/><stop offset=".55" stop-color="${token("blue-500")}"/><stop offset="1" stop-color="${token("blue-700")}"/></linearGradient></defs>
  <rect width="512" height="512" rx="112" fill="url(#water)"/>
  <g transform="translate(112 112) scale(12)" fill="none" stroke="#fff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${APPS[id].glyph}</g>
</svg>
`;
}

// an .ico may hold PNG images: 6-byte header, a 16-byte entry each, then the PNGs
export function packIco(pngs) {
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(pngs.length, 4);
  let offset = head.length;
  pngs.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    head[e] = size >= 256 ? 0 : size;
    head[e + 1] = size >= 256 ? 0 : size;
    head.writeUInt16LE(1, e + 4);
    head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(data.length, e + 8);
    head.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([head, ...pngs.map((p) => p.data)]);
}

const walk = (dir, skip) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (skip.test(d.name)) return [];
    return d.isDirectory() ? walk(p, skip) : [p];
  });

async function reskin(src, id) {
  // sharp comes with Next (hub), which already renders our images
  const sharp = createRequire(
    createRequire(join(root, "apps/hub/package.json")).resolve("next/package.json"),
  )("sharp");
  const svg = Buffer.from(iconSvg(id));
  const png = (w, h = w) =>
    sharp(svg, { density: 384 })
      .resize(w, h, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  const dirs = ["assets/app-icon", "docs/brand"].map((d) => join(src, d)).filter(existsSync);
  for (const f of dirs.flatMap((d) => walk(d, /^$/))) {
    if (f.endsWith(".svg")) writeFileSync(f, svg);
    else if (f.endsWith(".png")) {
      const head = readFileSync(f).subarray(16, 24);
      writeFileSync(f, await png(head.readUInt32BE(0), head.readUInt32BE(4)));
    } else if (f.endsWith(".ico")) {
      const sizes = [16, 24, 32, 48, 64, 128, 256];
      writeFileSync(f, packIco(await Promise.all(sizes.map(async (size) => ({ size, data: await png(size) })))));
    } else if (f.endsWith(".icns")) rmSync(f); // macOS only; this fork ships web and Windows
  }
  // the folder's notes describe upstream's drawing, which is gone
  const icons = join(src, "assets/app-icon");
  const about = `${APPS[id].title} app icon: crocwork's water tile with a Lucide glyph (ISC, https://lucide.dev/license),\nmade by apps/toolboxes/tools/craft/rebrand.mjs in CROC101/software-empire. Every file in this\nfolder is rendered from it. Licensed MIT OR Apache-2.0 like the rest of this repository.\n`;
  if (existsSync(icons)) {
    writeFileSync(join(icons, "LICENSE.txt"), about);
    writeFileSync(join(icons, "README.md"), `# ${APPS[id].title} app icon\n\n${about}`);
  }
  const brand = join(src, "docs/brand/LICENSE-brand.txt");
  if (existsSync(brand))
    writeFileSync(
      brand,
      "crocwork brand assets\n\nThe artwork in this folder is crocwork's. It replaces the ArtCraft marks of the upstream\nproject, which are not open source and are not part of this fork.\n",
    );
}

// The interface translations (storytold/craft-i18n, MIT OR Apache-2.0) are keyed by the English
// text, which this script renames, so the fork keeps its own renamed copy (the rename pass below
// covers it) and builds from that instead of upstream's.
function vendorI18n(src, id) {
  const rev = readFileSync(join(src, "craft-i18n.rev"), "utf8").trim();
  const dir = mkdtempSync(join(tmpdir(), "craft-i18n-"));
  // byte for byte: language-data is pinned by sha256, and Windows git would otherwise write CRLF
  const git = (...a) => execFileSync("git", ["-c", "core.autocrlf=false", ...a], { cwd: dir, stdio: "inherit" });
  git("init", "-q");
  git("remote", "add", "origin", "https://github.com/storytold/craft-i18n");
  git("sparse-checkout", "set", "--no-cone", "/LICENSE-*", "/language-data/", "/ATTRIBUTION.md", "/locales/*/common.tsv", `/locales/*/${id}.tsv`);
  git("fetch", "-q", "--depth=1", "--filter=blob:none", "origin", rev);
  git("checkout", "-q", "FETCH_HEAD");
  const out = join(src, "craft-i18n");
  rmSync(out, { recursive: true, force: true });
  cpSync(dir, out, { recursive: true, filter: (f) => basename(f) !== ".git" });
  writeFileSync(
    join(out, "README.md"),
    `Interface translations from https://github.com/storytold/craft-i18n at ${rev} (craft-i18n.rev),
licensed MIT OR Apache-2.0 (LICENSE-MIT, LICENSE-APACHE), with the app's name renamed like the rest
of this repository. Only the shared catalog, this app's and language-data/ (unmodified, licences in language-data/licences) are kept.
`,
  );
  rmSync(dir, { recursive: true, force: true });
}

// keeps or drops each "# >name" ... "# <name" block of the release template ("!name": when off)
export function cut(yml, flags) {
  const on = (k) => (k[0] === "!" ? !flags[k.slice(1)] : flags[k]);
  for (let prev; prev !== yml; ) {
    prev = yml;
    yml = yml.replace(/^ *# >(!?\w+)\n([\s\S]*?)^ *# <\1\n/m, (_, k, body) => (on(k) ? body : ""));
  }
  // an env: left with nothing under it
  return yml.replace(/^( *)env:\n(?!\1 )/gm, "");
}

export async function rebrand(src, id) {
  const app = APPS[id];
  assert(app, `unknown app ${id}; one of ${Object.keys(APPS).join(", ")}`);
  const workflows = join(src, ".github/workflows");
  // the fonts commit upstream's release names; read before its workflows go
  const read = (f) => (existsSync(join(workflows, f)) ? readFileSync(join(workflows, f), "utf8") : "");
  const fonts =
    /craft-fonts-ref: (\w+)/.exec(read("release.yml"))?.[1] ??
    /CRAFT_FONTS_REF: (\w+)/.exec(read("crocwork-release.yml"))?.[1];
  // no fonts pin (EffectCraft) or no craft-i18n.rev: the app builds with egui's fonts / in English
  const i18n = existsSync(join(src, "craft-i18n.rev"));
  if (i18n) vendorI18n(src, id);

  // integration-testing: records of upstream's PRs and CI runs
  // language-data: third-party dictionaries pinned by sha256 upstream; kept byte for byte
  const keep = /^(\.git|target|dist|node_modules|contributors|integration-testing|language-data|Cargo\.lock|craft-i18n\.rev)$|^(LICEN[CS]E|NOTICE|COPYING)/i;
  // upstream's UpgradeCode also sits in the policy check and in <Upgrade Id>: left there, our MSI
  // fails its own policy or removes an installed upstream app
  const policy = join(src, "packaging/windows/install-policy.json");
  const theirs = existsSync(policy) && JSON.parse(readFileSync(policy, "utf8")).upgradeCode;
  const theirsRe = theirs && new RegExp(theirs.replace(/[{}]/g, ""), "gi");
  let changed = 0;
  for (const f of walk(src, keep)) {
    if (statSync(f).size > 2_000_000) continue;
    const buf = readFileSync(f);
    if (buf.subarray(0, 8000).includes(0)) continue; // binary
    const text = buf.toString("utf8");
    let next = rebrandText(text, id, { inflected: /craft-i18n[\\/]locales[\\/].*\.tsv$/.test(f) });
    if (f.endsWith(".wxs")) next = next.replace(/UpgradeCode="[^"]+"/, `UpgradeCode="${upgradeCode(id)}"`);
    if (theirsRe) next = next.replace(theirsRe, upgradeCode(id));
    // the self-updater checks our releases, under our name
    if (basename(f) === "lib.rs" && !next.includes(`repo: "${app.repo}"`))
      next = next.replace(
        /(pub const UPDATE_APP: craft_update::app::App = craft_update::app::App \{\r?\n)/,
        `$1    name: "${app.title}",\n    repo: "${app.repo}",\n    developer: "crocwork",\n`,
      );
    if (next !== text) {
      writeFileSync(f, next);
      changed++;
    }
  }
  await reskin(src, id);

  // upstream's CI calls storytold's shared workflows at @main with their signing secrets: ours
  // builds everything itself (tools/craft/release.yml)
  for (const f of existsSync(workflows) ? readdirSync(workflows) : []) rmSync(join(workflows, f));
  rmSync(join(src, ".github/dependabot.yml"), { force: true });
  const flags = { web: app.web !== false, webFonts: !!app.webFonts && !!fonts, fonts: !!fonts, i18n };
  const release = cut(readFileSync(join(import.meta.dirname, "release.yml"), "utf8"), flags)
    .replaceAll("__APP__", id)
    .replaceAll("__FONTS__", fonts);
  writeFileSync(join(workflows, "crocwork-release.yml"), release);

  writeFileSync(
    join(src, "README.md"),
    `# ${app.title}\n\n${app.title} is part of crocwork. It runs ${app.web === false ? "on Windows" : "in the browser (WebAssembly) and on Windows"}.\n\nDownloads: ${`https://github.com/${app.repo}`}/releases\n\n## Credits\n\n${app.title} started from ${app.upstream} by the ArtCraft team (https://github.com/storytold/${id}), licensed MIT OR Apache-2.0. Their copyright notices stay in LICENSE-MIT, LICENSE-APACHE and NOTICE. What crocwork changed is listed in CROCWORK.md.\n`,
  );
  writeFileSync(
    join(src, "CROCWORK.md"),
    `# Changes made by crocwork\n\nThis repository is a modified version of https://github.com/storytold/${id} (Apache-2.0 section 4(b)).\nThe changes are made by https://github.com/CROC101/software-empire/blob/main/apps/toolboxes/tools/craft/rebrand.mjs:\n\n- the app is named ${app.title}; ArtCraft, ${app.upstream} and the upstream links are replaced in what users read\n- the ArtCraft marks (docs/brand) and the app icons are replaced by crocwork artwork (icon glyph from Lucide, ISC)\n- the Windows installer has its own UpgradeCode and publisher, and updates come from ${app.repo}\n- the interface translations are a renamed copy of storytold/craft-i18n in craft-i18n/\n- the build is .github/workflows/crocwork-release.yml (web and Windows, unsigned)\n\nCopyright and licence notices are unchanged.\n`,
  );
  console.log(`${id}: ${changed} files renamed to ${app.title}, icons replaced, workflow written`);
}

function selfTest() {
  assert.equal(oklchHex(1, 0, 0), "#ffffff");
  assert.equal(oklchHex(0, 0, 0), "#000000");
  assert.equal(upgradeCode("photocraft"), upgradeCode("photocraft"));
  assert.notEqual(upgradeCode("photocraft"), "D9660F32-2D0A-4ABE-B73D-17BE25F1542C");
  assert.match(upgradeCode("pdfcraft"), /^[0-9A-F]{8}-[0-9A-F]{4}-5[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/);
  const t = (s) => rebrandText(s, "photocraft");
  assert.equal(t('APP_NAME: &str = "PhotoCraft";'), 'APP_NAME: &str = "crocwork Photo";');
  assert.equal(t("PhotocraftApp PHOTOCRAFT_VERSION PhotoCraftData"), "PhotocraftApp PHOTOCRAFT_VERSION PhotoCraftData");
  assert.equal(t("Copyright (c) 2026 Learning Machines LLC, ArtCraft"), "Copyright (c) 2026 Learning Machines LLC, ArtCraft");
  assert.equal(t('"https://getartcraft.com/apps/photocraft"'), '"https://github.com/CROC101/crocwork-photo"');
  assert.equal(t("http://ns.getartcraft.com/x/1.0/"), "http://ns.getartcraft.com/x/1.0/");
  assert.equal(t('"github.com/storytold/photocraft/issues"'), '"github.com/CROC101/crocwork-photo"');
  assert.equal(t('"https://discord.gg/artcraft"'), '"https://github.com/CROC101/crocwork-photo"');
  assert.equal(t('hyperlink_to("getartcraft.com/apps/photocraft", u)'), 'hyperlink_to("github.com/CROC101/crocwork-photo", u)');
  assert.equal(t('"discord.gg/artcraft — help"'), '"github.com/CROC101/crocwork-photo — help"');
  assert.equal(t('("Website", "ArtCrafts webbplats") ArtCraftTheme'), '("Website", "crocwork webbplats") ArtCraftTheme');
  assert.equal(t("github.com/storytold/craft-libs"), "github.com/storytold/craft-libs");
  assert.equal(t("github.com/storytold/photocraft/pull/9703"), "github.com/storytold/photocraft/pull/9703");
  assert.equal(t('"https://github.com/storytold/photocraft"'), '"https://github.com/CROC101/crocwork-photo"');
  assert.equal(t("made by the ArtCraft team"), "made by the crocwork team");
  assert.equal(t('author = "PhotoCraft contributors"'), 'author = "PhotoCraft contributors"');
  assert.equal(t("    PhotoCraft,"), "    PhotoCraft,");
assert.equal(t("var PhotoCraft = (function () {"), "var PhotoCraft = (function () {");
assert.equal(t('"x" => Kind::PhotoCraft, // PhotoCraft file'), '"x" => Kind::PhotoCraft, // crocwork Photo file');
assert.equal(t("Add-Type -Namespace PhotoCraft -Name S; [PhotoCraft.S]::X()"), "Add-Type -Namespace PhotoCraft -Name S; [PhotoCraft.S]::X()");
assert.equal(t("PhotoCraft is a photo editor. Use PhotoCraft, then"), "crocwork Photo is a photo editor. Use crocwork Photo, then");
assert.equal(t("/Applications/PhotoCraft.app/Contents"), "/Applications/PhotoCraft.app/Contents");
  assert.equal(rebrandText("PdfCraft PDF workbench", "pdfcraft"), "crocwork PDF workbench");
  const ico = packIco([{ size: 16, data: Buffer.from("png") }]);
  assert.equal(ico.readUInt16LE(4), 1);
  assert.equal(ico.readUInt32LE(18), 22);
  const tsv = (s) => rebrandText(s, "photocraft", { inflected: true });
  assert.equal(tsv("About PhotoCraft	O PhotoCraftu"), "About crocwork Photo	O crocwork Photo");
  assert.equal(tsv("Website	Web stranica ArtCrafta"), "Website	Web stranica crocwork");
  assert.equal(tsv("x	Copyright (c) 2026 ArtCraft Team"), "x	Copyright (c) 2026 ArtCraft Team");
  assert.equal(t("PhotoCraftApp"), "PhotoCraftApp");
  assert.equal(tsv(String.raw`Rust.\nArtCraft チーム`), String.raw`Rust.\ncrocwork チーム`);
  const tpl = readFileSync(join(import.meta.dirname, "release.yml"), "utf8");
  const all = cut(tpl, { web: true, webFonts: true, fonts: true, i18n: true });
  assert.doesNotMatch(all, /^ *# [<>]/m);
  assert.match(all, /needs: \[web, windows\]/);
  assert.equal(all.match(/repository: storytold\/craft-fonts/g).length, 2);
  const ani = cut(tpl, { web: false, webFonts: false, fonts: true, i18n: false });
  assert.doesNotMatch(ani, /^ {2}web:|CRAFT_I18N|^ *# [<>]|needs: \[web/m);
  assert.match(ani, /needs: \[windows\]/);
  // EffectCraft: nothing left under the windows job's env:
  const fx = cut(tpl, { web: true, webFonts: false, fonts: false, i18n: false });
  assert.doesNotMatch(fx, /CRAFT_FONTS|CRAFT_I18N/);
  assert.doesNotMatch(fx, /^( *)env:\n(?!\1 )/m);
  console.log("rebrand self-test ok");
}

if (import.meta.url === pathToFileURL(argv[1] ?? "").href) {
  if (argv[2] === "--self-test") selfTest();
  else if (argv[2] && argv[3]) await rebrand(resolve(argv[2]), argv[3]);
  else {
    console.error("usage: node tools/craft/rebrand.mjs <clone> <app> | --self-test");
    exit(1);
  }
}
