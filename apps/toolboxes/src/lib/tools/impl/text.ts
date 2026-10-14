/// เครื่องมือข้อความ — ฟังก์ชันล้วน (ไม่แตะ DOM) ทดสอบได้ใน text.test.ts

/// ตัดคำภาษาไทยด้วย Intl.Segmenter (เบราว์เซอร์มีในตัว) · ไม่มี = นับตามช่องว่าง
export function countWords(text: string): number {
  const trimmed = text.trim();

  if (!trimmed) return 0;

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("th", { granularity: "word" });
    let count = 0;

    for (const part of segmenter.segment(trimmed)) if (part.isWordLike) count++;

    return count;
  }

  return trimmed.split(/\s+/u).length;
}

export function textStats(text: string) {
  const words = countWords(text);
  const lines = text ? text.split(/\r\n|\r|\n/u).length : 0;
  const paragraphs = text.trim() ? text.trim().split(/(?:\r?\n){2,}/u).length : 0;
  const sentences = text.trim()
    ? (text.match(/[^.!?。\n]+[.!?。]?/gu) ?? []).filter((s) => s.trim()).length
    : 0;
  const graphemes = [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(text)].length;

  return {
    characters: graphemes,
    charactersNoSpaces: [
      ...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(text.replace(/\s/gu, "")),
    ].length,
    words,
    lines,
    paragraphs,
    sentences,
    // ภาษาไทยอ่านราว 200 คำ/นาที (นับแบบตัดคำ)
    readingMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / 200)),
  };
}

function wordsOf(input: string): string[] {
  return (
    input
      .trim()
      .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/gu, "$1 $2")
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

export type CaseStyle =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "dot";

export function convertCase(input: string, style: CaseStyle): string {
  const words = wordsOf(input);
  const lower = words.map((w) => w.toLocaleLowerCase());
  const cap = (w: string) => w.charAt(0).toLocaleUpperCase() + w.slice(1).toLocaleLowerCase();

  switch (style) {
    case "upper":
      return input.toLocaleUpperCase();
    case "lower":
      return input.toLocaleLowerCase();
    case "title":
      return input.replace(/[\p{L}\p{N}]+/gu, (w) => cap(w));
    case "sentence":
      return input
        .toLocaleLowerCase()
        .replace(
          /(^\s*|[.!?]\s+)(\p{L})/gu,
          (_, gap: string, ch: string) => gap + ch.toLocaleUpperCase(),
        );
    case "camel":
      return lower.map((w, i) => (i ? cap(w) : w)).join("");
    case "pascal":
      return lower.map(cap).join("");
    case "snake":
      return lower.join("_");
    case "kebab":
      return lower.join("-");
    case "constant":
      return lower.join("_").toLocaleUpperCase();
    case "dot":
      return lower.join(".");
  }
}

export function removeDuplicateLines(
  input: string,
  options: { caseSensitive: boolean; trim: boolean; keepEmpty: boolean },
) {
  const seen = new Set<string>();
  const out: string[] = [];
  let removed = 0;

  for (const raw of input.split(/\r?\n/u)) {
    const line = options.trim ? raw.trim() : raw;

    if (!line && !options.keepEmpty) continue;

    const key = options.caseSensitive ? line : line.toLocaleLowerCase();

    if (line && seen.has(key)) {
      removed++;
      continue;
    }

    seen.add(key);
    out.push(line);
  }

  return { text: out.join("\n"), removed };
}

export type SortMode =
  "asc" | "desc" | "length" | "length-desc" | "natural" | "reverse" | "shuffle";

export function sortLines(
  input: string,
  mode: SortMode,
  random: () => number = Math.random,
): string {
  const lines = input.split(/\r?\n/u);
  const collator = new Intl.Collator("th", { numeric: mode === "natural", sensitivity: "base" });

  switch (mode) {
    case "asc":
    case "natural":
      return [...lines].sort(collator.compare).join("\n");
    case "desc":
      return [...lines].sort((a, b) => collator.compare(b, a)).join("\n");
    case "length":
      return [...lines].sort((a, b) => a.length - b.length || collator.compare(a, b)).join("\n");
    case "length-desc":
      return [...lines].sort((a, b) => b.length - a.length || collator.compare(a, b)).join("\n");
    case "reverse":
      return [...lines].reverse().join("\n");
    case "shuffle":
      return shuffle(lines, random).join("\n");
  }
}

/// สลับลำดับแบบ Fisher–Yates (random ส่งเข้ามาได้ — เครื่องมือใช้ crypto · เทสต์ใช้ค่าคงที่)
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];

  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));

    [out[i], out[j]] = [out[j], out[i]];
  }

  return out;
}

export function reverseText(input: string, mode: "characters" | "words" | "lines"): string {
  if (mode === "lines") return input.split(/\r?\n/u).reverse().join("\n");
  if (mode === "words") return input.split(/(\s+)/u).reverse().join("");

  // กลับทีละ grapheme — สระ/วรรณยุกต์ไทยไม่หลุดจากพยัญชนะ
  return [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(input)]
    .map((s) => s.segment)
    .reverse()
    .join("");
}

export function cleanWhitespace(
  input: string,
  options: {
    trimLines: boolean;
    collapseSpaces: boolean;
    removeEmptyLines: boolean;
    tabsToSpaces: boolean;
  },
): string {
  let lines = input.replace(/\r\n?/gu, "\n").split("\n");

  if (options.tabsToSpaces) lines = lines.map((l) => l.replace(/\t/gu, "  "));
  if (options.collapseSpaces) lines = lines.map((l) => l.replace(/[ \u00A0]{2,}/gu, " "));
  if (options.trimLines) lines = lines.map((l) => l.trim());
  if (options.removeEmptyLines) lines = lines.filter((l) => l.trim() !== "");

  return lines.join("\n").replace(/\u200B/gu, "");
}

export function extractEmails(input: string): string[] {
  return [...new Set(input.match(/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu) ?? [])];
}

export function extractUrls(input: string): string[] {
  return [
    ...new Set(
      (input.match(/\bhttps?:\/\/[^\s<>"'`]+/giu) ?? []).map((u) => u.replace(/[),.;:!?]+$/u, "")),
    ),
  ];
}

/// slug สำหรับ URL — ตัวอักษรไทยคงไว้ได้ (เลือกตัดออกได้)
export function slugify(
  input: string,
  options: { separator: string; keepThai: boolean; lowercase: boolean },
): string {
  let text = input.normalize("NFKD").replace(/[̀-ͯ]/gu, "");

  if (options.lowercase) text = text.toLocaleLowerCase();

  const allowed = options.keepThai ? /[^\p{L}\p{N}\p{M}]+/gu : /[^a-zA-Z0-9]+/gu;

  if (!options.separator) return text.replace(allowed, "");

  // escape เฉพาะ syntax character — โหมด u ไม่ยอมให้ escape - หรือ _
  const sep = options.separator.replace(/[\\^$.*+?()[\]{}|/]/gu, "\\$&");

  return text
    .replace(allowed, options.separator)
    .replace(new RegExp(`(?:${sep}){2,}`, "gu"), options.separator)
    .replace(new RegExp(`^(?:${sep})|(?:${sep})$`, "gu"), "");
}

export function compareTexts(left: string, right: string) {
  const a = left.split(/\r?\n/u);
  const b = right.split(/\r?\n/u);
  // LCS แบบตาราง — จำกัดขนาดกันหน้าค้าง (บรีฟ: จำกัด CPU/memory)
  if (a.length * b.length > 4_000_000)
    throw new Error(
      "ข้อความยาวเกินไปสำหรับการเปรียบเทียบในเบราว์เซอร์ (รวมไม่เกินราว 2,000 บรรทัดต่อฝั่ง)",
    );

  const dp = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }

  const lines: { type: "same" | "add" | "del"; text: string }[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      lines.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) lines.push({ type: "del", text: a[i++] });
    else lines.push({ type: "add", text: b[j++] });
  }

  while (i < a.length) lines.push({ type: "del", text: a[i++] });
  while (j < b.length) lines.push({ type: "add", text: b[j++] });

  return lines;
}
