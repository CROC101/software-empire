// The open-source font library on /fonts. Fonts come from usemodify.com (a curated directory of
// free fonts); each family keeps its own licence, written into its zip.
//   node apps/design/tools/fonts.mjs            download every file in fonts.lock.json into
//                                               public/fontlib/<slug>/, check SHA256, write one zip
//                                               per family (TTF + WOFF + CSS + licence + how-to)
//   node apps/design/tools/fonts.mjs --scan     re-read usemodify.com and rewrite src/lib/fonts.json
//                                               (what the page shows) and tools/fonts.lock.json
//   node apps/design/tools/fonts.mjs --self-test
// public/fontlib is not in git; deploy.yml runs this before the design build.
import { createHash } from "node:crypto";
import dns from "node:dns";
import net from "node:net";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { zip } from "./templates.mjs";

// the host answers slowly and its IPv6 route times out from some networks: IPv4 first, and no
// 250 ms happy-eyeballs cut-off per address
dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamily(false);

const app = fileURLToPath(new URL("../", import.meta.url));
const SITE = "https://usemodify.com";
const LIST = join(app, "src/lib/fonts.json");
const LOCK = join(app, "tools/fonts.lock.json");
const PUB = join(app, "public/fontlib");
const KINDS = ["ttf", "woff"];

const text = (h) =>
  h
    .replace(/<[^>]*>?/g, "")
    .replace(/[<>]/g, "") // React escapes it anyway; keeps the manifest plain text
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&") // last, so "&amp;quot;" stays "&quot;"
    .trim();

/** The <li> items of the meta list with this class on a font page. */
function items(html, cls) {
  const m = html.match(new RegExp(`<ul class='${cls}'>[^<]*([\\s\\S]*?)</ul>`));
  return m ? [...m[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => x[1]) : [];
}

/** One font page into a family entry, or null when the page has no public files yet. */
export function parse(slug, html) {
  const at = html.indexOf("<div class='typeface'>");
  if (at < 0) return null;
  const page = html.slice(at);
  const list = page.slice(0, Math.max(0, page.indexOf("<div class='related'>")) || undefined);
  const styles = new Map();
  for (const [, path, base, ext] of list.matchAll(
    /url\('(\/site\/assets\/files\/\d+\/([^'/]+?))\.(ttf|woff)'\)/g,
  )) {
    const s = styles.get(base) ?? { file: base, src: {} };
    s.src[ext] = `${path}.${ext}`;
    styles.set(base, s);
  }
  const fonts = [...styles.values()].filter((s) => s.src.ttf || s.src.woff);
  if (!fonts.length) return null;
  return {
    slug,
    name: text(page.match(/<li class='fontname'>([\s\S]*?)<\/li>/)?.[1] ?? slug),
    authors: items(page, "authors").map(text).filter(Boolean),
    licence: items(page, "license").map(text).filter(Boolean),
    source: items(page, "download_url")
      .map((x) => x.match(/href='([^']+)'/)?.[1])
      .filter(Boolean)[0],
    tags: items(page, "keywords").map(text).filter(Boolean),
    styles: fonts,
  };
}

/** Plain file names only: they become URL paths and zip entries. */
const safe = (s) => /^[A-Za-z0-9._-]+$/.test(s);

/** @font-face rules for a family; url is where the files sit relative to the CSS. */
export function css(family, url = "") {
  return family.styles
    .map((s) => {
      const src = KINDS.filter((k) => s.files.includes(k))
        .reverse()
        .map((k) => `url("${url}${s.file}.${k}") format("${k === "ttf" ? "truetype" : "woff"}")`)
        .join(",\n       ");
      return `@font-face {\n  font-family: "${s.file}";\n  src: ${src};\n  font-display: swap;\n}\n`;
    })
    .join("\n");
}

function licence(f) {
  return [
    `${f.name}`,
    `Designed by: ${f.authors.join(", ") || "not named on the source page"}`,
    `Licence: ${f.licence.join(" + ") || "not stated on the source page"}`,
    f.source ? `Original files and full licence text: ${f.source}` : "",
    `Listed at: ${SITE}/fonts/${f.slug}/`,
    "",
    "These fonts are the designers' work, shared under the licence above. Keep this file with the",
    "fonts when you pass them on.",
    ...(f.licence.some((l) => /SIL Open Font/i.test(l))
      ? [
          "Under the SIL Open Font License you may use them in any project, embed them in documents",
          "and apps, and sell what you make with them, but you may not sell the font files on their",
          "own, and a changed font must get a new name.",
        ]
      : ["Read the full terms at the source above before you use them in paid work."]),
    "",
  ]
    .filter((l, i) => l || i > 3)
    .join("\n");
}

const HOWTO = `How to use these fonts

ttf/   install on your computer or tablet
  Windows: right-click the .ttf, Install. macOS: double-click, Install Font (Font Book).
  After that the font shows up in Word, PowerPoint, Excel, Keynote, Pages, Photoshop,
  Illustrator, Affinity, Figma (desktop app) and anything else that lists system fonts.
  PDF: pick the font in your app and export or print to PDF; the font is embedded in the file.
  iPad and iPhone (Goodnotes, Procreate, Notability, Keynote): open the .ttf with a font
  installer app from the App Store, install it, then pick it in the app.
  Canva: Brand Kit, Upload a font, choose the .ttf (needs a Canva plan that allows font uploads).

woff/  for websites
  Copy woff/ and fonts.css into your site and link fonts.css, or paste its @font-face rules into
  your own CSS, then use font-family: "<name from fonts.css>".
  Tailwind v4:  @theme { --font-display: "<name from fonts.css>", sans-serif; }

LICENSE.txt   who made the font and the licence it is shared under
`;

/** The body of url; null when the source says 404 (some pages link files it no longer has). */
async function get(url) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "crocwork-design-fonts" } });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) {
      if (i >= 3) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

/** Runs jobs a few at a time: the source is one small site. */
async function pool(jobs, n = 6) {
  const out = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (next < jobs.length) {
        const i = next++;
        out[i] = await jobs[i]();
      }
    }),
  );
  return out;
}

const sha = (b) => createHash("sha256").update(b).digest("hex");

async function scan() {
  const home = String(await get(`${SITE}/`));
  const slugs = [
    ...new Set([...home.matchAll(/href=['"]\/fonts\/([^'"/]+)\/['"]/g)].map((m) => m[1])),
  ];
  const pages = await pool(
    slugs.map(
      (slug) => async () => parse(slug, String((await get(`${SITE}/fonts/${slug}/`)) ?? "")),
    ),
    4,
  );
  const families = pages.filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
  const lock = {};
  const jobs = [];
  const missing = [];
  for (const f of families) {
    if (!safe(f.slug)) throw new Error(`odd slug: ${f.slug}`);
    for (const s of f.styles) {
      if (!safe(s.file)) throw new Error(`odd file name: ${f.slug}/${s.file}`);
      for (const k of KINDS)
        if (s.src[k])
          jobs.push(async () => {
            const b = await get(SITE + s.src[k]);
            if (!b) return void missing.push(`${f.slug}/${s.file}.${k}`);
            lock[`${f.slug}/${s.file}.${k}`] = {
              url: SITE + s.src[k],
              sha256: sha(b),
              bytes: b.length,
            };
          });
    }
  }
  await pool(jobs);
  const has = (f, s, k) => `${f.slug}/${s.file}.${k}` in lock;
  const list = families
    .map(({ styles, ...f }) => ({
      ...f,
      styles: styles
        .map((s) => ({ file: s.file, files: KINDS.filter((k) => has(f, s, k)) }))
        .filter((s) => s.files.length),
    }))
    .filter((f) => f.styles.length);
  const sorted = Object.fromEntries(Object.entries(lock).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(LIST, JSON.stringify(list, null, 1) + "\n");
  writeFileSync(LOCK, JSON.stringify(sorted, null, 1) + "\n");
  const mb = Object.values(lock).reduce((a, x) => a + x.bytes, 0) / 2 ** 20;
  console.log(
    `fonts: ${slugs.length} pages, ${list.length} with files, ${Object.keys(lock).length} files, ${mb.toFixed(1)} MiB, missing at the source: ${missing.join(" ") || "none"}`,
  );
}

async function fetchAll() {
  const list = JSON.parse(readFileSync(LIST, "utf8"));
  const lock = JSON.parse(readFileSync(LOCK, "utf8"));
  const read = (p) => (existsSync(p) ? readFileSync(p) : null);
  await pool(
    Object.entries(lock).map(([path, { url, sha256 }]) => async () => {
      // the lock is reviewed in git, but never let a key escape public/fontlib
      if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\.(ttf|woff)$/.test(path) || path.includes(".."))
        throw new Error(`fonts: bad path in lock: ${path}`);
      const file = join(PUB, path);
      if (read(file) && sha(read(file)) === sha256) return;
      const b = await get(url);
      if (!b || sha(b) !== sha256)
        throw new Error(`fonts: ${path} changed at the source (SHA256), run --scan and review`);
      mkdirSync(join(file, ".."), { recursive: true });
      writeFileSync(file, b);
    }),
  );
  for (const f of list) {
    const entries = [
      { name: `${f.slug}/LICENSE.txt`, data: Buffer.from(licence(f)) },
      { name: `${f.slug}/HOW-TO-USE.txt`, data: Buffer.from(HOWTO) },
      { name: `${f.slug}/fonts.css`, data: Buffer.from(css(f, "woff/")) },
    ];
    for (const s of f.styles)
      for (const k of s.files)
        entries.push({
          name: `${f.slug}/${k}/${s.file}.${k}`,
          data: readFileSync(join(PUB, f.slug, `${s.file}.${k}`)),
        });
    writeFileSync(join(PUB, `${f.slug}.zip`), zip(entries));
  }
  console.log(`fonts: ${list.length} families ready in public/fontlib`);
}

if (process.argv.includes("--self-test")) {
  const page = `<div class='typeface'><ul class='meta'><li class='fontname'><a href='/fonts/aquis/'>Aquis</a></li>
<li><ul class='download_url'>Download and information:<li><a href='https://example.com/a'>External link</a></li></ul></li>
<li><ul class='authors'>Designed by:<li><a href='/authors/x/'>Erwan Le R&amp;tif</a> </li></ul></li>
<li><ul class='keywords'>Tagged with:<li><a href='/keywords/serif-1/'>serif</a></li></ul></li>
<li><ul class='license'>License:<li>SIL Open Font License, 1.1</li></ul></li></ul>
<div class='fontlist'><div class='font'><style>@font-face{src:url('/site/assets/files/1498/aquis-regular.eot');
src:url('/site/assets/files/1498/aquis-regular.woff') format('woff'),url('/site/assets/files/1498/aquis-regular.ttf') format('truetype')}</style></div></div>
<div class='related'><style>@font-face{src:url('/site/assets/files/1/other.ttf')}</style></div>`;
  const f = parse("aquis", page);
  const want = JSON.stringify({
    slug: "aquis",
    name: "Aquis",
    authors: ["Erwan Le R&tif"],
    licence: ["SIL Open Font License, 1.1"],
    source: "https://example.com/a",
    tags: ["serif"],
    styles: [
      {
        file: "aquis-regular",
        src: {
          woff: "/site/assets/files/1498/aquis-regular.woff",
          ttf: "/site/assets/files/1498/aquis-regular.ttf",
        },
      },
    ],
  });
  if (JSON.stringify(f) !== want) throw new Error(`self-test: parse\n${JSON.stringify(f)}`);
  if (parse("x", "<div class='content'>This font is not public yet.</div>") !== null)
    throw new Error("self-test: empty page");
  const rule = css({ styles: [{ file: "a-b", files: ["ttf", "woff"] }] }, "woff/");
  if (
    !rule.includes('url("woff/a-b.woff") format("woff"),') ||
    !rule.includes('font-family: "a-b"')
  )
    throw new Error(`self-test: css\n${rule}`);
  if (safe("a/b") || safe("ä") || !safe("Aquis-Regular_1.0")) throw new Error("self-test: safe");
  console.log("fonts self-test: ok");
} else if (process.argv.includes("--scan")) {
  await scan();
} else {
  await fetchAll();
}
