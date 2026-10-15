import {
  Banknote,
  Binary,
  Database,
  FileSpreadsheet,
  Gauge,
  Landmark,
  Palette,
  Ruler,
  Scale,
  Sheet,
  SquareDashed,
  Thermometer,
  Wine,
} from "lucide-react";
import { checkbox, limit, number, out, row, select, text, textarea } from "../fields";
import {
  bahtText,
  contrastRatio,
  convertDataSize,
  convertUnit,
  csvToJson,
  csvToMarkdown,
  DATA_UNIT_KEYS,
  fromRoman,
  jsonToCsv,
  markdownTableToCsv,
  parseColor,
  parseCsv,
  rgbToHsl,
  toHex,
  toRoman,
  UNIT_GROUPS,
} from "../impl/convert";
import { bool, num, str, type SpecTool } from "../types";

const fmt = (n: number) =>
  Math.abs(n) >= 1e15 || (Math.abs(n) < 1e-6 && n !== 0)
    ? n.toExponential(6)
    : new Intl.NumberFormat("th-TH", { maximumFractionDigits: 8 }).format(n);

const DELIMITERS: [string, string][] = [
  [",", "จุลภาค ,"],
  [";", "อัฒภาค ;"],
  ["\t", "Tab"],
  ["|", "ขีดตั้ง |"],
];

/// เครื่องมือแปลงหน่วยหนึ่งกลุ่ม = หนึ่งหน้า (แบบ 100tools)
function unitTool(
  group: string,
  slug: string,
  name: string,
  icon: SpecTool["icon"],
  keywords: string[],
): SpecTool {
  const units = Object.entries(UNIT_GROUPS[group].units).map(
    ([k, u]) => [k, u.label] as [string, string],
  );

  return {
    kind: "spec",
    slug,
    name,
    description: `แปลงหน่วย${UNIT_GROUPS[group].label} ${units.map(([, l]) => l).join(" ")} — แสดงทุกหน่วยพร้อมกัน`,
    category: "converter",
    icon,
    keywords,
    live: true,
    fields: [number("value", "ค่า", 1), select("from", "จากหน่วย", units)],
    run: (v) => {
      const value = num(v, "value", "ค่า");

      return out.table(
        ["หน่วย", "ค่า"],
        units.map(([k, label]) => [
          `${label} (${k})`,
          fmt(convertUnit(group, value, str(v, "from"), k)),
        ]),
      );
    },
  };
}

export const converterTools: SpecTool[] = [
  {
    kind: "spec",
    slug: "color-converter",
    name: "แปลงค่าสี",
    description: "แปลง HEX ↔ RGB ↔ HSL รองรับความโปร่งใส พร้อมตัวอย่างสี",
    category: "converter",
    icon: Palette,
    keywords: ["color", "hex", "rgb", "hsl", "สี"],
    live: true,
    fields: [
      text("input", "ค่าสี", {
        defaultValue: "rgb(33 84 217)",
        mono: true,
        help: "HEX 3/4/6/8 หลัก · rgb() · hsl()",
      }),
    ],
    run: (v) => {
      const c = parseColor(str(v, "input"));
      const hsl = rgbToHsl(c);
      const hex = toHex(c);

      return {
        kind: "swatches",
        items: [{ label: hex, color: hex }],
        rows: [
          row("HEX", hex, true),
          row(
            "RGB",
            c.a < 1 ? `rgb(${c.r} ${c.g} ${c.b} / ${c.a})` : `rgb(${c.r}, ${c.g}, ${c.b})`,
            true,
          ),
          row("HSL", `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, true),
          row(
            "ความสว่าง (WCAG)",
            contrastRatio(c, { r: 255, g: 255, b: 255, a: 1 }) >
              contrastRatio(c, { r: 0, g: 0, b: 0, a: 1 })
              ? "สีเข้ม — ใช้ตัวอักษรขาว"
              : "สีอ่อน — ใช้ตัวอักษรดำ",
          ),
        ],
      };
    },
  },
  {
    kind: "spec",
    slug: "contrast-checker",
    name: "ตรวจความต่างสี WCAG",
    description: "คำนวณ contrast ratio ของสีตัวอักษรกับพื้นหลัง บอกว่าผ่าน AA / AAA หรือไม่",
    category: "converter",
    icon: SquareDashed,
    keywords: ["contrast", "wcag", "accessibility", "a11y", "สี"],
    live: true,
    fields: [
      text("fg", "สีตัวอักษร", { defaultValue: "rgb(25 28 29)", mono: true }),
      text("bg", "สีพื้นหลัง", { defaultValue: "rgb(255 255 255)", mono: true }),
    ],
    run: (v) => {
      const fg = parseColor(str(v, "fg"));
      const bg = parseColor(str(v, "bg"));
      const ratio = contrastRatio(fg, bg);
      const pass = (min: number) => (ratio >= min ? "ผ่าน" : "ไม่ผ่าน");

      return {
        kind: "swatches",
        items: [
          { label: `ตัวอักษร ${toHex(fg)}`, color: toHex(fg) },
          { label: `พื้นหลัง ${toHex(bg)}`, color: toHex(bg) },
        ],
        rows: [
          row("Contrast ratio", `${ratio.toFixed(2)} : 1`),
          row("AA ตัวอักษรปกติ (≥ 4.5)", pass(4.5)),
          row("AA ตัวอักษรใหญ่ (≥ 3)", pass(3)),
          row("AAA ตัวอักษรปกติ (≥ 7)", pass(7)),
          row("AAA ตัวอักษรใหญ่ (≥ 4.5)", pass(4.5)),
        ],
      };
    },
  },
  {
    kind: "spec",
    slug: "csv-json-converter",
    name: "แปลง CSV ↔ JSON",
    description:
      "แปลง CSV ที่มีแถวหัวตารางเป็น JSON array และกลับกัน (รองรับเครื่องหมายคำพูดและขึ้นบรรทัดในช่อง)",
    category: "converter",
    icon: FileSpreadsheet,
    keywords: ["csv", "json", "excel", "convert"],
    live: true,
    fields: [
      textarea("input", "ข้อมูล", { placeholder: "name,score\nมะลิ,90\nธนา,85" }),
      select("direction", "ทิศทาง", [
        ["csv-json", "CSV → JSON"],
        ["json-csv", "JSON → CSV"],
      ]),
      select("delimiter", "ตัวคั่น", DELIMITERS),
      checkbox("infer", "แปลงตัวเลข/true/false อัตโนมัติ", true),
    ],
    run: (v) => {
      const input = limit(str(v, "input"));

      if (!input.trim()) return out.text("");

      return str(v, "direction") === "csv-json"
        ? out.text(csvToJson(input, str(v, "delimiter"), bool(v, "infer")), true, {
            filename: "data.json",
            mime: "application/json",
          })
        : out.text(jsonToCsv(input, str(v, "delimiter")), true, {
            filename: "data.csv",
            mime: "text/csv",
          });
    },
  },
  {
    kind: "spec",
    slug: "csv-markdown",
    name: "แปลง CSV ↔ ตาราง Markdown",
    description: "ทำตาราง Markdown สำหรับ README จาก CSV หรือดึงตารางกลับเป็น CSV",
    category: "converter",
    icon: Sheet,
    keywords: ["csv", "markdown", "table", "readme"],
    live: true,
    fields: [
      textarea("input", "ข้อมูล"),
      select("direction", "ทิศทาง", [
        ["csv-md", "CSV → Markdown"],
        ["md-csv", "Markdown → CSV"],
      ]),
      select("delimiter", "ตัวคั่นของ CSV", DELIMITERS),
    ],
    run: (v) => {
      const input = limit(str(v, "input"));

      if (!input.trim()) return out.text("");

      return out.text(
        str(v, "direction") === "csv-md"
          ? csvToMarkdown(input, str(v, "delimiter"))
          : markdownTableToCsv(input),
      );
    },
  },
  {
    kind: "spec",
    slug: "csv-validator",
    name: "ตรวจโครงสร้าง CSV",
    description: "ตรวจหัวตารางว่างหรือซ้ำ และแถวที่จำนวนช่องไม่ตรงกับหัวตาราง",
    category: "document",
    icon: FileSpreadsheet,
    keywords: ["csv", "validate", "lint"],
    action: "ตรวจสอบ",
    fields: [
      textarea("input", "ข้อมูล CSV", { rows: 10 }),
      select("delimiter", "ตัวคั่น", DELIMITERS),
    ],
    run: (v) => {
      const rows = parseCsv(limit(str(v, "input")), str(v, "delimiter"));

      if (!rows.length) throw new Error("ไม่มีข้อมูล");

      const [head, ...body] = rows;
      const problems: string[][] = [];
      const seen = new Map<string, number>();

      head.forEach((h, i) => {
        if (!h.trim()) problems.push(["หัวตาราง", `คอลัมน์ที่ ${i + 1} ไม่มีชื่อ`]);
        if (seen.has(h.trim()))
          problems.push(["หัวตาราง", `"${h}" ซ้ำกับคอลัมน์ที่ ${(seen.get(h.trim()) ?? 0) + 1}`]);
        seen.set(h.trim(), i);
      });
      body.forEach((r, i) => {
        if (r.length !== head.length && !(r.length === 1 && r[0] === ""))
          problems.push([`แถว ${i + 2}`, `มี ${r.length} ช่อง (หัวตารางมี ${head.length})`]);
      });

      return problems.length
        ? out.table(
            ["ตำแหน่ง", "ปัญหา"],
            problems.slice(0, 500),
            `พบ ${problems.length} ปัญหา จาก ${body.length} แถว`,
          )
        : out.rows([
            row("ผล", "โครงสร้างถูกต้อง"),
            row("คอลัมน์", head.length),
            row("แถวข้อมูล", body.length),
          ]);
    },
  },
  unitTool("length", "length-converter", "แปลงหน่วยความยาว", Ruler, [
    "length",
    "meter",
    "inch",
    "feet",
    "วา",
    "ศอก",
  ]),
  unitTool("mass", "weight-converter", "แปลงหน่วยน้ำหนัก", Scale, [
    "weight",
    "mass",
    "kg",
    "pound",
    "บาท ทอง",
  ]),
  unitTool("area", "area-converter", "แปลงหน่วยพื้นที่ (ไร่ งาน ตารางวา)", Landmark, [
    "area",
    "ไร่",
    "งาน",
    "ตารางวา",
    "sqm",
    "acre",
  ]),
  unitTool("volume", "volume-converter", "แปลงหน่วยปริมาตร", Wine, [
    "volume",
    "liter",
    "ml",
    "cup",
    "ช้อน",
  ]),
  unitTool("speed", "speed-converter", "แปลงหน่วยความเร็ว", Gauge, [
    "speed",
    "km/h",
    "mph",
    "knot",
  ]),
  {
    kind: "spec",
    slug: "temperature-converter",
    name: "แปลงอุณหภูมิ",
    description: "องศาเซลเซียส ฟาเรนไฮต์ และเคลวิน",
    category: "converter",
    icon: Thermometer,
    keywords: ["temperature", "celsius", "fahrenheit", "kelvin", "อุณหภูมิ"],
    live: true,
    fields: [
      number("value", "ค่า", 37),
      select("from", "จาก", [
        ["c", "เซลเซียส (°C)"],
        ["f", "ฟาเรนไฮต์ (°F)"],
        ["k", "เคลวิน (K)"],
      ]),
    ],
    run: (v) => {
      const value = num(v, "value", "ค่า");
      const from = str(v, "from");

      return out.rows([
        row("°C", fmt(convertUnit("temperature", value, from, "c"))),
        row("°F", fmt(convertUnit("temperature", value, from, "f"))),
        row("K", fmt(convertUnit("temperature", value, from, "k"))),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "data-size-converter",
    name: "แปลงขนาดข้อมูล",
    description: "แปลง bit, Byte, KB/MB/GB (ฐาน 10) และ KiB/MiB/GiB (ฐาน 2)",
    category: "converter",
    icon: Database,
    keywords: ["byte", "kb", "mb", "gb", "mib", "data size"],
    live: true,
    fields: [number("value", "ค่า", 1), select("from", "จากหน่วย", DATA_UNIT_KEYS, "GB")],
    run: (v) =>
      out.table(
        ["หน่วย", "ค่า"],
        DATA_UNIT_KEYS.map((k) => [
          k,
          fmt(convertDataSize(num(v, "value", "ค่า"), str(v, "from"), k)),
        ]),
      ),
  },
  {
    kind: "spec",
    slug: "roman-numeral",
    name: "แปลงเลขโรมัน",
    description: "แปลงเลข 1–3999 เป็นเลขโรมัน และอ่านเลขโรมันกลับเป็นตัวเลข",
    category: "converter",
    icon: Binary,
    keywords: ["roman", "numeral", "โรมัน"],
    live: true,
    fields: [text("input", "ตัวเลข หรือ เลขโรมัน", { defaultValue: "2026", mono: true })],
    run: (v) => {
      const input = str(v, "input").trim();

      if (!input) return out.rows([]);

      return /^\d+$/u.test(input)
        ? out.rows([row("เลขโรมัน", toRoman(Number(input)), true)])
        : out.rows([row("ตัวเลข", fromRoman(input))]);
    },
  },
  {
    kind: "spec",
    slug: "baht-text",
    name: "อ่านจำนวนเงินเป็นตัวอักษร",
    description:
      "แปลงตัวเลขเป็นคำอ่านภาษาไทย เช่น 1,250.75 → หนึ่งพันสองร้อยห้าสิบบาทเจ็ดสิบห้าสตางค์",
    category: "converter",
    icon: Banknote,
    keywords: ["baht text", "bahttext", "จำนวนเงิน", "ตัวอักษร", "ใบเสร็จ"],
    live: true,
    fields: [text("input", "จำนวนเงิน", { defaultValue: "1250.75", mono: true })],
    run: (v) =>
      str(v, "input").trim() ? out.text(bahtText(str(v, "input")), false) : out.text(""),
  },
  {
    kind: "spec",
    slug: "text-binary",
    name: "แปลงข้อความ ↔ Binary / Hex",
    description: "ดูข้อความเป็นไบต์ UTF-8 แบบเลขฐาน 2 ฐาน 16 หรือฐาน 10 และแปลงกลับ",
    category: "converter",
    icon: Binary,
    keywords: ["binary", "hex", "ascii", "utf-8", "bytes"],
    live: true,
    fields: [
      textarea("input", "ข้อมูล", { rows: 5 }),
      select("mode", "การทำงาน", [
        ["to-bin", "ข้อความ → Binary"],
        ["to-hex", "ข้อความ → Hex"],
        ["to-dec", "ข้อความ → ไบต์ฐาน 10"],
        ["from", "Binary / Hex → ข้อความ"],
      ]),
    ],
    run: (v) => {
      const input = limit(str(v, "input"), 200_000);
      const mode = str(v, "mode");

      if (!input) return out.text("");
      if (mode !== "from") {
        const bytes = [...new TextEncoder().encode(input)];
        const radix = mode === "to-bin" ? 2 : mode === "to-hex" ? 16 : 10;
        const pad = mode === "to-bin" ? 8 : mode === "to-hex" ? 2 : 0;

        return out.text(bytes.map((b) => b.toString(radix).padStart(pad, "0")).join(" "));
      }

      const tokens = input.trim().split(/[\s,]+/u);
      const isBin = tokens.every((t) => /^[01]{1,8}$/u.test(t));
      const isHex = tokens.every((t) => /^(0x)?[0-9a-f]{1,2}$/iu.test(t));

      if (!isBin && !isHex)
        throw new Error("ต้องเป็นเลขฐาน 2 (8 บิต) หรือฐาน 16 (2 หลัก) คั่นด้วยช่องว่าง");

      const bytes = Uint8Array.from(
        tokens.map((t) => parseInt(t.replace(/^0x/iu, ""), isBin ? 2 : 16)),
      );

      return out.text(new TextDecoder("utf-8", { fatal: false }).decode(bytes), false);
    },
  },
];
