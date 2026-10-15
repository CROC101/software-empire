import {
  Bot,
  Code2,
  Eye,
  FileCode,
  Globe,
  Languages,
  Megaphone,
  MonitorSmartphone,
  Search,
  Share2,
  TableProperties,
  Tags,
} from "lucide-react";
import { checkbox, number, out, row, select, text, textarea } from "../fields";
import { HTTP_STATUS, MIME_TYPES, parseUserAgent } from "../impl/reference";
import {
  DESCRIPTION_RANGE,
  graphemeLength,
  hreflangTags,
  keywordDensity,
  lengthVerdict,
  metaTags,
  robotsTxt,
  sitemapXml,
  TITLE_RANGE,
  truncateForSerp,
  utmUrl,
} from "../impl/seo";
import { bool, num, str, type SpecTool } from "../types";

const httpUrl = (value: string, label: string): string => {
  const trimmed = value.trim();

  if (trimmed && !/^https?:\/\/\S+$/iu.test(trimmed))
    throw new Error(`${label} ต้องขึ้นต้นด้วย http:// หรือ https://`);

  return trimmed;
};

export const seoTools: SpecTool[] = [
  {
    kind: "spec",
    slug: "meta-tag-generator",
    name: "สร้าง Meta Tags",
    description: "สร้าง title, description, Open Graph และ Twitter Card พร้อมตรวจความยาว",
    category: "seo",
    icon: Tags,
    keywords: ["meta tags", "open graph", "og", "twitter card", "seo"],
    live: true,
    fields: [
      text("title", "ชื่อหน้า (title)", {
        defaultValue: "CS Toolboxes — เครื่องมือออนไลน์ฟรี 100+ ชิ้น",
      }),
      textarea("description", "คำอธิบาย (description)", {
        rows: 3,
        mono: false,
        defaultValue:
          "รวมเครื่องมือสำหรับนักศึกษาและบุคลากร ทำงานในเบราว์เซอร์ ข้อมูลไม่ออกจากเครื่อง",
      }),
      text("url", "URL ของหน้า (canonical)", { mono: true, placeholder: "https://…" }),
      text("image", "URL รูปตัวอย่าง (1200×630)", { mono: true, placeholder: "https://…/og.png" }),
      text("siteName", "ชื่อเว็บไซต์", { defaultValue: "CS Toolboxes" }),
      select("locale", "ภาษา", [
        ["th_TH", "ไทย (th_TH)"],
        ["en_US", "อังกฤษ (en_US)"],
      ]),
      select("twitterCard", "Twitter card", [
        ["summary_large_image", "รูปใหญ่"],
        ["summary", "รูปเล็ก"],
      ]),
      select("robots", "robots", [
        ["index, follow", "index, follow"],
        ["noindex, nofollow", "noindex, nofollow"],
        ["noindex, follow", "noindex, follow"],
      ]),
    ],
    run: (v) => {
      const title = str(v, "title");
      const description = str(v, "description");
      const tags = metaTags({
        title,
        description,
        url: httpUrl(str(v, "url"), "URL"),
        image: httpUrl(str(v, "image"), "URL รูป"),
        siteName: str(v, "siteName"),
        locale: str(v, "locale"),
        twitterCard: str(v, "twitterCard"),
        robots: str(v, "robots"),
      });

      return out.text(
        tags,
        true,
        { filename: "meta-tags.html", mime: "text/plain" },
        `title ${graphemeLength(title)} ตัว: ${lengthVerdict(graphemeLength(title), TITLE_RANGE)} · description ${graphemeLength(description)} ตัว: ${lengthVerdict(graphemeLength(description), DESCRIPTION_RANGE)}`,
      );
    },
  },
  {
    kind: "spec",
    slug: "serp-preview",
    name: "ดูตัวอย่างผลค้นหา Google",
    description: "ดูว่า title และ description จะแสดงในหน้าผลค้นหาอย่างไร และถูกตัดตรงไหน",
    category: "seo",
    icon: Search,
    keywords: ["serp", "google preview", "snippet", "seo"],
    live: true,
    fields: [
      text("title", "Title", { defaultValue: "CS Toolboxes — เครื่องมือออนไลน์ฟรีสำหรับนักศึกษา" }),
      text("url", "URL", { defaultValue: "https://example.com/tools", mono: true }),
      textarea("description", "Description", {
        rows: 3,
        mono: false,
        defaultValue:
          "แปลง JSON สร้าง QR นับคำภาษาไทย คำนวณเกรดเฉลี่ย และอีกมากกว่า 100 เครื่องมือ ใช้ฟรี ทำงานในเบราว์เซอร์",
      }),
    ],
    run: (v) => ({
      kind: "serp",
      title: truncateForSerp(str(v, "title"), TITLE_RANGE.max),
      url: str(v, "url"),
      description: truncateForSerp(str(v, "description"), DESCRIPTION_RANGE.max),
    }),
  },
  {
    kind: "spec",
    slug: "og-preview",
    name: "ดูตัวอย่างการแชร์ลิงก์ (Open Graph)",
    description:
      "ดูการ์ดลิงก์ที่จะขึ้นใน Facebook / LINE / Discord จากค่าที่กรอก (ไม่ดึงหน้าเว็บจริง)",
    category: "seo",
    icon: Share2,
    keywords: ["open graph", "og preview", "facebook", "line", "share"],
    live: true,
    fields: [
      text("title", "og:title", { defaultValue: "CS Toolboxes" }),
      textarea("description", "og:description", {
        rows: 2,
        mono: false,
        defaultValue: "เครื่องมือออนไลน์ฟรี 100+ ชิ้น",
      }),
      text("site", "โดเมน", { defaultValue: "example.com", mono: true }),
      checkbox("image", "แสดงพื้นที่รูป og:image", true),
    ],
    run: (v) => ({
      kind: "card",
      title: str(v, "title"),
      description: str(v, "description"),
      site: str(v, "site"),
      image: bool(v, "image") ? "1200 × 630" : null,
    }),
  },
  {
    kind: "spec",
    slug: "robots-txt-generator",
    name: "สร้าง robots.txt",
    description: "กำหนดว่าบอทค้นหาเข้าหน้าไหนได้หรือไม่ได้ พร้อมลิงก์ sitemap",
    category: "seo",
    icon: Bot,
    keywords: ["robots.txt", "crawler", "disallow", "seo"],
    live: true,
    fields: [
      text("userAgent", "User-agent", { defaultValue: "*", mono: true }),
      textarea("disallow", "ห้ามเข้า (บรรทัดละ path)", { rows: 4, defaultValue: "/admin\n/api" }),
      textarea("allow", "อนุญาต (บรรทัดละ path)", { rows: 2 }),
      text("sitemap", "URL ของ sitemap", { mono: true, placeholder: "https://…/sitemap.xml" }),
      number("crawlDelay", "Crawl-delay (วินาที, 0 = ไม่ระบุ)", 0, { min: 0, max: 60 }),
    ],
    run: (v) =>
      out.text(
        robotsTxt({
          userAgent: str(v, "userAgent"),
          disallow: str(v, "disallow"),
          allow: str(v, "allow"),
          sitemap: httpUrl(str(v, "sitemap"), "URL sitemap"),
          crawlDelay: num(v, "crawlDelay", "Crawl-delay"),
        }),
        true,
        { filename: "robots.txt", mime: "text/plain" },
      ),
  },
  {
    kind: "spec",
    slug: "sitemap-generator",
    name: "สร้าง sitemap.xml",
    description: "สร้าง sitemap จากรายการ URL (ไม่ไล่ดึงหน้าเว็บให้ — กรอก URL เอง)",
    category: "seo",
    icon: FileCode,
    keywords: ["sitemap", "xml", "seo", "google search console"],
    action: "สร้าง",
    fields: [
      textarea("urls", "URL (บรรทัดละ 1)", {
        rows: 8,
        placeholder: "https://example.com/\nhttps://example.com/about",
      }),
      select("changefreq", "ความถี่ในการเปลี่ยน", [
        "weekly",
        "daily",
        "monthly",
        "yearly",
        "always",
        "hourly",
        "never",
      ]),
      select("priority", "priority", ["0.8", "1.0", "0.5", "0.3"]),
    ],
    run: (v) =>
      out.text(sitemapXml(str(v, "urls"), str(v, "changefreq"), str(v, "priority")), true, {
        filename: "sitemap.xml",
        mime: "application/xml",
      }),
  },
  {
    kind: "spec",
    slug: "utm-builder",
    name: "สร้างลิงก์ติดตาม UTM",
    description: "เติม utm_source, utm_medium, utm_campaign ให้ลิงก์ประชาสัมพันธ์",
    category: "seo",
    icon: Megaphone,
    keywords: ["utm", "campaign", "tracking", "google analytics"],
    live: true,
    fields: [
      text("url", "URL ปลายทาง", { mono: true, defaultValue: "https://example.com/" }),
      text("source", "utm_source *", { defaultValue: "facebook", mono: true }),
      text("medium", "utm_medium *", { defaultValue: "social", mono: true }),
      text("campaign", "utm_campaign *", { defaultValue: "open-house-2026", mono: true }),
      text("term", "utm_term", { mono: true }),
      text("content", "utm_content", { mono: true }),
    ],
    run: (v) =>
      out.text(
        utmUrl({
          url: str(v, "url"),
          source: str(v, "source"),
          medium: str(v, "medium"),
          campaign: str(v, "campaign"),
          term: str(v, "term"),
          content: str(v, "content"),
        }),
      ),
  },
  {
    kind: "spec",
    slug: "keyword-density",
    name: "วิเคราะห์ความถี่คำ (Keyword density)",
    description: "นับคำที่ใช้บ่อยในบทความ (ตัดคำภาษาไทยได้) เพื่อตรวจการใช้คีย์เวิร์ด",
    category: "seo",
    icon: Eye,
    keywords: ["keyword density", "word frequency", "seo", "ความถี่คำ"],
    live: true,
    fields: [
      textarea("input", "บทความ", { rows: 10, mono: false }),
      number("top", "แสดงกี่คำ", 20, { min: 5, max: 100 }),
    ],
    run: (v) => {
      const r = keywordDensity(str(v, "input"), num(v, "top", "จำนวนคำ"));

      return out.table(
        ["คำ", "จำนวน", "ความหนาแน่น"],
        r.rows.map((x) => [x.word, x.count, `${x.density.toFixed(2)}%`]),
        `ทั้งหมด ${r.total.toLocaleString("th-TH")} คำ`,
      );
    },
  },
  {
    kind: "spec",
    slug: "hreflang-generator",
    name: "สร้างแท็ก hreflang",
    description: "บอก Google ว่าหน้านี้มีภาษาอื่นที่ URL ไหน",
    category: "seo",
    icon: Languages,
    keywords: ["hreflang", "multilingual", "international seo"],
    live: true,
    fields: [
      textarea("input", "รหัสภาษา URL (บรรทัดละ 1)", {
        rows: 5,
        defaultValue:
          "th https://example.com/th\nen https://example.com/en\nx-default https://example.com/",
      }),
    ],
    run: (v) => out.text(hreflangTags(str(v, "input"))),
  },
];

export const referenceTools: SpecTool[] = [
  {
    kind: "spec",
    slug: "http-status-codes",
    name: "รหัสสถานะ HTTP",
    description: "ความหมายของ 1xx–5xx ภาษาไทย ค้นด้วยเลขหรือคำได้",
    category: "reference",
    icon: Globe,
    keywords: ["http status", "404", "500", "status code"],
    live: true,
    fields: [text("q", "ค้นหา", { placeholder: "404 หรือ redirect" })],
    run: (v) => {
      const q = str(v, "q").trim().toLowerCase();
      const list = HTTP_STATUS.filter(
        ([code, name, th]) =>
          !q || String(code).startsWith(q) || name.toLowerCase().includes(q) || th.includes(q),
      );

      return out.table(
        ["รหัส", "ชื่อ", "ความหมาย"],
        list.map(([c, n, t]) => [c, n, t]),
        list.length ? undefined : "ไม่พบ",
      );
    },
  },
  {
    kind: "spec",
    slug: "mime-types",
    name: "ค้นหา MIME type",
    description: "นามสกุลไฟล์ ↔ Content-Type ที่ใช้ตั้งค่าเว็บเซิร์ฟเวอร์และการอัปโหลด",
    category: "reference",
    icon: TableProperties,
    keywords: ["mime", "content-type", "file extension", "media type"],
    live: true,
    fields: [text("q", "นามสกุลหรือ MIME", { placeholder: "pdf หรือ image/" })],
    run: (v) => {
      const q = str(v, "q").trim().toLowerCase().replace(/^\./u, "");
      const list = MIME_TYPES.filter(([ext, mime]) => !q || ext.includes(q) || mime.includes(q));

      return out.table(
        ["นามสกุล", "MIME type"],
        list.map(([e, m]) => [`.${e}`, m]),
        list.length ? undefined : "ไม่พบ",
      );
    },
  },
  {
    kind: "spec",
    slug: "user-agent-parser",
    name: "อ่าน User-Agent",
    description:
      "แยกเบราว์เซอร์ ระบบปฏิบัติการ และชนิดอุปกรณ์จาก User-Agent (ของเครื่องคุณหรือที่วาง)",
    category: "reference",
    icon: MonitorSmartphone,
    keywords: ["user agent", "ua", "browser", "device"],
    live: true,
    fields: [textarea("input", "User-Agent (เว้นว่าง = ของเบราว์เซอร์นี้)", { rows: 3 })],
    run: (v) => {
      const ua =
        str(v, "input").trim() || (typeof navigator === "undefined" ? "" : navigator.userAgent);
      const r = parseUserAgent(ua);

      return out.rows(
        [
          row("User-Agent", ua, true),
          row("เบราว์เซอร์", r.browser),
          row("ระบบปฏิบัติการ", r.os),
          row("อุปกรณ์", r.device),
          row("Engine", r.engine),
          row("เป็นบอท", r.bot ? "น่าจะใช่" : "ไม่ใช่"),
        ],
        "User-Agent ปลอมได้ ใช้ประกอบการตัดสินใจเท่านั้น",
      );
    },
  },
  {
    kind: "spec",
    slug: "ascii-table",
    name: "ตาราง ASCII / Unicode",
    description: "ดูรหัสฐาน 10 16 2 และ escape ของอักขระ หรือของข้อความที่พิมพ์",
    category: "reference",
    icon: Code2,
    keywords: ["ascii", "unicode", "char code", "code point"],
    live: true,
    fields: [text("input", "ข้อความ (เว้นว่าง = ตาราง ASCII 32–126)", { mono: true })],
    run: (v) => {
      const input = str(v, "input");
      const chars = input
        ? [...input].slice(0, 500)
        : Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i));

      return out.table(
        ["อักขระ", "ฐาน 10", "ฐาน 16", "ฐาน 2", "JS / HTML"],
        chars.map((c) => {
          const cp = c.codePointAt(0) ?? 0;

          return [
            c === " " ? "(ช่องว่าง)" : c,
            cp,
            `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`,
            cp.toString(2),
            `\\u{${cp.toString(16)}} · &#${cp};`,
          ];
        }),
      );
    },
  },
];
