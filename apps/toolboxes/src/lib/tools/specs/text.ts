import {
  ArrowDownAZ,
  AtSign,
  CaseSensitive,
  Eraser,
  FileDiff,
  Link,
  ListOrdered,
  ListX,
  Replace,
  Shuffle,
  SpellCheck,
  Type,
  Undo2,
} from "lucide-react";
import { checkbox, limit, out, row, select, text, textarea } from "../fields";
import { randomInt } from "../impl/security";
import {
  cleanWhitespace,
  compareTexts,
  convertCase,
  extractEmails,
  extractUrls,
  removeDuplicateLines,
  reverseText,
  slugify,
  sortLines,
  textStats,
  type CaseStyle,
  type SortMode,
} from "../impl/text";
import { bool, str, type SpecTool } from "../types";

/// ค่าสุ่ม [0,1) จาก crypto — ให้ shuffle ใช้แทน Math.random
const cryptoRandom = () => randomInt(2 ** 32) / 2 ** 32;

export const textTools: SpecTool[] = [
  {
    kind: "spec",
    slug: "word-counter",
    name: "นับคำและตัวอักษร",
    description: "นับตัวอักษร คำ (ตัดคำภาษาไทยได้) ประโยค บรรทัด และเวลาอ่านโดยประมาณ",
    category: "text",
    icon: SpellCheck,
    keywords: ["word count", "character count", "นับคำ", "นับตัวอักษร"],
    live: true,
    fields: [
      textarea("input", "ข้อความ", {
        rows: 12,
        mono: false,
        placeholder: "วางหรือพิมพ์ข้อความที่นี่…",
      }),
    ],
    run: (v) => {
      const s = textStats(limit(str(v, "input")));

      return out.rows([
        row("ตัวอักษร", s.characters.toLocaleString("th-TH")),
        row("ตัวอักษร (ไม่นับช่องว่าง)", s.charactersNoSpaces.toLocaleString("th-TH")),
        row("คำ", s.words.toLocaleString("th-TH")),
        row("ประโยค", s.sentences),
        row("ย่อหน้า", s.paragraphs),
        row("บรรทัด", s.lines),
        row("เวลาอ่านโดยประมาณ", `${s.readingMinutes} นาที`),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "text-case-converter",
    name: "แปลงรูปแบบตัวพิมพ์",
    description: "UPPER, lower, Title, camelCase, snake_case, kebab-case และอื่น ๆ",
    category: "text",
    icon: CaseSensitive,
    keywords: ["case", "uppercase", "lowercase", "camelcase", "snake_case", "kebab"],
    live: true,
    fields: [
      textarea("input", "ข้อความ", { rows: 6, mono: false, placeholder: "hello world example" }),
      select("style", "รูปแบบ", [
        ["upper", "UPPERCASE"],
        ["lower", "lowercase"],
        ["title", "Title Case"],
        ["sentence", "Sentence case"],
        ["camel", "camelCase"],
        ["pascal", "PascalCase"],
        ["snake", "snake_case"],
        ["kebab", "kebab-case"],
        ["constant", "CONSTANT_CASE"],
        ["dot", "dot.case"],
      ]),
    ],
    run: (v) => out.text(convertCase(limit(str(v, "input")), str(v, "style") as CaseStyle)),
  },
  {
    kind: "spec",
    slug: "remove-duplicate-lines",
    name: "ลบบรรทัดซ้ำ",
    description: "เก็บบรรทัดแรกที่เจอ ตัดบรรทัดที่ซ้ำออก บอกจำนวนที่ลบ",
    category: "text",
    icon: ListX,
    keywords: ["duplicate", "unique", "dedupe", "ซ้ำ"],
    live: true,
    fields: [
      textarea("input", "ข้อความ (หนึ่งรายการต่อบรรทัด)"),
      checkbox("caseSensitive", "แยกตัวพิมพ์เล็ก/ใหญ่", true),
      checkbox("trim", "ตัดช่องว่างหัวท้ายก่อนเทียบ", true),
      checkbox("keepEmpty", "เก็บบรรทัดว่าง"),
    ],
    run: (v) => {
      const r = removeDuplicateLines(limit(str(v, "input")), {
        caseSensitive: bool(v, "caseSensitive"),
        trim: bool(v, "trim"),
        keepEmpty: bool(v, "keepEmpty"),
      });

      return out.text(
        r.text,
        true,
        { filename: "unique.txt", mime: "text/plain" },
        `ลบบรรทัดซ้ำ ${r.removed.toLocaleString("th-TH")} บรรทัด`,
      );
    },
  },
  {
    kind: "spec",
    slug: "sort-lines",
    name: "เรียงบรรทัด",
    description: "เรียงตามตัวอักษร ตามความยาว แบบธรรมชาติ (2 ก่อน 10) กลับลำดับ หรือสลับสุ่ม",
    category: "text",
    icon: ArrowDownAZ,
    keywords: ["sort", "order", "เรียง"],
    live: true,
    fields: [
      textarea("input", "ข้อความ (หนึ่งรายการต่อบรรทัด)"),
      select("mode", "วิธีเรียง", [
        ["asc", "ก → ฮ / A → Z"],
        ["desc", "ฮ → ก / Z → A"],
        ["natural", "ธรรมชาติ (เลข 2 ก่อน 10)"],
        ["length", "สั้น → ยาว"],
        ["length-desc", "ยาว → สั้น"],
        ["reverse", "กลับลำดับเดิม"],
        ["shuffle", "สลับสุ่ม"],
      ]),
    ],
    run: (v) =>
      out.text(sortLines(limit(str(v, "input")), str(v, "mode") as SortMode, cryptoRandom)),
  },
  {
    kind: "spec",
    slug: "reverse-text",
    name: "กลับข้อความ",
    description: "กลับลำดับตัวอักษร (ไม่ทำให้สระไทยแตก) คำ หรือบรรทัด",
    category: "text",
    icon: Undo2,
    keywords: ["reverse", "backwards", "กลับ"],
    live: true,
    fields: [
      textarea("input", "ข้อความ", { rows: 5, mono: false }),
      select("mode", "กลับ", [
        ["characters", "ตัวอักษร"],
        ["words", "คำ"],
        ["lines", "บรรทัด"],
      ]),
    ],
    run: (v) =>
      out.text(
        reverseText(limit(str(v, "input")), str(v, "mode") as "characters" | "words" | "lines"),
        false,
      ),
  },
  {
    kind: "spec",
    slug: "whitespace-cleaner",
    name: "ล้างช่องว่างเกิน",
    description: "ตัดช่องว่างหัวท้าย ยุบช่องว่างซ้อน ลบบรรทัดว่าง และเปลี่ยน Tab เป็นช่องว่าง",
    category: "text",
    icon: Eraser,
    keywords: ["whitespace", "trim", "clean", "space"],
    live: true,
    fields: [
      textarea("input", "ข้อความ"),
      checkbox("trimLines", "ตัดช่องว่างหัวท้ายทุกบรรทัด", true),
      checkbox("collapseSpaces", "ยุบช่องว่างซ้อนเหลือช่องเดียว", true),
      checkbox("removeEmptyLines", "ลบบรรทัดว่าง", true),
      checkbox("tabsToSpaces", "เปลี่ยน Tab เป็นช่องว่าง"),
    ],
    run: (v) =>
      out.text(
        cleanWhitespace(limit(str(v, "input")), {
          trimLines: bool(v, "trimLines"),
          collapseSpaces: bool(v, "collapseSpaces"),
          removeEmptyLines: bool(v, "removeEmptyLines"),
          tabsToSpaces: bool(v, "tabsToSpaces"),
        }),
      ),
  },
  {
    kind: "spec",
    slug: "extract-emails",
    name: "ดึงอีเมลจากข้อความ",
    description: "หาอีเมลทั้งหมดในข้อความ ตัดตัวซ้ำ หนึ่งรายการต่อบรรทัด",
    category: "text",
    icon: AtSign,
    keywords: ["email", "extract", "อีเมล"],
    live: true,
    fields: [textarea("input", "ข้อความ", { mono: false })],
    run: (v) => {
      const list = extractEmails(limit(str(v, "input")));

      return out.text(
        list.length ? `${list.join("\n")}\n\n— พบ ${list.length} อีเมล` : "ไม่พบอีเมล",
      );
    },
  },
  {
    kind: "spec",
    slug: "extract-urls",
    name: "ดึงลิงก์จากข้อความ",
    description: "หา URL http/https ทั้งหมดในข้อความ ตัดตัวซ้ำ",
    category: "text",
    icon: Link,
    keywords: ["url", "link", "extract", "ลิงก์"],
    live: true,
    fields: [textarea("input", "ข้อความ", { mono: false })],
    run: (v) => {
      const list = extractUrls(limit(str(v, "input")));

      return out.text(
        list.length ? `${list.join("\n")}\n\n— พบ ${list.length} ลิงก์` : "ไม่พบลิงก์",
      );
    },
  },
  {
    kind: "spec",
    slug: "slug-generator",
    name: "สร้าง Slug สำหรับ URL",
    description: 'แปลงหัวข้อเป็น slug เช่น "Hello World!" → hello-world (เก็บอักษรไทยได้)',
    category: "text",
    icon: Type,
    keywords: ["slug", "url", "permalink", "seo"],
    live: true,
    fields: [
      text("input", "หัวข้อ", { placeholder: "วิธีเขียน Next.js 16 ให้เร็ว!" }),
      select("separator", "ตัวคั่น", [
        ["-", "- (ขีด)"],
        ["_", "_ (ขีดล่าง)"],
        [".", ". (จุด)"],
      ]),
      checkbox("keepThai", "เก็บอักษรไทย", true),
      checkbox("lowercase", "ตัวพิมพ์เล็ก", true),
    ],
    run: (v) =>
      out.text(
        slugify(str(v, "input"), {
          separator: str(v, "separator"),
          keepThai: bool(v, "keepThai"),
          lowercase: bool(v, "lowercase"),
        }),
      ),
  },
  {
    kind: "spec",
    slug: "text-diff",
    name: "เปรียบเทียบข้อความ",
    description: "ดูบรรทัดที่เพิ่ม ลบ และเหมือนกันระหว่างข้อความสองชุด",
    category: "text",
    icon: FileDiff,
    keywords: ["diff", "compare", "เปรียบเทียบ"],
    action: "เปรียบเทียบ",
    fields: [textarea("left", "ข้อความเดิม"), textarea("right", "ข้อความใหม่")],
    run: (v) => {
      const lines = compareTexts(limit(str(v, "left"), 500_000), limit(str(v, "right"), 500_000));
      const add = lines.filter((l) => l.type === "add").length;
      const del = lines.filter((l) => l.type === "del").length;

      return {
        kind: "diff",
        lines,
        summary:
          add || del ? `เพิ่ม ${add} บรรทัด · ลบ ${del} บรรทัด` : "ข้อความเหมือนกันทุกบรรทัด",
      };
    },
  },
  {
    kind: "spec",
    slug: "find-replace",
    name: "ค้นหาและแทนที่",
    description: "แทนที่ข้อความทั้งหมด รองรับ Regular Expression และ $1 ในข้อความแทน",
    category: "text",
    icon: Replace,
    keywords: ["find", "replace", "แทนที่", "regex"],
    live: true,
    fields: [
      textarea("input", "ข้อความ"),
      text("find", "ค้นหา", { mono: true }),
      text("replace", "แทนที่ด้วย", { mono: true }),
      checkbox("regex", "ใช้ Regular Expression"),
      checkbox("ignoreCase", "ไม่สนตัวพิมพ์เล็ก/ใหญ่"),
    ],
    run: (v) => {
      const input = limit(str(v, "input"));
      const find = str(v, "find");

      if (!find) return out.text(input);

      let re: RegExp;

      try {
        re = new RegExp(
          bool(v, "regex") ? find : find.replace(/[.*+?^${}()|[\]\\/]/gu, "\\$&"),
          `g${bool(v, "ignoreCase") ? "i" : ""}u`,
        );
      } catch (error) {
        throw new Error(
          `Regular expression ไม่ถูกต้อง: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }

      const count = (input.match(re) ?? []).length;
      const replacement = bool(v, "regex")
        ? str(v, "replace")
        : str(v, "replace").replace(/\$/gu, "$$$$");

      return out.text(
        input.replace(re, replacement),
        true,
        { filename: "replaced.txt", mime: "text/plain" },
        `แทนที่ ${count.toLocaleString("th-TH")} จุด`,
      );
    },
  },
  {
    kind: "spec",
    slug: "line-numbers",
    name: "ใส่เลขบรรทัด",
    description: "เติมเลขลำดับหน้าทุกบรรทัด เลือกเลขเริ่มต้นและตัวคั่นได้",
    category: "text",
    icon: ListOrdered,
    keywords: ["line number", "numbering", "เลขบรรทัด"],
    live: true,
    fields: [
      textarea("input", "ข้อความ"),
      text("start", "เริ่มที่", { defaultValue: "1", mono: true }),
      select("separator", "ตัวคั่น", [
        [". ", "1. ข้อความ"],
        [") ", "1) ข้อความ"],
        ["\t", "1⇥ข้อความ (Tab)"],
        [": ", "1: ข้อความ"],
      ]),
      checkbox("skipEmpty", "ข้ามบรรทัดว่าง", true),
    ],
    run: (v) => {
      const start = Number(str(v, "start"));

      if (!Number.isInteger(start)) throw new Error("เลขเริ่มต้นต้องเป็นจำนวนเต็ม");

      const lines = limit(str(v, "input")).split(/\r?\n/u);
      const width = String(start + lines.length).length;
      let n = start;

      return out.text(
        lines
          .map((l) =>
            bool(v, "skipEmpty") && !l.trim()
              ? l
              : `${String(n++).padStart(width, " ")}${str(v, "separator")}${l}`,
          )
          .join("\n"),
      );
    },
  },
  {
    kind: "spec",
    slug: "random-picker",
    name: "สุ่มเลือกรายชื่อ / จับฉลาก",
    description: "สุ่มเลือกจากรายการที่กรอก หรือแบ่งกลุ่มแบบสุ่ม (สุ่มด้วย crypto ยุติธรรม)",
    category: "generator",
    icon: Shuffle,
    keywords: ["random", "picker", "draw", "สุ่ม", "จับฉลาก", "แบ่งกลุ่ม"],
    random: true,
    action: "สุ่ม",
    fields: [
      textarea("input", "รายการ (หนึ่งรายการต่อบรรทัด)", {
        mono: false,
        placeholder: "มะลิ\nธนา\nปิยะ\nกานดา",
      }),
      select("mode", "แบบ", [
        ["pick", "สุ่มเลือก"],
        ["groups", "แบ่งกลุ่ม"],
      ]),
      text("count", "จำนวน (คนที่เลือก หรือจำนวนกลุ่ม)", { defaultValue: "1", mono: true }),
    ],
    run: (v) => {
      const items = limit(str(v, "input"))
        .split(/\r?\n/u)
        .map((s) => s.trim())
        .filter(Boolean);
      const count = Number(str(v, "count"));

      if (items.length < 2) throw new Error("กรอกอย่างน้อย 2 รายการ");
      if (!Number.isInteger(count) || count < 1) throw new Error("จำนวนต้องเป็นจำนวนเต็มบวก");

      const shuffled = [...items];

      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);

        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      if (str(v, "mode") === "pick") {
        if (count > items.length) throw new Error(`มีแค่ ${items.length} รายการ`);

        return out.text(shuffled.slice(0, count).join("\n"), false);
      }

      if (count > items.length) throw new Error("จำนวนกลุ่มมากกว่าจำนวนรายการ");

      const groups: string[][] = Array.from({ length: count }, () => []);

      shuffled.forEach((item, i) => groups[i % count].push(item));

      return out.text(
        groups
          .map((g, i) => `กลุ่ม ${i + 1} (${g.length})\n${g.map((x) => `  • ${x}`).join("\n")}`)
          .join("\n\n"),
        false,
      );
    },
  },
];
