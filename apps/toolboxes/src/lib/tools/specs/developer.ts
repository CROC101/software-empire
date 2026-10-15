import {
  Binary,
  Braces,
  Code,
  FileCode2,
  FileJson,
  FileType,
  Fingerprint,
  Hash,
  Link2,
  ListTree,
  Regex,
  ScanSearch,
  ShieldCheck,
  Table2,
  TextSearch,
  Unlink,
} from "lucide-react";
import { checkbox, limit, number, out, row, select, text, textarea } from "../fields";
import {
  base64Decode,
  base64Encode,
  decodeJwt,
  formatJson,
  formatSql,
  formatXml,
  htmlEscape,
  htmlUnescape,
  jsonLines,
  minifyCss,
  parseJson,
  parseQueryString,
  parseUrl,
  queryJson,
  regexEscape,
  testRegex,
  urlDecode,
  urlEncode,
  uuidInfo,
  validateJsonSchema,
} from "../impl/developer";
import { parseYaml, toYaml } from "../impl/yaml";
import { str, num, bool, type SpecTool } from "../types";

const json = (value: unknown) => JSON.stringify(value, null, 2);

/// ชนิด TypeScript จากตัวอย่าง JSON (เดาจากค่า — ไม่ใช่ schema จริง)
export function jsonToTypescript(input: string, rootName: string): string {
  const interfaces: string[] = [];
  const seen = new Map<string, string>();
  const pascal = (s: string) =>
    s
      .replace(/(^|[^a-zA-Z0-9]+)([a-zA-Z0-9])/gu, (_, __, c: string) => c.toUpperCase())
      .replace(/^[^a-zA-Z_]/u, "_$&") || "Item";

  const typeOf = (value: unknown, name: string): string => {
    if (value === null) return "null";
    if (Array.isArray(value)) {
      if (!value.length) return "unknown[]";

      const types = [
        ...new Set(value.map((v) => typeOf(v, name.replace(/s$/u, "") || `${name}Item`))),
      ];

      return types.length === 1 ? `${types[0]}[]` : `(${types.join(" | ")})[]`;
    }
    if (typeof value === "object") {
      const body = Object.entries(value as Record<string, unknown>)
        .map(
          ([k, v]) =>
            `  ${/^[a-zA-Z_$][\w$]*$/u.test(k) ? k : JSON.stringify(k)}: ${typeOf(v, pascal(k))};`,
        )
        .join("\n");
      const known = seen.get(body);

      if (known) return known;

      let typeName = pascal(name);

      while (interfaces.some((i) => i.startsWith(`export interface ${typeName} `))) typeName += "2";
      seen.set(body, typeName);
      interfaces.push(`export interface ${typeName} {\n${body}\n}`);

      return typeName;
    }

    return typeof value;
  };

  const root = typeOf(parseJson(input), rootName || "Root");

  if (!interfaces.length) return `export type ${pascal(rootName || "Root")} = ${root};`;

  return interfaces.reverse().join("\n\n");
}

/// สิทธิ์ไฟล์ Unix (chmod) ↔ rwx
export function chmodInfo(input: string) {
  const text = input.trim();
  let octal: string;

  if (/^[0-7]{3,4}$/u.test(text)) octal = text.slice(-3);
  else if (/^[-rwx]{9}$/u.test(text)) {
    octal = [0, 3, 6]
      .map(
        (i) =>
          (text[i] === "r" ? 4 : 0) + (text[i + 1] === "w" ? 2 : 0) + (text[i + 2] === "x" ? 1 : 0),
      )
      .join("");
  } else throw new Error("กรอกเลขฐานแปด 3–4 หลัก (เช่น 755) หรือ rwx 9 ตัว (เช่น rwxr-xr-x)");

  const who = ["เจ้าของ (u)", "กลุ่ม (g)", "คนอื่น (o)"];
  const symbolic = [...octal].map((d) => {
    const n = Number(d);

    return `${n & 4 ? "r" : "-"}${n & 2 ? "w" : "-"}${n & 1 ? "x" : "-"}`;
  });

  return {
    octal,
    symbolic: symbolic.join(""),
    command: `chmod ${octal} <ไฟล์>`,
    rows: who.map((w, i) => [
      w,
      symbolic[i],
      [
        symbolic[i][0] === "r" && "อ่าน",
        symbolic[i][1] === "w" && "เขียน",
        symbolic[i][2] === "x" && "รัน/เข้าโฟลเดอร์",
      ]
        .filter(Boolean)
        .join(" · ") || "ไม่มีสิทธิ์",
    ]),
  };
}

export const developerTools: SpecTool[] = [
  {
    kind: "spec",
    slug: "json-formatter",
    name: "จัดรูปแบบและตรวจ JSON",
    description: "ตรวจ syntax พร้อมบอกบรรทัดที่ผิด จัดให้อ่านง่าย ย่อ หรือเรียง key",
    category: "developer",
    icon: Braces,
    keywords: ["json", "format", "beautify", "minify", "validate", "prettify"],
    live: true,
    fields: [
      textarea("input", "JSON", { placeholder: '{"name":"CS Toolboxes","tools":100}', rows: 12 }),
      select("mode", "รูปแบบ", [
        ["pretty", "อ่านง่าย"],
        ["minify", "ย่อบรรทัดเดียว"],
        ["sort", "อ่านง่าย + เรียง key"],
      ]),
      select("indent", "ย่อหน้า", [
        ["2", "2 ช่อง"],
        ["4", "4 ช่อง"],
        ["1", "Tab"],
      ]),
    ],
    run: (v) => {
      const input = limit(str(v, "input"));

      if (!input.trim()) return out.text("");

      const result = formatJson(
        input,
        str(v, "mode") as "pretty" | "minify" | "sort",
        Number(str(v, "indent")),
      );

      return out.text(
        str(v, "indent") === "1"
          ? result.replace(/^( {1})+/gmu, (m) => "\t".repeat(m.length))
          : result,
        true,
        { filename: "formatted.json", mime: "application/json" },
      );
    },
  },
  {
    kind: "spec",
    slug: "json-path",
    name: "ค้นข้อมูลใน JSON (JSONPath)",
    description: "ดึงค่าจาก JSON ด้วย path เช่น $.users[*].name",
    category: "developer",
    icon: ListTree,
    keywords: ["jsonpath", "query", "jq"],
    live: true,
    fields: [
      textarea("input", "JSON", { placeholder: '{"users":[{"name":"มะลิ"},{"name":"ธนา"}]}' }),
      text("path", "JSONPath", {
        defaultValue: "$",
        mono: true,
        help: "รองรับ $ . [n] [*] .. และ [start:end]",
      }),
    ],
    run: (v) =>
      str(v, "input").trim()
        ? out.text(json(queryJson(limit(str(v, "input")), str(v, "path"))))
        : out.text(""),
  },
  {
    kind: "spec",
    slug: "json-schema-validator",
    name: "ตรวจ JSON ด้วย JSON Schema",
    description: "ตรวจว่าข้อมูลตรงกับ schema (type, required, enum, min/max, pattern …) หรือไม่",
    category: "developer",
    icon: ShieldCheck,
    keywords: ["schema", "validate", "json schema"],
    action: "ตรวจสอบ",
    fields: [
      textarea("data", "ข้อมูล JSON", { placeholder: '{"age": 20}' }),
      textarea("schema", "JSON Schema", {
        placeholder:
          '{"type":"object","required":["age"],"properties":{"age":{"type":"integer","minimum":0}}}',
      }),
    ],
    run: (v) => {
      const errors = validateJsonSchema(limit(str(v, "data")), limit(str(v, "schema")));

      return errors.length
        ? out.table(
            ["ตำแหน่ง", "ปัญหา"],
            errors.map((e) => [e.path, e.message]),
            `พบ ${errors.length} ปัญหา`,
          )
        : out.rows([row("ผล", "ข้อมูลตรงกับ schema")]);
    },
  },
  {
    kind: "spec",
    slug: "json-lines",
    name: "แปลง JSON Lines ↔ JSON Array",
    description: "แปลงไฟล์ .jsonl (หนึ่งบรรทัดหนึ่ง object) กับ JSON array ไปมา",
    category: "developer",
    icon: FileJson,
    keywords: ["jsonl", "ndjson"],
    live: true,
    fields: [
      textarea("input", "ข้อมูล"),
      select("direction", "ทิศทาง", [
        ["to-array", "JSON Lines → Array"],
        ["to-lines", "Array → JSON Lines"],
      ]),
    ],
    run: (v) =>
      str(v, "input").trim()
        ? out.text(
            jsonLines(limit(str(v, "input")), str(v, "direction") as "to-array" | "to-lines"),
          )
        : out.text(""),
  },
  {
    kind: "spec",
    slug: "json-to-typescript",
    name: "JSON เป็น TypeScript interface",
    description: "สร้าง interface จากตัวอย่าง JSON (เดาชนิดจากค่าตัวอย่าง)",
    category: "developer",
    icon: FileType,
    keywords: ["typescript", "interface", "type", "ts"],
    live: true,
    fields: [
      textarea("input", "ตัวอย่าง JSON", { placeholder: '{"id":1,"name":"มะลิ","tags":["a"]}' }),
      text("root", "ชื่อ type หลัก", { defaultValue: "Root", mono: true }),
    ],
    run: (v) =>
      str(v, "input").trim()
        ? out.text(jsonToTypescript(limit(str(v, "input")), str(v, "root")), true, {
            filename: "types.ts",
            mime: "text/plain",
          })
        : out.text(""),
  },
  {
    kind: "spec",
    slug: "yaml-json",
    name: "แปลง YAML ↔ JSON",
    description: "แปลงไฟล์ตั้งค่า YAML เป็น JSON และกลับกัน",
    category: "developer",
    icon: FileCode2,
    keywords: ["yaml", "yml", "json", "convert"],
    live: true,
    fields: [
      textarea("input", "ข้อมูล", {
        placeholder: "name: CS Toolboxes\ntools:\n  - json\n  - yaml",
      }),
      select("direction", "ทิศทาง", [
        ["yaml-json", "YAML → JSON"],
        ["json-yaml", "JSON → YAML"],
      ]),
    ],
    run: (v) => {
      const input = limit(str(v, "input"));

      if (!input.trim()) return out.text("");

      return str(v, "direction") === "yaml-json"
        ? out.text(json(parseYaml(input)))
        : out.text(toYaml(parseJson(input)));
    },
  },
  {
    kind: "spec",
    slug: "base64",
    name: "Base64 เข้ารหัส/ถอดรหัส",
    description: "แปลงข้อความ (UTF-8 รองรับภาษาไทย) เป็น Base64 และกลับกัน",
    category: "developer",
    icon: Binary,
    keywords: ["base64", "encode", "decode", "btoa", "atob"],
    live: true,
    fields: [
      textarea("input", "ข้อความ"),
      select("mode", "การทำงาน", [
        ["encode", "เข้ารหัส"],
        ["decode", "ถอดรหัส"],
      ]),
      checkbox("urlSafe", "แบบ URL-safe (- _ ไม่มี =)"),
    ],
    run: (v) => {
      const input = limit(str(v, "input"));

      if (!input) return out.text("");

      return out.text(
        str(v, "mode") === "encode"
          ? base64Encode(input, bool(v, "urlSafe"))
          : base64Decode(input, bool(v, "urlSafe")),
      );
    },
  },
  {
    kind: "spec",
    slug: "url-encoder",
    name: "เข้ารหัสและถอดรหัส URL",
    description: "percent-encoding สำหรับใส่ข้อความไทยหรือสัญลักษณ์ใน URL",
    category: "developer",
    icon: Link2,
    keywords: ["url", "encode", "decode", "percent", "encodeURIComponent"],
    live: true,
    fields: [
      textarea("input", "ข้อความหรือ URL", { rows: 5 }),
      select("mode", "การทำงาน", [
        ["component", "เข้ารหัสส่วนประกอบ (encodeURIComponent)"],
        ["uri", "เข้ารหัสทั้ง URL (encodeURI)"],
        ["decode", "ถอดรหัส"],
      ]),
    ],
    run: (v) => {
      const input = limit(str(v, "input"));

      if (!input) return out.text("");

      return out.text(
        str(v, "mode") === "decode"
          ? urlDecode(input)
          : urlEncode(input, str(v, "mode") as "component" | "uri"),
      );
    },
  },
  {
    kind: "spec",
    slug: "url-parser",
    name: "แยกส่วนประกอบ URL",
    description: "ดู protocol, host, path, query และ hash ของ URL แยกเป็นช่อง",
    category: "developer",
    icon: Unlink,
    keywords: ["url", "parse", "query", "host"],
    live: true,
    fields: [
      text("input", "URL", {
        placeholder: "https://example.com:8080/path?q=ค้นหา#top",
        mono: true,
      }),
    ],
    run: (v) => {
      if (!str(v, "input").trim()) return out.rows([]);

      const u = parseUrl(str(v, "input"));

      return out.rows([
        row("protocol", u.protocol, true),
        u.username && row("username", u.username, true),
        row("host", u.host, true),
        u.port && row("port", u.port, true),
        row("pathname", u.pathname, true),
        u.search && row("search", u.search, true),
        u.hash && row("hash", u.hash, true),
        row("origin", u.origin, true),
        ...u.params.map(([k, val]) => row(`?${k}`, val, true)),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "query-string-parser",
    name: "แปลง Query String ↔ JSON",
    description: "แยก a=1&b=2 เป็น JSON หรือสร้าง query string จาก JSON object",
    category: "developer",
    icon: TextSearch,
    keywords: ["query", "querystring", "params", "search params"],
    live: true,
    fields: [
      textarea("input", "ข้อมูล", { rows: 5, placeholder: "name=มะลิ&tags=a&tags=b" }),
      select("direction", "ทิศทาง", [
        ["to-json", "Query → JSON"],
        ["to-query", "JSON → Query"],
      ]),
    ],
    run: (v) => {
      const input = limit(str(v, "input")).trim();

      if (!input) return out.text("");
      if (str(v, "direction") === "to-json") {
        const result: Record<string, string | string[]> = {};

        for (const [k, val] of parseQueryString(input)) {
          const prev = result[k];

          result[k] = prev === undefined ? val : Array.isArray(prev) ? [...prev, val] : [prev, val];
        }

        return out.text(json(result));
      }

      const obj = parseJson(input);

      if (!obj || typeof obj !== "object" || Array.isArray(obj))
        throw new Error("ต้องเป็น JSON object");

      const params = new URLSearchParams();

      for (const [k, val] of Object.entries(obj as Record<string, unknown>))
        for (const item of Array.isArray(val) ? val : [val])
          params.append(k, typeof item === "string" ? item : JSON.stringify(item));

      return out.text(params.toString());
    },
  },
  {
    kind: "spec",
    slug: "html-entity",
    name: "HTML Entity เข้ารหัส/ถอดรหัส",
    description: 'แปลง < > & " เป็น entity เพื่อแสดงโค้ด HTML อย่างปลอดภัย และถอดกลับ',
    category: "developer",
    icon: Code,
    keywords: ["html", "entity", "escape", "unescape", "xss"],
    live: true,
    fields: [
      textarea("input", "ข้อความ", { rows: 6, placeholder: "<h1>Tom & Jerry</h1>" }),
      select("mode", "การทำงาน", [
        ["encode", "เข้ารหัส"],
        ["decode", "ถอดรหัส"],
      ]),
    ],
    run: (v) =>
      out.text(
        str(v, "mode") === "encode"
          ? htmlEscape(limit(str(v, "input")))
          : htmlUnescape(limit(str(v, "input"))),
      ),
  },
  {
    kind: "spec",
    slug: "jwt-decoder",
    name: "อ่านข้อมูล JWT",
    description:
      "ถอด header และ payload ดูเวลาหมดอายุ — ไม่ได้ตรวจลายเซ็น ใช้แทนการตรวจฝั่งเซิร์ฟเวอร์ไม่ได้",
    category: "developer",
    icon: Fingerprint,
    keywords: ["jwt", "token", "decode", "json web token"],
    live: true,
    fields: [
      textarea("input", "JWT", {
        rows: 5,
        placeholder: "header.payload.signature",
        help: "ถอดในเครื่องของคุณเท่านั้น ไม่ส่ง token ไปที่ใด",
      }),
    ],
    run: (v) => {
      if (!str(v, "input").trim()) return out.text("");

      const t = decodeJwt(str(v, "input"));
      const lines = [
        "// header",
        json(t.header),
        "",
        "// payload",
        json(t.payload),
        "",
        ...t.times.map((x) => `// ${x.claim}: ${new Date(x.at).toLocaleString("th-TH")}`),
        t.expired === null ? "// ไม่มี exp" : t.expired ? "// หมดอายุแล้ว" : "// ยังไม่หมดอายุ",
        t.signed ? "// มีลายเซ็น (ยังไม่ได้ตรวจ)" : "// ไม่มีลายเซ็น",
      ];

      return out.text(lines.join("\n"));
    },
  },
  {
    kind: "spec",
    slug: "regex-tester",
    name: "ทดลอง Regular Expression",
    description: "ไฮไลต์ข้อความที่ตรงกับ pattern พร้อมตำแหน่งและกลุ่มที่จับได้",
    category: "developer",
    icon: Regex,
    keywords: ["regex", "regexp", "regular expression", "pattern", "test"],
    live: true,
    fields: [
      text("pattern", "Pattern", { mono: true, placeholder: "\\d{3}-\\d{4}" }),
      text("flags", "Flags", { defaultValue: "gu", mono: true, help: "g i m s u y" }),
      textarea("text", "ข้อความที่ใช้ทดสอบ", { rows: 8 }),
    ],
    run: (v) => {
      const pattern = str(v, "pattern");
      const flags = str(v, "flags").replace(/[^gimsuyd]/gu, "");
      const textValue = limit(str(v, "text"), 200_000);

      if (!pattern) return { kind: "highlight", text: textValue, ranges: [], rows: [] };

      const matches = testRegex(pattern, [...new Set(flags)].join(""), textValue);

      return {
        kind: "highlight",
        text: textValue,
        ranges: matches.map((m) => ({ start: m.start, end: m.end })),
        rows: [
          row("จำนวนที่ตรง", matches.length),
          ...matches
            .slice(0, 50)
            .map((m, i) =>
              row(
                `#${i + 1} @${m.start}`,
                m.groups.length ? `${m.text}  →  (${m.groups.join(", ")})` : m.text,
                true,
              ),
            ),
        ],
      };
    },
  },
  {
    kind: "spec",
    slug: "regex-escape",
    name: "Escape ข้อความสำหรับ Regex",
    description: "ใส่ \\ หน้าอักขระพิเศษ เพื่อค้นหาข้อความตรงตัวด้วย RegExp",
    category: "developer",
    icon: ScanSearch,
    keywords: ["regex", "escape"],
    live: true,
    fields: [textarea("input", "ข้อความ", { rows: 4, placeholder: "ราคา (บาท) 1.5+" })],
    run: (v) => out.text(regexEscape(str(v, "input"))),
  },
  {
    kind: "spec",
    slug: "css-minifier",
    name: "ย่อไฟล์ CSS",
    description: "ลบคอมเมนต์ ช่องว่าง และ ; ที่ไม่จำเป็น บอกขนาดที่ลดได้",
    category: "developer",
    icon: FileCode2,
    keywords: ["css", "minify", "compress"],
    live: true,
    fields: [textarea("input", "CSS", { rows: 12 })],
    run: (v) => {
      const input = limit(str(v, "input"));
      const result = minifyCss(input);
      const saved = input.length ? Math.round((1 - result.length / input.length) * 100) : 0;

      return out.text(
        input
          ? `${result}\n\n/* ${input.length.toLocaleString("th-TH")} → ${result.length.toLocaleString("th-TH")} ตัวอักษร (ลด ${saved}%) */`
          : "",
        true,
      );
    },
  },
  {
    kind: "spec",
    slug: "sql-formatter",
    name: "จัดรูปแบบ SQL",
    description: "ขึ้นบรรทัดใหม่ตาม clause และทำ keyword เป็นตัวพิมพ์ใหญ่ (รูปแบบพื้นฐาน)",
    category: "developer",
    icon: Table2,
    keywords: ["sql", "format", "beautify", "query"],
    live: true,
    fields: [
      textarea("input", "คำสั่ง SQL", {
        placeholder: "select id, name from students where gpa >= 3 order by name",
      }),
    ],
    run: (v) => out.text(formatSql(limit(str(v, "input")))),
  },
  {
    kind: "spec",
    slug: "xml-formatter",
    name: "จัดรูปแบบ XML",
    description: "จัดย่อหน้า XML ให้อ่านง่าย และตรวจว่าแท็กปิดครบ",
    category: "developer",
    icon: Code,
    keywords: ["xml", "format", "beautify", "svg"],
    live: true,
    fields: [textarea("input", "XML"), number("indent", "ย่อหน้า (ช่อง)", 2, { min: 1, max: 8 })],
    run: (v) =>
      out.text(
        str(v, "input").trim()
          ? formatXml(limit(str(v, "input")), num(v, "indent", "ย่อหน้า"))
          : "",
      ),
  },
  {
    kind: "spec",
    slug: "uuid-validator",
    name: "ตรวจและอ่าน UUID",
    description: "ตรวจรูปแบบ UUID บอกเวอร์ชัน variant และเวลาที่ฝังใน v7",
    category: "developer",
    icon: Hash,
    keywords: ["uuid", "guid", "validate"],
    live: true,
    fields: [text("input", "UUID", { mono: true, placeholder: "0190a7c2-..." })],
    run: (v) => {
      if (!str(v, "input").trim()) return out.rows([]);

      const info = uuidInfo(str(v, "input"));

      if (!info.valid) return out.rows([row("ผล", "ไม่ใช่ UUID ที่ถูกต้อง")]);

      return out.rows([
        row("ผล", "รูปแบบถูกต้อง"),
        row("เวอร์ชัน", info.nil ? "Nil UUID" : `v${info.version}`),
        row("Variant", info.variant),
        info.timestamp && row("เวลาที่สร้าง", new Date(info.timestamp).toLocaleString("th-TH")),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "markdown-preview",
    name: "ดูตัวอย่าง Markdown",
    description: "พิมพ์ Markdown แล้วเห็นผลทันที (หัวข้อ ตาราง รายการ โค้ด ลิงก์)",
    category: "developer",
    icon: FileType,
    keywords: ["markdown", "md", "preview", "readme"],
    live: true,
    fields: [
      textarea("input", "Markdown", {
        rows: 14,
        defaultValue:
          "# หัวข้อ\n\nข้อความ **ตัวหนา** และ `โค้ด`\n\n- รายการ 1\n- รายการ 2\n\n| คอลัมน์ | ค่า |\n|---|---|\n| A | 1 |",
      }),
    ],
    run: (v) => out.markdown(limit(str(v, "input"), 300_000)),
  },
  {
    kind: "spec",
    slug: "chmod-calculator",
    name: "คำนวณสิทธิ์ไฟล์ chmod",
    description: "แปลงเลข 755 ↔ rwxr-xr-x พร้อมอธิบายสิทธิ์ของแต่ละกลุ่ม",
    category: "developer",
    icon: ShieldCheck,
    keywords: ["chmod", "permission", "unix", "linux", "rwx"],
    live: true,
    fields: [
      text("input", "สิทธิ์", {
        defaultValue: "755",
        mono: true,
        help: "เลขฐานแปด หรือ rwx 9 ตัว",
      }),
    ],
    run: (v) => {
      const info = chmodInfo(str(v, "input"));

      return out.table(
        ["กลุ่ม", "rwx", "ความหมาย"],
        info.rows,
        `${info.octal} = ${info.symbolic} · ${info.command}`,
      );
    },
  },
];
