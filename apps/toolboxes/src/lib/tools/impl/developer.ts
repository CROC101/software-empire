/// เครื่องมือนักพัฒนา — ฟังก์ชันล้วน ทดสอบได้ใน developer.test.ts
/// ข้อผิดพลาดของผู้ใช้ throw Error ภาษาไทย

export function parseJson(input: string): unknown {
  if (!input.trim()) throw new Error("กรุณาวาง JSON");

  try {
    return JSON.parse(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const at = /position (\d+)/u.exec(message);

    if (at) {
      const pos = Number(at[1]);
      const before = input.slice(0, pos);
      const line = before.split("\n").length;
      const column = pos - before.lastIndexOf("\n");

      throw new Error(`JSON ไม่ถูกต้องที่บรรทัด ${line} ตำแหน่ง ${column}: ${message}`, {
        cause: error,
      });
    }

    throw new Error(`JSON ไม่ถูกต้อง: ${message}`, { cause: error });
  }
}

export function formatJson(input: string, mode: "pretty" | "minify" | "sort", indent = 2): string {
  const value = parseJson(input);

  if (mode === "minify") return JSON.stringify(value);
  if (mode === "sort") return JSON.stringify(sortKeys(value), null, indent);

  return JSON.stringify(value, null, indent);
}

export function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, sortKeys((value as Record<string, unknown>)[k])]),
    );
  }

  return value;
}

export function jsonLines(input: string, direction: "to-array" | "to-lines"): string {
  if (direction === "to-lines") {
    const value = parseJson(input);

    if (!Array.isArray(value)) throw new Error("JSON ต้องเป็น array เพื่อแปลงเป็น JSON Lines");

    return value.map((v) => JSON.stringify(v)).join("\n");
  }

  const rows = input.split(/\r?\n/u).filter((l) => l.trim());

  return JSON.stringify(
    rows.map((line, i) => {
      try {
        return JSON.parse(line) as unknown;
      } catch {
        throw new Error(`บรรทัด ${i + 1} ไม่ใช่ JSON ที่ถูกต้อง`);
      }
    }),
    null,
    2,
  );
}

/// ค้นใน JSON ด้วยรูปแบบ JSONPath พื้นฐาน: $.a.b · $.a[0] · $.a[*].b · $..name · $.a[-1]
export function queryJson(input: string, path: string): unknown[] {
  const root = parseJson(input);
  const expr = path.trim() || "$";

  if (!expr.startsWith("$")) throw new Error("นิพจน์ต้องขึ้นต้นด้วย $ เช่น $.items[*].name");

  const tokens: (
    | { type: "key"; key: string }
    | { type: "index"; index: number }
    | { type: "all" }
    | { type: "deep"; key: string }
  )[] = [];
  const re = /\.\.([\p{L}\p{N}_$-]+|\*)|\.([\p{L}\p{N}_$-]+|\*)|\[(-?\d+|\*|'[^']*'|"[^"]*")\]/gu;
  const rest = expr.slice(1);
  let match: RegExpExecArray | null;
  let consumed = 0;

  while ((match = re.exec(rest))) {
    if (match.index !== consumed) throw new Error(`อ่านนิพจน์ไม่ได้ตรง "${rest.slice(consumed)}"`);
    consumed = re.lastIndex;

    if (match[1]) tokens.push({ type: "deep", key: match[1] });
    else if (match[2])
      tokens.push(match[2] === "*" ? { type: "all" } : { type: "key", key: match[2] });
    else if (match[3] === "*") tokens.push({ type: "all" });
    else if (/^-?\d+$/u.test(match[3])) tokens.push({ type: "index", index: Number(match[3]) });
    else tokens.push({ type: "key", key: match[3].slice(1, -1) });
  }

  if (consumed !== rest.length) throw new Error(`อ่านนิพจน์ไม่ได้ตรง "${rest.slice(consumed)}"`);

  const deep = (value: unknown, key: string, out: unknown[]) => {
    if (Array.isArray(value)) value.forEach((v) => deep(v, key, out));
    else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        if (key === "*" || k === key) out.push(v);
        deep(v, key, out);
      }
    }
  };

  let current: unknown[] = [root];

  for (const token of tokens) {
    const next: unknown[] = [];

    for (const value of current) {
      if (token.type === "deep") deep(value, token.key, next);
      else if (token.type === "all") {
        if (Array.isArray(value)) next.push(...(value as unknown[]));
        else if (value && typeof value === "object")
          next.push(...(Object.values(value) as unknown[]));
      } else if (token.type === "index" && Array.isArray(value)) {
        const item: unknown = value[token.index < 0 ? value.length + token.index : token.index];

        if (item !== undefined) next.push(item);
      } else if (
        token.type === "key" &&
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        token.key in value
      ) {
        next.push((value as Record<string, unknown>)[token.key]);
      }
    }

    current = next;
  }

  return current;
}

export interface SchemaError {
  path: string;
  message: string;
}

/// ตรวจ JSON กับ JSON Schema ชุดคำสั่งที่ใช้บ่อย (type · properties · required · items · enum · const ·
/// min/max · minLength/maxLength · pattern · minItems/maxItems · additionalProperties · format email/uri/date)
export function validateJsonSchema(dataText: string, schemaText: string): SchemaError[] {
  const data = parseJson(dataText);
  let schema: unknown;

  try {
    schema = JSON.parse(schemaText);
  } catch {
    throw new Error("Schema ไม่ใช่ JSON ที่ถูกต้อง");
  }

  const errors: SchemaError[] = [];
  const typeOf = (v: unknown) =>
    v === null ? "null" : Array.isArray(v) ? "array" : Number.isInteger(v) ? "integer" : typeof v;

  const check = (value: unknown, s: Record<string, unknown>, path: string) => {
    if (!s || typeof s !== "object") return;

    if (s.type) {
      const types = Array.isArray(s.type) ? (s.type as string[]) : [s.type as string];
      const actual = typeOf(value);

      if (!types.some((t) => t === actual || (t === "number" && actual === "integer"))) {
        errors.push({ path, message: `ต้องเป็น ${types.join(" หรือ ")} (ได้ ${actual})` });
        return;
      }
    }

    if (Array.isArray(s.enum) && !s.enum.some((e) => JSON.stringify(e) === JSON.stringify(value)))
      errors.push({ path, message: `ต้องเป็นค่าหนึ่งใน ${JSON.stringify(s.enum)}` });
    if ("const" in s && JSON.stringify(s.const) !== JSON.stringify(value))
      errors.push({ path, message: `ต้องเท่ากับ ${JSON.stringify(s.const)}` });

    if (typeof value === "number") {
      if (typeof s.minimum === "number" && value < s.minimum)
        errors.push({ path, message: `ต้องไม่น้อยกว่า ${s.minimum}` });
      if (typeof s.maximum === "number" && value > s.maximum)
        errors.push({ path, message: `ต้องไม่มากกว่า ${s.maximum}` });
    }

    if (typeof value === "string") {
      if (typeof s.minLength === "number" && value.length < s.minLength)
        errors.push({ path, message: `ต้องยาวอย่างน้อย ${s.minLength} ตัวอักษร` });
      if (typeof s.maxLength === "number" && value.length > s.maxLength)
        errors.push({ path, message: `ต้องยาวไม่เกิน ${s.maxLength} ตัวอักษร` });
      if (typeof s.pattern === "string" && !new RegExp(s.pattern, "u").test(value))
        errors.push({ path, message: `ไม่ตรงรูปแบบ ${s.pattern}` });
      if (s.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value))
        errors.push({ path, message: "ต้องเป็นอีเมล" });
      if (s.format === "uri" && !/^[a-z][a-z0-9+.-]*:/iu.test(value))
        errors.push({ path, message: "ต้องเป็น URI" });
      if (s.format === "date" && !/^\d{4}-\d{2}-\d{2}$/u.test(value))
        errors.push({ path, message: "ต้องเป็นวันที่ YYYY-MM-DD" });
    }

    if (Array.isArray(value)) {
      if (typeof s.minItems === "number" && value.length < s.minItems)
        errors.push({ path, message: `ต้องมีอย่างน้อย ${s.minItems} รายการ` });
      if (typeof s.maxItems === "number" && value.length > s.maxItems)
        errors.push({ path, message: `ต้องมีไม่เกิน ${s.maxItems} รายการ` });
      if (s.items && typeof s.items === "object")
        value.forEach((v, i) => check(v, s.items as Record<string, unknown>, `${path}[${i}]`));
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      const props = (s.properties ?? {}) as Record<string, Record<string, unknown>>;

      if (Array.isArray(s.required))
        for (const key of s.required as string[])
          if (!(key in obj)) errors.push({ path, message: `ขาด field ที่จำเป็น "${key}"` });

      for (const [key, v] of Object.entries(obj)) {
        if (props[key]) check(v, props[key], `${path}.${key}`);
        else if (s.additionalProperties === false)
          errors.push({
            path: `${path}.${key}`,
            message: "ไม่อนุญาต field นี้ (additionalProperties: false)",
          });
      }
    }
  };

  check(data, schema as Record<string, unknown>, "$");

  return errors;
}

/// Base64 ของข้อความ UTF-8 (ภาษาไทยได้)
export function base64Encode(text: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";

  for (const b of bytes) binary += String.fromCharCode(b);

  const encoded = btoa(binary);

  return urlSafe ? encoded.replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "") : encoded;
}

export function base64Decode(input: string, urlSafe = false): string {
  let text = input.trim().replace(/\s+/gu, "");

  if (urlSafe || /[-_]/u.test(text)) text = text.replace(/-/gu, "+").replace(/_/gu, "/");
  while (text.length % 4) text += "=";

  if (!/^[A-Za-z0-9+/]*={0,2}$/u.test(text)) throw new Error("ข้อความนี้ไม่ใช่ Base64");

  const binary = atob(text);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("ถอดได้แต่ผลลัพธ์ไม่ใช่ข้อความ UTF-8 (อาจเป็นไฟล์ไบนารี)");
  }
}

export function urlEncode(input: string, mode: "component" | "uri"): string {
  return mode === "uri" ? encodeURI(input) : encodeURIComponent(input);
}

export function urlDecode(input: string): string {
  try {
    return decodeURIComponent(input.replace(/\+/gu, " "));
  } catch {
    throw new Error("มีลำดับ % ที่ไม่ถูกต้อง เช่น %ZZ");
  }
}

export function parseUrl(input: string) {
  let url: URL;

  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("URL ไม่ถูกต้อง — ต้องมี scheme เช่น https://");
  }

  return {
    protocol: url.protocol,
    username: url.username,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: decodeURIComponent(url.pathname),
    search: url.search,
    hash: url.hash,
    origin: url.origin,
    params: [...url.searchParams.entries()],
  };
}

export function parseQueryString(input: string): [string, string][] {
  const text = input
    .trim()
    .replace(/^[^?]*\?/u, "")
    .replace(/#.*$/u, "");

  return [...new URLSearchParams(text).entries()];
}

export function buildQueryString(pairs: [string, string][]): string {
  return new URLSearchParams(pairs).toString();
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function htmlEscape(input: string): string {
  return input.replace(/[&<>"']/gu, (c) => HTML_ESCAPES[c]);
}

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  copy: "©",
  reg: "®",
  trade: "™",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  laquo: "«",
  raquo: "»",
};

/// ถอด entity โดยไม่ใส่ HTML ลง DOM (กัน XSS)
export function htmlUnescape(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu, (whole, body: string) => {
    if (body[0] === "#") {
      const code =
        body[1].toLowerCase() === "x" ? Number.parseInt(body.slice(2), 16) : Number(body.slice(1));

      return Number.isFinite(code) && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }

    return NAMED[body.toLowerCase()] ?? whole;
  });
}

export function decodeJwt(token: string) {
  const parts = token.trim().split(".");

  if (parts.length < 2 || parts.length > 3)
    throw new Error("JWT ต้องมี 2–3 ส่วนคั่นด้วยจุด (header.payload.signature)");

  const decodePart = (part: string, name: string) => {
    try {
      return JSON.parse(base64Decode(part, true)) as Record<string, unknown>;
    } catch {
      throw new Error(`ถอด ${name} ไม่ได้ — ไม่ใช่ Base64URL ของ JSON`);
    }
  };

  const header = decodePart(parts[0], "header");
  const payload = decodePart(parts[1], "payload");
  const times: { claim: string; at: string }[] = [];

  for (const claim of ["iat", "nbf", "exp"]) {
    const v = payload[claim];

    if (typeof v === "number") times.push({ claim, at: new Date(v * 1000).toISOString() });
  }

  const exp = typeof payload.exp === "number" ? payload.exp * 1000 : null;

  return {
    header,
    payload,
    times,
    expired: exp !== null ? exp < Date.now() : null,
    signed: parts.length === 3 && parts[2] !== "",
  };
}

export function regexEscape(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\/-]/gu, "\\$&");
}

export function testRegex(pattern: string, flags: string, text: string) {
  let regex: RegExp;

  try {
    regex = new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`);
  } catch (error) {
    throw new Error(
      `Regular expression ไม่ถูกต้อง: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }

  const matches: { start: number; end: number; text: string; groups: string[] }[] = [];

  for (const m of text.matchAll(regex)) {
    if (m.index === undefined) continue;
    matches.push({
      start: m.index,
      end: m.index + m[0].length,
      text: m[0],
      groups: m.slice(1).map((g) => g ?? ""),
    });
    if (matches.length >= 1000) break;
    if (m[0] === "" && !regex.flags.includes("u")) regex.lastIndex++;
  }

  return matches;
}

export function minifyCss(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//gu, "")
    .replace(/\s+/gu, " ")
    .replace(/\s*([{}:;,>+~])\s*/gu, "$1")
    .replace(/;\}/gu, "}")
    .trim();
}

const SQL_BREAK = [
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP BY",
  "ORDER BY",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "INSERT INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE FROM",
  "LEFT JOIN",
  "RIGHT JOIN",
  "INNER JOIN",
  "FULL JOIN",
  "CROSS JOIN",
  "JOIN",
  "UNION ALL",
  "UNION",
  "RETURNING",
  "ON CONFLICT",
];
const SQL_KEYWORDS = [
  "AND",
  "OR",
  "NOT",
  "NULL",
  "IS",
  "IN",
  "AS",
  "ON",
  "BY",
  "DISTINCT",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "LIKE",
  "ILIKE",
  "BETWEEN",
  "EXISTS",
  "ASC",
  "DESC",
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "CREATE",
  "TABLE",
  "PRIMARY",
  "KEY",
  "DEFAULT",
  "WITH",
];

/// จัดรูปแบบ SQL เบื้องต้น: clause หลักขึ้นบรรทัดใหม่ · keyword ตัวพิมพ์ใหญ่ · ไม่แตะข้อความในเครื่องหมายคำพูด
export function formatSql(input: string): string {
  const pieces = input.split(/('(?:[^']|'')*'|"(?:[^"]|"")*")/u);
  const formatted = pieces
    .map((piece, index) => {
      if (index % 2 === 1) return piece;

      let text = piece.replace(/\s+/gu, " ");

      for (const keyword of [...SQL_BREAK, ...SQL_KEYWORDS].sort((a, b) => b.length - a.length)) {
        text = text.replace(new RegExp(`\\b${keyword.replace(" ", "\\s+")}\\b`, "giu"), keyword);
      }

      for (const clause of SQL_BREAK)
        text = text.replace(new RegExp(`\\s*\\b${clause}\\b`, "gu"), `\n${clause}`);

      return text.replace(/,\s*/gu, ",\n  ").replace(/\b(AND|OR)\b/gu, "\n  $1");
    })
    .join("");

  return formatted
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l, i) => l.trim() || i > 0)
    .join("\n")
    .trim();
}

/// จัดรูปแบบ XML — ตรวจแท็กเปิด/ปิดให้ตรงกันด้วย
export function formatXml(input: string, indent = 2): string {
  const tokens = input
    .replace(/>\s+</gu, "><")
    .trim()
    .match(/<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<![^>]*>|<[^>]+>|[^<]+/gu);

  if (!tokens) throw new Error("กรุณาวาง XML");

  const stack: string[] = [];
  const lines: string[] = [];
  const pad = () => " ".repeat(stack.length * indent);

  for (const token of tokens) {
    if (/^<\//u.test(token)) {
      const name = token.slice(2, -1).trim();
      const open = stack.pop();

      if (open !== name) throw new Error(`แท็กปิด </${name}> ไม่ตรงกับแท็กเปิด <${open ?? "?"}>`);
      lines.push(pad() + token);
    } else if (/^<[^!?][^>]*[^/]>$|^<[a-zA-Z][^>]*>$/u.test(token) && !token.endsWith("/>")) {
      lines.push(pad() + token);
      stack.push(token.slice(1).split(/[\s>/]/u)[0]);
    } else {
      const text = token.trim();

      if (!text) continue;
      // ข้อความสั้นอยู่บรรทัดเดียวกับแท็ก
      if (
        !token.startsWith("<") &&
        lines.length &&
        /^\s*<[^/!?][^>]*>$/u.test(lines[lines.length - 1]) &&
        text.length < 60
      ) {
        lines[lines.length - 1] += text;
        continue;
      }
      lines.push(pad() + text);
    }
  }

  if (stack.length) throw new Error(`แท็ก <${stack[stack.length - 1]}> ยังไม่ปิด`);

  // รวมแท็กปิดที่ตามข้อความสั้นให้อยู่บรรทัดเดียว
  const out: string[] = [];

  for (const line of lines) {
    const prev = out[out.length - 1];

    if (prev && /^\s*<\//u.test(line) && /^\s*<[^/!?][^>]*>[^<]+$/u.test(prev))
      out[out.length - 1] = prev + line.trim();
    else out.push(line);
  }

  return out.join("\n");
}

export function uuidInfo(input: string) {
  const value = input.trim().toLowerCase();
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u.test(value);

  if (!valid) return { valid: false as const };

  const version = Number.parseInt(value[14], 16);
  const variantNibble = Number.parseInt(value[19], 16);
  const variant =
    variantNibble >= 8 && variantNibble <= 0xb
      ? "RFC 4122 / 9562"
      : variantNibble < 8
        ? "NCS (เก่า)"
        : "Microsoft/สำรอง";
  const nil = value === "00000000-0000-0000-0000-000000000000";
  let timestamp: string | null = null;

  if (version === 7)
    timestamp = new Date(Number.parseInt(value.replace(/-/gu, "").slice(0, 12), 16)).toISOString();

  return { valid: true as const, version, variant, nil, timestamp };
}
