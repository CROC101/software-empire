#!/usr/bin/env node
/**
 * Thai font index from f0nt.com (public WordPress REST API, allowed by its robots.txt).
 * We keep only what points back to the source: name, designer, licence group, tags, the post's
 * own preview picture and its download link. No font file is copied; every download goes through
 * f0nt.com's own download manager, so the designer's terms and counter stay theirs.
 *
 *   node tools/f0nt.mjs            crawl and write public/data/f0nt.json
 *   node tools/f0nt.mjs --self-test
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const API = "https://www.f0nt.com/wp-json/wp/v2";
const UPLOADS = "https://www.f0nt.com/wp-content/uploads/";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
const RELEASE = 3;
/** f0nt.com licence sub-categories of "release" */
const LICENCE = { 1441: "c", 1443: "p", 1442: "d" };
const OUT = join(dirname(fileURLToPath(import.meta.url)), "../public/data/f0nt.json");

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
// drop each <tag> by cutting at "<" up to the next ">" (an unclosed "<" drops the rest),
// so no "<" can survive the way it can after a one-pass regex replace
const stripTags = (s) =>
  s
    .split("<")
    .map((part, i) => (i === 0 ? part : part.slice(part.indexOf(">") + 1 || part.length)))
    .join("");
export const decode = (s) =>
  stripTags(s)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, k) => ENT[k.toLowerCase()] ?? m)
    // names are plain text: no angle brackets survive, even ones that came in as &lt;
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// paths only: letters, digits and the few marks file names use; anything else is dropped
// no %: the site encodes the link itself, a stored % would be encoded twice
const SAFE = /^[\w\-./@()+ ~]+$/;

/** One post's fields we keep, or null when it has no download. */
export function parsePost(p) {
  const html = p.content?.rendered ?? "";
  const dl = [
    ...new Set(
      [...html.matchAll(/href="https?:\/\/www\.f0nt\.com\/\?dl_name=([^"]+)"/g)].map((m) =>
        decode(m[1]),
      ),
    ),
  ].filter((x) => SAFE.test(x));
  if (!dl.length) return null;
  let img = "";
  const tag = html.match(/<img\b[^>]*>/)?.[0] ?? "";
  const set = tag.match(/srcset="([^"]+)"/)?.[1] ?? "";
  const cands = set
    .split(",")
    .map((x) => x.trim().split(/\s+/))
    .map(([u, w]) => ({ u, w: parseInt(w ?? "0", 10) || 0 }))
    .filter((x) => x.u?.startsWith(UPLOADS))
    .sort((a, b) => a.w - b.w);
  const pick = cands.find((x) => x.w >= 300) ??
    cands.at(-1) ?? { u: tag.match(/src="([^"]+)"/)?.[1] ?? "" };
  if (pick.u.startsWith(UPLOADS) && SAFE.test(pick.u.slice(UPLOADS.length)))
    img = pick.u.slice(UPLOADS.length);
  return {
    i: p.id,
    n: decode(p.title?.rendered ?? ""),
    s: p.slug,
    d: String(p.date).slice(0, 10),
    a: p.author,
    l: (p.categories ?? [])
      .map((c) => LICENCE[c])
      .filter(Boolean)
      .sort()
      .join(""),
    t: p.tags ?? [],
    dl,
    img,
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url) {
  for (let tries = 0; ; tries++) {
    let why;
    try {
      const r = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" } });
      if (r.ok)
        return { body: await r.json(), pages: Number(r.headers.get("x-wp-totalpages")) || 1 };
      why = r.status;
    } catch (e) {
      why = e.cause?.code ?? e.message; // network blips (DNS, connect timeout) get the same retries
    }
    if (tries >= 4) throw new Error(`${why} ${url}`);
    await sleep(3000 * (tries + 1));
  }
}
async function all(path, fields) {
  const out = [];
  for (let page = 1, pages = 1; page <= pages; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const r = await get(`${API}/${path}${sep}per_page=100&page=${page}&_fields=${fields}`);
    out.push(...r.body);
    pages = r.pages;
    process.stdout.write(`\r${path.split("?")[0]} ${page}/${pages}   `);
    await sleep(1200); // be gentle with a volunteer-run site
  }
  process.stdout.write("\n");
  return out;
}

async function crawl() {
  const posts = await all(
    `posts?categories=${RELEASE}&orderby=date&order=desc`,
    "id,slug,date,title,author,categories,tags,content",
  );
  const fonts = posts.map(parsePost).filter(Boolean);
  const used = new Set(fonts.flatMap((f) => f.t));
  const authorsUsed = new Set(fonts.map((f) => f.a));
  const tags = Object.fromEntries(
    (await all("tags?orderby=count&order=desc", "id,name,count"))
      .filter((t) => used.has(t.id))
      .map((t) => [t.id, [decode(t.name), t.count]]),
  );
  const authors = Object.fromEntries(
    (await all("users", "id,name"))
      .filter((u) => authorsUsed.has(u.id))
      .map((u) => [u.id, decode(u.name)]),
  );
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(
    OUT,
    JSON.stringify({
      source: "https://www.f0nt.com",
      fetched: new Date().toISOString().slice(0, 10),
      tags,
      authors,
      fonts,
    }),
  );
  console.log(
    `${fonts.length} fonts (${posts.length - fonts.length} posts without a download skipped) -> ${OUT}`,
  );
}

function selfTest() {
  assert.equal(decode("สลัดโรล &#8211; A&amp;B <b>x</b>"), "สลัดโรล – A&B x");
  assert.equal(decode("&lt;script&gt;x"), "scriptx");
  const html =
    '<img src="https://www.f0nt.com/wp-content/uploads/2026/11/A-0.webp" srcset="https://www.f0nt.com/wp-content/uploads/2026/11/A-0.webp 1600w, https://www.f0nt.com/wp-content/uploads/2026/11/A-0-150x150.webp 150w, https://www.f0nt.com/wp-content/uploads/2026/11/A-0-300x300.webp 300w" />' +
    '<a href="https://www.f0nt.com/?dl_name=rd/A.zip">x</a><a href="https://www.f0nt.com/?dl_name=rd/A.zip">y</a>' +
    '<a href="https://www.f0nt.com/?dl_name=bad&quot;onload=x">z</a>';
  const f = parsePost({
    id: 1,
    slug: "a",
    date: "2026-11-20T10:00:00",
    title: { rendered: "A &#8211; B" },
    author: 9,
    categories: [3, 1443, 1442],
    tags: [13],
    content: { rendered: html },
  });
  assert.deepEqual(f, {
    i: 1,
    n: "A – B",
    s: "a",
    d: "2026-11-20",
    a: 9,
    l: "dp",
    t: [13],
    dl: ["rd/A.zip"],
    img: "2026/11/A-0-300x300.webp",
  });
  assert.equal(parsePost({ id: 2, content: { rendered: "<p>no file</p>" } }), null);
  console.log("f0nt self-test ok");
}

if (process.argv.includes("--self-test")) selfTest();
else await crawl();
