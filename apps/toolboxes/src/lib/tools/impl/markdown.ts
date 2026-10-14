/// Markdown → โครงข้อมูล (AST) ที่ React วาดเอง — **ไม่มี HTML ดิบลงหน้า** จึงไม่มีทาง XSS
///
/// รองรับ: หัวข้อ # · ย่อหน้า · ตัวหนา/เอียง/ขีดฆ่า · `โค้ด` · บล็อก ``` · รายการ - และ 1. · อ้างอิง > ·
/// เส้นคั่น --- · ตาราง | · ลิงก์ [ข้อความ](url) เฉพาะ http(s)/mailto
/// รูป ![alt](url) แสดงเป็นข้อความ alt — ไม่โหลดรูปจากเว็บอื่น (ไม่ให้ IP ผู้ใช้รั่วไปที่อื่น)

export type Inline =
  | { type: "text"; text: string }
  | { type: "strong" | "em" | "del"; children: Inline[] }
  | { type: "code"; text: string }
  | { type: "link"; href: string; children: Inline[] }
  | { type: "image"; alt: string; src: string };

export type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; children: Inline[] }
  | { type: "paragraph"; children: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "code"; lang: string; text: string }
  | { type: "quote"; children: Inline[] }
  | { type: "hr" }
  | { type: "table"; head: Inline[][]; rows: Inline[][][] };

export function safeHref(url: string): string | null {
  const trimmed = url.trim();

  return /^(https?:\/\/|mailto:)/iu.test(trimmed) ? trimmed : null;
}

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re =
    /`([^`]+)`|\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~|\*([^*\s][^*]*?)\*|_([^_\s][^_]*?)_|!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)/gu;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ type: "text", text: text.slice(last, m.index) });

    if (m[1] !== undefined) out.push({ type: "code", text: m[1] });
    else if (m[2] !== undefined || m[3] !== undefined)
      out.push({ type: "strong", children: parseInline(m[2] ?? m[3]) });
    else if (m[4] !== undefined) out.push({ type: "del", children: parseInline(m[4]) });
    else if (m[5] !== undefined || m[6] !== undefined)
      out.push({ type: "em", children: parseInline(m[5] ?? m[6]) });
    else if (m[7] !== undefined) out.push({ type: "image", alt: m[7], src: m[8] });
    else if (m[9] !== undefined) {
      const href = safeHref(m[10]);

      out.push(
        href ? { type: "link", href, children: parseInline(m[9]) } : { type: "text", text: m[9] },
      );
    }

    last = re.lastIndex;
  }

  if (last < text.length) out.push({ type: "text", text: text.slice(last) });

  return out;
}

const tableCells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/gu, "")
    .split(/(?<!\\)\|/u)
    .map((c) => parseInline(c.trim().replace(/\\\|/gu, "|")));

export function parseMarkdown(input: string): Block[] {
  const lines = input.replace(/\r\n?/gu, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const fence = /^```\s*([\w-]*)\s*$/u.exec(line.trim());

    if (fence) {
      const body: string[] = [];

      i++;
      while (i < lines.length && !/^```\s*$/u.test(lines[i].trim())) body.push(lines[i++]);
      i++;
      blocks.push({ type: "code", lang: fence[1], text: body.join("\n") });
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/u.exec(line);

    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        children: parseInline(heading[2].replace(/\s+#+\s*$/u, "")),
      });
      i++;
      continue;
    }

    if (/^\s*([-*_])(\s*\1){2,}\s*$/u.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    if (
      line.trim().startsWith("|") &&
      i + 1 < lines.length &&
      /^\s*\|?\s*:?-{3,}/u.test(lines[i + 1])
    ) {
      const head = tableCells(line);
      const rows: Inline[][][] = [];

      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(tableCells(lines[i++]));
      blocks.push({ type: "table", head, rows });
      continue;
    }

    if (/^\s*>/u.test(line)) {
      const body: string[] = [];

      while (i < lines.length && /^\s*>/u.test(lines[i]))
        body.push(lines[i++].replace(/^\s*>\s?/u, ""));
      blocks.push({ type: "quote", children: parseInline(body.join(" ")) });
      continue;
    }

    const bullet = /^\s*([-*+]|\d+[.)])\s+/u.exec(line);

    if (bullet) {
      const ordered = /\d/u.test(bullet[1]);
      const items: Inline[][] = [];

      while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/u.test(lines[i]))
        items.push(parseInline(lines[i++].replace(/^\s*([-*+]|\d+[.)])\s+/u, "")));
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const para: string[] = [];

    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|```|\s*>|\s*([-*+]|\d+[.)])\s+)/u.test(lines[i])
    )
      para.push(lines[i++].trim());
    blocks.push({ type: "paragraph", children: parseInline(para.join(" ")) });
  }

  return blocks;
}
