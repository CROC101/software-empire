/// เครื่องมือแปลงค่า — ฟังก์ชันล้วน ทดสอบได้ใน convert.test.ts

// ───────────── สี ─────────────

export interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/// อ่านสีจาก HEX (3/4/6/8 หลัก) · rgb()/rgba() · hsl()/hsla()
export function parseColor(input: string): Rgb {
  const text = input.trim().toLowerCase();
  const hex = /^#?([0-9a-f]{3,8})$/u.exec(text);

  if (hex && [3, 4, 6, 8].includes(hex[1].length)) {
    const h = hex[1].length <= 4 ? [...hex[1]].map((c) => c + c).join("") : hex[1];

    return {
      r: Number.parseInt(h.slice(0, 2), 16),
      g: Number.parseInt(h.slice(2, 4), 16),
      b: Number.parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? Math.round((Number.parseInt(h.slice(6, 8), 16) / 255) * 100) / 100 : 1,
    };
  }

  const fn = /^(rgba?|hsla?)\(([^)]+)\)$/u.exec(text);

  if (fn) {
    const parts = fn[2].split(/[\s,/]+/u).filter(Boolean);
    const alpha =
      parts[3] !== undefined
        ? clamp(parts[3].endsWith("%") ? Number.parseFloat(parts[3]) / 100 : Number(parts[3]), 0, 1)
        : 1;

    if (fn[1].startsWith("rgb")) {
      const [r, g, b] = parts
        .slice(0, 3)
        .map((p) => (p.endsWith("%") ? Math.round(Number.parseFloat(p) * 2.55) : Number(p)));

      if ([r, g, b].every((v) => Number.isFinite(v) && v >= 0 && v <= 255))
        return { r, g, b, a: alpha };
    } else {
      const h = Number.parseFloat(parts[0]);
      const s = Number.parseFloat(parts[1]) / 100;
      const l = Number.parseFloat(parts[2]) / 100;

      if ([h, s, l].every(Number.isFinite)) return { ...hslToRgb(h, s, l), a: alpha };
    }
  }

  throw new Error(
    "อ่านค่าสีไม่ได้ — ใช้ HEX แบบ # ตามด้วยเลขฐาน 16 จำนวน 3–8 หลัก หรือ rgb(33 84 217) หรือ hsl(224 74% 49%)",
  );
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

export function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }) {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;

  if (d) h = max === rr ? ((gg - bb) / d) % 6 : max === gg ? (bb - rr) / d + 2 : (rr - gg) / d + 4;

  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  return { h: Math.round((h * 60 + 360) % 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function toHex({ r, g, b, a }: Rgb): string {
  const part = (v: number) => Math.round(v).toString(16).padStart(2, "0");

  return `#${part(r)}${part(g)}${part(b)}${a < 1 ? part(a * 255) : ""}`.toUpperCase();
}

/// ความสว่างสัมพัทธ์ตาม WCAG 2.x
export function luminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const lin = (c: number) => {
    const v = c / 255;

    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);

  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// ───────────── CSV ─────────────

export function parseCsv(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }

  if (quoted) throw new Error('พบเครื่องหมาย " ที่เปิดไว้แต่ไม่ปิด');

  row.push(cell);
  if (row.some((v) => v !== "")) rows.push(row);

  return rows;
}

function csvCell(value: unknown, delimiter: string): string {
  const s =
    value === null || value === undefined
      ? ""
      : typeof value === "string"
        ? value
        : typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : JSON.stringify(value);

  return s.includes(delimiter) || /["\r\n]/u.test(s) ? `"${s.replace(/"/gu, '""')}"` : s;
}

export function csvToJson(text: string, delimiter = ",", inferTypes = true): string {
  const rows = parseCsv(text, delimiter);

  if (!rows.length) return "[]";

  const headers = rows[0].map((h) => h.trim());

  if (headers.some((h) => !h)) throw new Error("มีหัวคอลัมน์ว่าง");
  if (new Set(headers).size !== headers.length) throw new Error("หัวคอลัมน์ต้องไม่ซ้ำกัน");

  const typed = (v: string): unknown => {
    if (!inferTypes) return v;
    if (/^-?\d+(\.\d+)?$/u.test(v) && !/^0\d/u.test(v)) return Number(v);
    if (v === "true" || v === "false") return v === "true";
    if (v === "") return null;

    return v;
  };

  return JSON.stringify(
    rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, typed(r[i] ?? "")]))),
    null,
    2,
  );
}

export function jsonToCsv(text: string, delimiter = ","): string {
  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("JSON ไม่ถูกต้อง");
  }

  if (!Array.isArray(data) || data.some((r) => !r || typeof r !== "object" || Array.isArray(r)))
    throw new Error('JSON ต้องเป็น array ของ object เช่น [{"name":"มะลิ"}]');

  const list = data as Record<string, unknown>[];
  const headers = [...new Set(list.flatMap((r) => Object.keys(r)))];

  return [
    headers.map((h) => csvCell(h, delimiter)).join(delimiter),
    ...list.map((r) => headers.map((h) => csvCell(r[h], delimiter)).join(delimiter)),
  ].join("\n");
}

export function csvToMarkdown(text: string, delimiter = ","): string {
  const rows = parseCsv(text, delimiter);

  if (!rows.length) throw new Error("กรุณาวาง CSV");

  const width = Math.max(...rows.map((r) => r.length));
  // escape backslashes before pipes, or a cell ending in "\" would swallow the next "|"
  const cell = (v: string) =>
    v.replace(/\\/gu, "\\\\").replace(/\|/gu, "\\|").replace(/\r?\n/gu, "<br>");
  const line = (r: string[]) =>
    `| ${Array.from({ length: width }, (_, i) => cell(r[i] ?? "")).join(" | ")} |`;

  return [
    line(rows[0]),
    `| ${Array.from({ length: width }, () => "---").join(" | ")} |`,
    ...rows.slice(1).map(line),
  ].join("\n");
}

export function markdownTableToCsv(text: string): string {
  const lines = text.split(/\r?\n/u).filter((l) => l.trim().startsWith("|"));

  if (lines.length < 2) throw new Error("ไม่พบตาราง Markdown (บรรทัดต้องขึ้นต้นด้วย |)");

  return lines
    .filter((l) => !/^\|\s*:?-{3,}/u.test(l.trim()))
    .map((l) =>
      l
        .trim()
        .replace(/^\||\|$/gu, "")
        .split(/(?<!\\)\|/u)
        .map((c) => csvCell(c.trim().replace(/\\\|/gu, "|"), ","))
        .join(","),
    )
    .join("\n");
}

// ───────────── หน่วย ─────────────

export const UNIT_GROUPS: Record<
  string,
  { label: string; units: Record<string, { label: string; factor: number }> }
> = {
  length: {
    label: "ความยาว",
    units: {
      mm: { label: "มิลลิเมตร", factor: 0.001 },
      cm: { label: "เซนติเมตร", factor: 0.01 },
      m: { label: "เมตร", factor: 1 },
      km: { label: "กิโลเมตร", factor: 1000 },
      in: { label: "นิ้ว", factor: 0.0254 },
      ft: { label: "ฟุต", factor: 0.3048 },
      yd: { label: "หลา", factor: 0.9144 },
      mi: { label: "ไมล์", factor: 1609.344 },
      wa: { label: "วา", factor: 2 },
      sok: { label: "ศอก", factor: 0.5 },
    },
  },
  mass: {
    label: "น้ำหนัก",
    units: {
      mg: { label: "มิลลิกรัม", factor: 0.000001 },
      g: { label: "กรัม", factor: 0.001 },
      kg: { label: "กิโลกรัม", factor: 1 },
      t: { label: "ตัน", factor: 1000 },
      oz: { label: "ออนซ์", factor: 0.028349523125 },
      lb: { label: "ปอนด์", factor: 0.45359237 },
      baht: { label: "บาท (ทองคำ)", factor: 0.0152 },
    },
  },
  area: {
    label: "พื้นที่",
    units: {
      m2: { label: "ตารางเมตร", factor: 1 },
      km2: { label: "ตารางกิโลเมตร", factor: 1_000_000 },
      ft2: { label: "ตารางฟุต", factor: 0.09290304 },
      acre: { label: "เอเคอร์", factor: 4046.8564224 },
      ha: { label: "เฮกตาร์", factor: 10_000 },
      wa2: { label: "ตารางวา", factor: 4 },
      ngan: { label: "งาน", factor: 400 },
      rai: { label: "ไร่", factor: 1600 },
    },
  },
  volume: {
    label: "ปริมาตร",
    units: {
      ml: { label: "มิลลิลิตร", factor: 0.001 },
      l: { label: "ลิตร", factor: 1 },
      m3: { label: "ลูกบาศก์เมตร", factor: 1000 },
      tsp: { label: "ช้อนชา", factor: 0.005 },
      tbsp: { label: "ช้อนโต๊ะ", factor: 0.015 },
      cup: { label: "ถ้วยตวง", factor: 0.24 },
      gal: { label: "แกลลอน (US)", factor: 3.785411784 },
    },
  },
  speed: {
    label: "ความเร็ว",
    units: {
      mps: { label: "เมตร/วินาที", factor: 1 },
      kmh: { label: "กิโลเมตร/ชั่วโมง", factor: 1 / 3.6 },
      mph: { label: "ไมล์/ชั่วโมง", factor: 0.44704 },
      knot: { label: "นอต", factor: 0.514444 },
    },
  },
};

export function convertUnit(group: string, value: number, from: string, to: string): number {
  if (group === "temperature") {
    const c = from === "c" ? value : from === "f" ? ((value - 32) * 5) / 9 : value - 273.15;

    if (c < -273.15) throw new Error("อุณหภูมิต่ำกว่าศูนย์สัมบูรณ์ไม่ได้");

    return to === "c" ? c : to === "f" ? (c * 9) / 5 + 32 : c + 273.15;
  }

  const g = UNIT_GROUPS[group];

  if (!g || !g.units[from] || !g.units[to]) throw new Error("ไม่รู้จักหน่วยนี้");

  return (value * g.units[from].factor) / g.units[to].factor;
}

const DATA_UNITS: Record<string, number> = {
  bit: 1 / 8,
  B: 1,
  KB: 1e3,
  MB: 1e6,
  GB: 1e9,
  TB: 1e12,
  KiB: 1024,
  MiB: 1024 ** 2,
  GiB: 1024 ** 3,
  TiB: 1024 ** 4,
};

export const DATA_UNIT_KEYS = Object.keys(DATA_UNITS);

export function convertDataSize(value: number, from: string, to: string): number {
  if (!(from in DATA_UNITS) || !(to in DATA_UNITS)) throw new Error("ไม่รู้จักหน่วยนี้");

  return (value * DATA_UNITS[from]) / DATA_UNITS[to];
}

// ───────────── ตัวเลข ─────────────

export function toRoman(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 3999)
    throw new Error("เลขโรมันรองรับจำนวนเต็ม 1–3999");

  const table: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let n = value;
  let out = "";

  for (const [v, s] of table) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }

  return out;
}

export function fromRoman(input: string): number {
  const text = input.trim().toUpperCase();

  if (!/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/u.test(text) || !text)
    throw new Error("ไม่ใช่เลขโรมันที่ถูกต้อง");

  const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;

  for (let i = 0; i < text.length; i++) {
    const v = values[text[i]];

    total += v < (values[text[i + 1]] ?? 0) ? -v : v;
  }

  return total;
}

const THAI_DIGITS = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const THAI_PLACES = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

function thaiNumber(n: string): string {
  if (/^0*$/u.test(n)) return "";

  if (n.length > 6) {
    const head = n.slice(0, -6);
    const tail = n.slice(-6);

    return `${thaiNumber(head)}ล้าน${thaiNumber(tail)}`;
  }

  let out = "";
  const digits = n.replace(/^0+/u, "");

  for (let i = 0; i < digits.length; i++) {
    const d = Number(digits[i]);
    const place = digits.length - i - 1;

    if (d === 0) continue;
    if (place === 1 && d === 1) out += "สิบ";
    else if (place === 1 && d === 2) out += "ยี่สิบ";
    else if (place === 0 && d === 1 && digits.length > 1) out += "เอ็ด";
    else out += THAI_DIGITS[d] + THAI_PLACES[place];
  }

  return out;
}

/// จำนวนเงินเป็นตัวอักษรไทยแบบเช็ค/ใบเสร็จ เช่น 121.50 → "หนึ่งร้อยยี่สิบเอ็ดบาทห้าสิบสตางค์"
export function bahtText(input: string): string {
  const cleaned = input.replace(/[,\s฿]/gu, "");

  if (!/^-?\d+(\.\d+)?$/u.test(cleaned)) throw new Error("กรุณากรอกจำนวนเงิน เช่น 1250.75");

  const negative = cleaned.startsWith("-");
  const [intPart, fracPart = ""] = cleaned.replace("-", "").split(".");
  // ปัดสตางค์ 2 ตำแหน่ง
  let satang = Math.round(Number(`0.${fracPart || "0"}`) * 100);
  let baht = BigInt(intPart);

  if (satang === 100) {
    baht += 1n;
    satang = 0;
  }

  const bahtWords = baht === 0n ? "ศูนย์" : thaiNumber(baht.toString());
  const words =
    satang === 0
      ? `${bahtWords}บาทถ้วน`
      : `${baht === 0n ? "" : `${bahtWords}บาท`}${thaiNumber(String(satang))}สตางค์`;

  return negative ? `ลบ${words}` : words;
}
