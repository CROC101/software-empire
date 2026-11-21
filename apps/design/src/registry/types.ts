/**
 * Registry types and helpers. Plain data (no React), so server pages, the client library and the
 * tests all read the same shapes.
 */

export type Control =
  | {
      key: string;
      label: string;
      type: "range";
      min: number;
      max: number;
      step: number;
      value: number;
    }
  | { key: string; label: string; type: "select"; options: readonly string[]; value: string }
  | { key: string; label: string; type: "toggle"; value: boolean }
  | { key: string; label: string; type: "text"; maxLength: number; value: string };

export type Values = Record<string, string | number | boolean>;

export const kinds = {
  exclusive: "Exclusive",
  component: "คอมโพเนนต์",
  block: "บล็อกหน้าเว็บ",
  template: "เทมเพลตทั้งหน้า",
} as const;
export type Kind = keyof typeof kinds;

/** Category order here is the sidebar order. */
export const categories = {
  "studio-hero": { label: "Hero ของสตูดิโอ", kind: "exclusive" },
  showcase: { label: "Hero แกลเลอรี", kind: "exclusive" },
  spotlight: { label: "Hero แสงไฟ", kind: "exclusive" },
  stories: { label: "สตอรี่", kind: "exclusive" },
  team: { label: "ทีม", kind: "exclusive" },
  carousel: { label: "สไลด์", kind: "exclusive" },
  "water-ui": { label: "ปุ่มและเมนูน้ำ", kind: "exclusive" },
  intro: { label: "อินโทรและโลโก้", kind: "exclusive" },
  atmosphere: { label: "บรรยากาศ", kind: "exclusive" },
  "art-wall": { label: "ผนังภาพ", kind: "exclusive" },
  product: { label: "สินค้าและเมนู", kind: "exclusive" },
  footer: { label: "ฟุตเตอร์", kind: "exclusive" },
  menu: { label: "เมนูและการ์ดลอย", kind: "exclusive" },
  "scroll-text": { label: "ตัวอักษรตามสกอลล์", kind: "exclusive" },
  background: { label: "พื้นหลัง", kind: "component" },
  text: { label: "ตัวอักษร", kind: "component" },
  button: { label: "ปุ่ม", kind: "component" },
  card: { label: "การ์ด", kind: "component" },
  navigation: { label: "เมนูนำทาง", kind: "component" },
  input: { label: "ฟอร์มและอินพุต", kind: "component" },
  feedback: { label: "สถานะและโหลด", kind: "component" },
  overlay: { label: "ป๊อปอัปและเมนูลอย", kind: "component" },
  data: { label: "ตัวเลขและกราฟ", kind: "component" },
  media: { label: "รูปและสื่อ", kind: "component" },
  interaction: { label: "ลูกเล่นเมาส์", kind: "component" },
  layout: { label: "เลย์เอาต์", kind: "component" },
  hero: { label: "Hero", kind: "block" },
  chrome: { label: "หัวเว็บและท้ายเว็บ", kind: "block" },
  features: { label: "ฟีเจอร์", kind: "block" },
  proof: { label: "รีวิวและความน่าเชื่อถือ", kind: "block" },
  pricing: { label: "ราคา", kind: "block" },
  conversion: { label: "ชวนกดและติดต่อ", kind: "block" },
  content: { label: "เนื้อหา", kind: "block" },
  pages: { label: "หน้าพิเศษ", kind: "block" },
  page: { label: "ทั้งหน้า", kind: "template" },
} as const satisfies Record<string, { label: string; kind: Kind }>;
export type Category = keyof typeof categories;

export type Entry = {
  slug: string;
  name: string;
  summary: string;
  category: Category;
  /** the patterns this part blends, shown as chips and searched */
  blend: readonly string[];
  controls: readonly Control[];
  /** ISO date the part joined the library ("มาใหม่") */
  added: string;
  /** curated popularity, 1 = most popular ("ยอดนิยม"); unranked parts sort after ranked ones */
  rank?: number;
  /** hand-written prompt; otherwise promptFor() builds one */
  prompt?: string;
  /** our own clean-room rebuild of this React Bits part (its title there); credited and linked, no code taken */
  inspiredBy?: string;
  /** our own clean-room remake of a 21st.dev community part: its author and public page; no code taken */
  credit?: { author: string; url: string };
};

export const kindOf = (e: Entry): Kind => categories[e.category].kind;

export const range = (
  key: string,
  label: string,
  min: number,
  max: number,
  step: number,
  value: number,
): Control => ({ key, label, type: "range", min, max, step, value });
export const pick = (
  key: string,
  label: string,
  options: readonly string[],
  value: string,
): Control => ({ key, label, type: "select", options, value });
export const toggle = (key: string, label: string, value: boolean): Control => ({
  key,
  label,
  type: "toggle",
  value,
});
export const text = (key: string, label: string, value: string, maxLength = 40): Control => ({
  key,
  label,
  type: "text",
  maxLength,
  value,
});

/** Compact entry builder for the data files. */
export function def(
  added: string,
  category: Category,
  slug: string,
  name: string,
  summary: string,
  blend: readonly string[],
  controls: readonly Control[] = [],
  rank?: number,
): Entry {
  return { slug, name, summary, category, blend, controls, added, rank };
}

export function defaults(e: Entry): Values {
  return Object.fromEntries(e.controls.map((c) => [c.key, c.value]));
}

/** Playground input is a trust boundary in miniature: keep every value inside its control's range. */
export function clampValue(c: Control, v: unknown): string | number | boolean {
  switch (c.type) {
    case "range": {
      const n = Number(v);
      return Number.isFinite(n) ? Math.min(c.max, Math.max(c.min, n)) : c.value;
    }
    case "select":
      return typeof v === "string" && c.options.includes(v) ? v : c.value;
    case "toggle":
      return typeof v === "boolean" ? v : c.value;
    case "text":
      return typeof v === "string" ? v.slice(0, c.maxLength) : c.value;
  }
}

const noun: Record<Kind, string> = {
  exclusive: "showpiece landing-page hero (React)",
  component: "React component",
  block: "responsive landing-page section (React)",
  template: "full landing page (React) composed of sections",
};

function describe(c: Control): string {
  switch (c.type) {
    case "range":
      return `${c.key}: number ${String(c.min)}–${String(c.max)}, default ${String(c.value)}`;
    case "select":
      return `${c.key}: one of ${c.options.join(" | ")}, default ${c.value}`;
    case "toggle":
      return `${c.key}: boolean, default ${String(c.value)}`;
    case "text":
      return `${c.key}: string up to ${String(c.maxLength)} chars, default "${c.value}"`;
  }
}

/** The prompt that rebuilds a part with any AI coding tool. */
export function promptFor(e: Entry): string {
  if (e.prompt) return e.prompt;
  const kind = kindOf(e);
  const props = e.controls.length ? ` Props: ${e.controls.map(describe).join("; ")}.` : "";
  const fit =
    kind === "component"
      ? " It sits on a dark ink stage."
      : " Use semantic colour tokens so it follows light and dark themes, and container queries so it works from 390px phones to wide desktops.";
  return `Build a ${noun[kind]} named "${e.name}" that blends ${e.blend.join(", ")}. What it does (Thai brief): ${e.summary}.${props}${fit} Rules: colours from CSS design tokens only, animate transform and opacity only with motion/react, stop loops under prefers-reduced-motion, keyboard and screen-reader friendly, corners at most 0.75rem, pills only for chips.`;
}
