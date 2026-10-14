import { htmlEscape } from "./developer";

/// เครื่องมือ SEO — สร้าง/ตรวจข้อความในเครื่อง **ไม่ดึงหน้าเว็บจริง** (ไม่ส่งคำขอออก · กัน SSRF)

/// Google ตัดชื่อเรื่องตามความกว้างพิกเซล (~600px) ใช้จำนวนตัวอักษรเป็นค่าประมาณ
export const TITLE_RANGE = { min: 30, max: 60 };
export const DESCRIPTION_RANGE = { min: 70, max: 160 };

export function graphemeLength(text: string): number {
  return [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(text)].length;
}

export function lengthVerdict(length: number, range: { min: number; max: number }): string {
  if (length === 0) return "ว่าง";
  if (length < range.min) return `สั้นไป (แนะนำ ${range.min}–${range.max})`;
  if (length > range.max) return `ยาวไป อาจถูกตัด (แนะนำ ${range.min}–${range.max})`;

  return "ความยาวเหมาะสม";
}

export function truncateForSerp(text: string, max: number): string {
  const chars = [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(text)].map(
    (s) => s.segment,
  );

  return chars.length > max
    ? `${chars
        .slice(0, max - 1)
        .join("")
        .trimEnd()}…`
    : text;
}

export function metaTags(o: {
  title: string;
  description: string;
  url: string;
  image: string;
  siteName: string;
  locale: string;
  twitterCard: string;
  robots: string;
}): string {
  const attr = (s: string) => htmlEscape(s.trim());
  const lines = [
    `<title>${attr(o.title)}</title>`,
    `<meta name="description" content="${attr(o.description)}">`,
    o.robots && `<meta name="robots" content="${attr(o.robots)}">`,
    o.url && `<link rel="canonical" href="${attr(o.url)}">`,
    "",
    "<!-- Open Graph -->",
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${attr(o.title)}">`,
    `<meta property="og:description" content="${attr(o.description)}">`,
    o.url && `<meta property="og:url" content="${attr(o.url)}">`,
    o.image && `<meta property="og:image" content="${attr(o.image)}">`,
    o.siteName && `<meta property="og:site_name" content="${attr(o.siteName)}">`,
    o.locale && `<meta property="og:locale" content="${attr(o.locale)}">`,
    "",
    "<!-- Twitter / X -->",
    `<meta name="twitter:card" content="${attr(o.twitterCard)}">`,
    `<meta name="twitter:title" content="${attr(o.title)}">`,
    `<meta name="twitter:description" content="${attr(o.description)}">`,
    o.image && `<meta name="twitter:image" content="${attr(o.image)}">`,
  ];

  return lines
    .filter((l): l is string => typeof l === "string" && l !== "")
    .join("\n")
    .replace(/\n<!--/gu, "\n\n<!--");
}

export function robotsTxt(o: {
  userAgent: string;
  disallow: string;
  allow: string;
  sitemap: string;
  crawlDelay: number;
}): string {
  const paths = (s: string) =>
    s
      .split(/\r?\n/u)
      .map((p) => p.trim())
      .filter(Boolean);
  const out = [`User-agent: ${o.userAgent.trim() || "*"}`];

  for (const p of paths(o.allow)) out.push(`Allow: ${p}`);
  for (const p of paths(o.disallow)) out.push(`Disallow: ${p}`);
  if (!paths(o.disallow).length && !paths(o.allow).length) out.push("Disallow:");
  if (o.crawlDelay > 0) out.push(`Crawl-delay: ${o.crawlDelay}`);
  if (o.sitemap.trim()) out.push("", `Sitemap: ${o.sitemap.trim()}`);

  return out.join("\n");
}

export function sitemapXml(urls: string, changefreq: string, priority: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const list = urls
    .split(/\r?\n/u)
    .map((u) => u.trim())
    .filter(Boolean);

  if (!list.length) throw new Error("กรอก URL อย่างน้อย 1 บรรทัด");
  if (list.length > 50_000) throw new Error("sitemap หนึ่งไฟล์มีได้ไม่เกิน 50,000 URL");

  for (const u of list)
    if (!/^https?:\/\/[^\s]+$/iu.test(u)) throw new Error(`URL ไม่ถูกต้อง: ${u}`);

  const body = list
    .map(
      (u) =>
        `  <url>\n    <loc>${htmlEscape(u)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

export function utmUrl(o: {
  url: string;
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
}): string {
  let url: URL;

  try {
    url = new URL(o.url.trim());
  } catch {
    throw new Error("URL ไม่ถูกต้อง (ต้องขึ้นต้นด้วย https://)");
  }

  if (!/^https?:$/u.test(url.protocol)) throw new Error("รองรับเฉพาะ http/https");

  const set = (k: string, v: string) => v.trim() && url.searchParams.set(k, v.trim());

  set("utm_source", o.source);
  set("utm_medium", o.medium);
  set("utm_campaign", o.campaign);
  set("utm_term", o.term);
  set("utm_content", o.content);

  return url.toString();
}

/// ความหนาแน่นคีย์เวิร์ด — นับคำด้วย Intl.Segmenter (ตัดคำไทยได้)
export function keywordDensity(text: string, top = 20) {
  const words = [...new Intl.Segmenter("th", { granularity: "word" }).segment(text.toLowerCase())]
    .filter((s) => s.isWordLike && s.segment.trim().length > 1)
    .map((s) => s.segment);
  const counts = new Map<string, number>();

  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);

  return {
    total: words.length,
    rows: [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, top)
      .map(([word, count]) => ({
        word,
        count,
        density: (count / Math.max(words.length, 1)) * 100,
      })),
  };
}

export function hreflangTags(lines: string): string {
  return lines
    .split(/\r?\n/u)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      const m = /^([a-z]{2}(?:-[A-Za-z]{2})?|x-default)\s+(https?:\/\/\S+)$/u.exec(l);

      if (!m)
        throw new Error(`บรรทัด ${i + 1}: ต้องเป็น "รหัสภาษา URL" เช่น th https://example.com/th`);

      return `<link rel="alternate" hreflang="${m[1]}" href="${htmlEscape(m[2])}">`;
    })
    .join("\n");
}
