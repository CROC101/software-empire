/// YAML ↔ JSON (ไลบรารี YAML ไม่อยู่ใน whitelist ของมาตรฐาน — เขียนเองเฉพาะส่วนที่ใช้จริง)
///
/// รองรับ: mapping · sequence (- ) · ซ้อนด้วยการเยื้อง · สตริงมี/ไม่มีเครื่องหมายคำพูด · ตัวเลข · true/false ·
/// null/~ · flow [a, b] / {a: 1} · คอมเมนต์ # · block scalar | และ >
/// ไม่รองรับ: anchor/alias (&, *) · tag (!!) · หลายเอกสาร (---) — แจ้ง error ตรง ๆ แทนการเดา

interface Line {
  indent: number;
  text: string;
  no: number;
}

function stripComment(line: string): string {
  let quote: string | null = null;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (quote) {
      if (ch === quote && line[i - 1] !== "\\") quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "#" && (i === 0 || /\s/u.test(line[i - 1]))) return line.slice(0, i);
  }

  return line;
}

export function parseScalar(raw: string): unknown {
  const text = raw.trim();

  if (text === "" || text === "~" || text === "null" || text === "Null" || text === "NULL")
    return null;
  if (/^(true|True|TRUE)$/u.test(text)) return true;
  if (/^(false|False|FALSE)$/u.test(text)) return false;
  if (/^[-+]?\d+$/u.test(text) && !/^[-+]?0\d/u.test(text)) return Number(text);
  if (/^[-+]?(\d+\.\d*|\.\d+|\d+)([eE][-+]?\d+)?$/u.test(text)) return Number(text);
  if (text.startsWith('"') && text.endsWith('"') && text.length >= 2) {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`สตริงในเครื่องหมาย " ไม่ถูกต้อง: ${text}`);
    }
  }
  if (text.startsWith("'") && text.endsWith("'") && text.length >= 2)
    return text.slice(1, -1).replace(/''/gu, "'");
  if (text.startsWith("[") || text.startsWith("{")) return parseFlow(text);
  if (/^[&*!]/u.test(text))
    throw new Error(`ยังไม่รองรับ anchor/alias/tag ของ YAML (${text.slice(0, 20)})`);

  return text;
}

function splitFlow(body: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = "";

  for (const ch of body) {
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "[" || ch === "{") depth++;
    else if (ch === "]" || ch === "}") depth--;
    else if (ch === "," && depth === 0) {
      out.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  if (current.trim()) out.push(current);

  return out;
}

function parseFlow(text: string): unknown {
  if (text.startsWith("[")) {
    if (!text.endsWith("]")) throw new Error(`[ ไม่ได้ปิดด้วย ]: ${text}`);

    return splitFlow(text.slice(1, -1)).map((item) => parseScalar(item));
  }

  if (!text.endsWith("}")) throw new Error(`{ ไม่ได้ปิดด้วย }: ${text}`);

  return Object.fromEntries(
    splitFlow(text.slice(1, -1)).map((pair) => {
      const at = pair.indexOf(":");

      if (at < 0) throw new Error(`ใน { } ต้องเป็น key: value (${pair.trim()})`);

      return [String(parseScalar(pair.slice(0, at))), parseScalar(pair.slice(at + 1))];
    }),
  );
}

function keyValue(text: string): [string, string] | null {
  let quote: string | null = null;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === ":" && (i === text.length - 1 || text[i + 1] === " "))
      return [String(parseScalar(text.slice(0, i))), text.slice(i + 1).trim()];
  }

  return null;
}

export function parseYaml(input: string): unknown {
  if (/^\s*---\s*\S/mu.test(input) || (input.match(/^---\s*$/gmu) ?? []).length > 1)
    throw new Error("ยังไม่รองรับ YAML หลายเอกสาร (---)");

  const lines: Line[] = [];

  input.split(/\r?\n/u).forEach((raw, i) => {
    if (raw.includes("\t") && /^\s*\t/u.test(raw))
      throw new Error(`บรรทัด ${i + 1}: YAML ห้ามเยื้องด้วย Tab`);

    const text = stripComment(raw).trimEnd();

    if (!text.trim() || text.trim() === "---") return;
    lines.push({ indent: text.length - text.trimStart().length, text: text.trim(), no: i + 1 });
  });

  if (!lines.length) return null;

  let pos = 0;
  const rawLines = input.split(/\r?\n/u);

  const blockScalar = (style: string, parentIndent: number, startNo: number): string => {
    const collected: string[] = [];
    let indent = -1;
    let i = startNo; // บรรทัดถัดจากตัวบ่ง (no เริ่ม 1 → index = no)

    for (; i < rawLines.length; i++) {
      const line = rawLines[i];

      if (!line.trim()) {
        collected.push("");
        continue;
      }

      const lead = line.length - line.trimStart().length;

      if (lead <= parentIndent) break;
      if (indent < 0) indent = lead;
      collected.push(line.slice(indent));
    }

    while (pos < lines.length && lines[pos].no <= i) pos++;
    while (collected.length && collected[collected.length - 1] === "") collected.pop();

    const body = style.startsWith(">")
      ? collected.join("\n").replace(/([^\n])\n(?!\n)/gu, "$1 ")
      : collected.join("\n");

    return style.endsWith("-") ? body : `${body}\n`;
  };

  const parseBlock = (indent: number): unknown => {
    const first = lines[pos];

    if (first.text.startsWith("- ") || first.text === "-") {
      const arr: unknown[] = [];

      while (
        pos < lines.length &&
        lines[pos].indent === indent &&
        (lines[pos].text.startsWith("- ") || lines[pos].text === "-")
      ) {
        const line = lines[pos];
        const rest = line.text === "-" ? "" : line.text.slice(2);

        pos++;

        if (!rest) {
          arr.push(
            pos < lines.length && lines[pos].indent > indent ? parseBlock(lines[pos].indent) : null,
          );
        } else if (
          keyValue(rest) &&
          !rest.startsWith("{") &&
          !rest.startsWith('"') &&
          !rest.startsWith("'")
        ) {
          // "- key: value" = object ที่บรรทัดถัดไปเยื้องตรงกับ key
          const childIndent = line.indent + 2;

          lines.splice(pos, 0, { indent: childIndent, text: rest, no: line.no });
          arr.push(parseBlock(childIndent));
        } else if (/^[|>][+-]?$/u.test(rest)) arr.push(blockScalar(rest, indent, line.no));
        else arr.push(parseScalar(rest));
      }

      return arr;
    }

    const obj: Record<string, unknown> = {};

    while (pos < lines.length && lines[pos].indent === indent) {
      const line = lines[pos];
      const kv = keyValue(line.text);

      if (!kv) throw new Error(`บรรทัด ${line.no}: ต้องเป็น key: value หรือ - รายการ`);

      const [key, value] = kv;

      pos++;

      if (value === "") {
        obj[key] =
          pos < lines.length && lines[pos].indent > indent
            ? parseBlock(lines[pos].indent)
            : pos < lines.length && lines[pos].indent === indent && lines[pos].text.startsWith("- ")
              ? parseBlock(indent)
              : null;
      } else if (/^[|>][+-]?$/u.test(value)) obj[key] = blockScalar(value, indent, line.no);
      else obj[key] = parseScalar(value);
    }

    if (pos < lines.length && lines[pos].indent > indent)
      throw new Error(`บรรทัด ${lines[pos].no}: เยื้องไม่ตรงกับบรรทัดก่อนหน้า`);

    return obj;
  };

  const result = parseBlock(lines[0].indent);

  if (pos < lines.length)
    throw new Error(`บรรทัด ${lines[pos].no}: เยื้องไม่ตรงกับโครงสร้างด้านบน`);

  return result;
}

function yamlString(value: string): string {
  if (value === "") return "''";
  if (
    /^[\s]|[\s]$|^[-?:,[\]{}#&*!|>'"%@`]|: | #|^(true|false|null|yes|no|~)$/iu.test(value) ||
    /^[-+]?(\d|\.\d)/u.test(value) ||
    value.includes("\n")
  )
    return JSON.stringify(value);

  return value;
}

export function toYaml(value: unknown, indent = 0): string {
  const pad = " ".repeat(indent);

  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string") return yamlString(value);

  if (Array.isArray(value)) {
    if (!value.length) return "[]";

    return (value as unknown[])
      .map((item) => {
        if (item && typeof item === "object" && !Array.isArray(item) && Object.keys(item).length) {
          const inner = toYaml(item, indent + 2).trimStart();

          return `${pad}- ${inner}`;
        }

        return `${pad}- ${item && typeof item === "object" ? `\n${toYaml(item, indent + 2)}` : toYaml(item, indent + 2)}`;
      })
      .join("\n");
  }

  const entries = Object.entries(value as Record<string, unknown>);

  if (!entries.length) return "{}";

  return entries
    .map(([k, v]) => {
      const key = yamlString(k);

      if (v && typeof v === "object" && (Array.isArray(v) ? v.length : Object.keys(v).length))
        return `${pad}${key}:\n${toYaml(v, indent + 2)}`;

      return `${pad}${key}: ${toYaml(v, indent + 2)}`;
    })
    .join("\n");
}
