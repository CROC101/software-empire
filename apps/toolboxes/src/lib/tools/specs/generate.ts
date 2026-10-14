import {
  Dices,
  FileText,
  Fingerprint,
  KeyRound,
  KeySquare,
  Lock,
  QrCode,
  ShieldCheck,
  Shuffle,
  TableProperties,
  Timer,
  Type,
  UserRoundCog,
} from "lucide-react";
import { checkbox, color, limit, number, out, row, select, text, textarea } from "../fields";
import {
  fakeRecords,
  loremIpsum,
  randomNumbers,
  randomStrings,
  uuidV4,
  uuidV7,
} from "../impl/generate";
import {
  CHARSETS,
  generatePassword,
  hashBytes,
  hmac,
  passwordStrength,
  randomToken,
  totp,
  type HashAlgorithm,
} from "../impl/security";
import { bool, num, str, type SpecTool } from "../types";

const count = (v: Parameters<SpecTool["run"]>[0], max: number) => {
  const n = num(v, "count", "จำนวน");

  if (!Number.isInteger(n) || n < 1 || n > max) throw new Error(`จำนวนต้องอยู่ระหว่าง 1–${max}`);

  return n;
};

export const generatorTools: SpecTool[] = [
  {
    kind: "spec",
    slug: "uuid-generator",
    name: "สร้าง UUID",
    description: "สร้าง UUID v4 (สุ่ม) หรือ v7 (เรียงตามเวลา เหมาะเป็น primary key) ครั้งละหลายตัว",
    category: "generator",
    icon: Fingerprint,
    keywords: ["uuid", "guid", "v4", "v7", "id"],
    random: true,
    action: "สร้าง",
    fields: [
      select("version", "เวอร์ชัน", [
        ["v4", "v4 (สุ่ม)"],
        ["v7", "v7 (เรียงตามเวลา)"],
      ]),
      number("count", "จำนวน", 5, { min: 1, max: 500 }),
      checkbox("upper", "ตัวพิมพ์ใหญ่"),
      checkbox("noHyphen", "ไม่มีขีด"),
    ],
    run: (v) => {
      const list = Array.from({ length: count(v, 500) }, () =>
        str(v, "version") === "v7" ? uuidV7() : uuidV4(),
      ).map((id) => {
        const s = bool(v, "noHyphen") ? id.replace(/-/gu, "") : id;

        return bool(v, "upper") ? s.toUpperCase() : s;
      });

      return out.text(list.join("\n"), true, { filename: "uuids.txt", mime: "text/plain" });
    },
  },
  {
    kind: "spec",
    slug: "password-generator",
    name: "สร้างรหัสผ่านที่ปลอดภัย",
    description: "สุ่มด้วย Web Crypto (ไม่ใช่ Math.random) รับประกันว่ามีครบทุกชุดตัวอักษรที่เลือก",
    category: "security",
    icon: KeyRound,
    keywords: ["password", "generator", "random", "รหัสผ่าน"],
    random: true,
    action: "สร้าง",
    fields: [
      number("length", "ความยาว", 20, { min: 6, max: 128 }),
      number("count", "จำนวน", 5, { min: 1, max: 50 }),
      checkbox("upper", "ตัวพิมพ์ใหญ่ A–Z", true),
      checkbox("lower", "ตัวพิมพ์เล็ก a–z", true),
      checkbox("digits", "ตัวเลข 0–9", true),
      checkbox("symbols", `สัญลักษณ์ ${CHARSETS.symbols.slice(0, 10)}…`, true),
      checkbox("avoidAmbiguous", "ไม่ใช้ตัวที่สับสนง่าย (O 0 I l 1)"),
    ],
    run: (v) => {
      const options = {
        length: num(v, "length", "ความยาว"),
        upper: bool(v, "upper"),
        lower: bool(v, "lower"),
        digits: bool(v, "digits"),
        symbols: bool(v, "symbols"),
        avoidAmbiguous: bool(v, "avoidAmbiguous"),
      };
      const list = Array.from({ length: count(v, 50) }, () => generatePassword(options));
      const strength = passwordStrength(list[0]);

      return out.text(
        list.join("\n"),
        true,
        undefined,
        `ความแข็งแรง: ${strength.label} · เอนโทรปีราว ${strength.entropy} บิต`,
      );
    },
  },
  {
    kind: "spec",
    slug: "random-number",
    name: "สุ่มตัวเลข",
    description: "สุ่มตัวเลขในช่วงที่กำหนด แบบซ้ำหรือไม่ซ้ำ มีทศนิยมได้",
    category: "generator",
    icon: Dices,
    keywords: ["random number", "rng", "สุ่มเลข", "lottery"],
    random: true,
    action: "สุ่ม",
    fields: [
      number("min", "ต่ำสุด", 1),
      number("max", "สูงสุด", 100),
      number("count", "จำนวน", 1, { min: 1, max: 1000 }),
      number("decimals", "ทศนิยม (ตำแหน่ง)", 0, { min: 0, max: 6 }),
      checkbox("unique", "ไม่ซ้ำกัน"),
      checkbox("sort", "เรียงจากน้อยไปมาก"),
    ],
    run: (v) => {
      const list = randomNumbers({
        min: num(v, "min", "ค่าต่ำสุด"),
        max: num(v, "max", "ค่าสูงสุด"),
        count: count(v, 1000),
        unique: bool(v, "unique"),
        decimals: num(v, "decimals", "ทศนิยม"),
      });

      if (bool(v, "sort")) list.sort((a, b) => a - b);

      return out.text(list.join(list.length > 20 ? "\n" : ", "));
    },
  },
  {
    kind: "spec",
    slug: "random-string",
    name: "สุ่มข้อความ / รหัส",
    description: "สุ่มสตริงจากชุดตัวอักษรที่เลือก เช่น รหัสคูปอง รหัสห้อง",
    category: "generator",
    icon: Shuffle,
    keywords: ["random string", "code", "coupon", "สุ่ม"],
    random: true,
    action: "สุ่ม",
    fields: [
      number("length", "ความยาว", 8, { min: 1, max: 1024 }),
      number("count", "จำนวน", 10, { min: 1, max: 500 }),
      select("charset", "ชุดตัวอักษร", [
        ["alnum", "A–Z a–z 0–9"],
        ["upper-digit", "A–Z 0–9"],
        ["digits", "0–9"],
        ["hex", "0–9 a–f"],
        ["custom", "กำหนดเอง"],
      ]),
      text("custom", "ตัวอักษรที่กำหนดเอง", {
        mono: true,
        placeholder: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
        when: { key: "charset", in: ["custom"] },
      }),
    ],
    run: (v) => {
      const sets: Record<string, string> = {
        alnum: CHARSETS.upper + CHARSETS.lower + CHARSETS.digits,
        "upper-digit": CHARSETS.upper + CHARSETS.digits,
        digits: CHARSETS.digits,
        hex: "0123456789abcdef",
        custom: str(v, "custom"),
      };

      return out.text(
        randomStrings({
          length: num(v, "length", "ความยาว"),
          count: count(v, 500),
          charset: sets[str(v, "charset")] ?? "",
        }).join("\n"),
      );
    },
  },
  {
    kind: "spec",
    slug: "lorem-ipsum",
    name: "สร้างข้อความตัวอย่าง (Lorem Ipsum)",
    description: "ข้อความจำลองภาษาอังกฤษหรือไทยสำหรับวางเลย์เอาต์",
    category: "generator",
    icon: Type,
    keywords: ["lorem", "ipsum", "placeholder", "dummy text", "ข้อความตัวอย่าง"],
    random: true,
    action: "สร้าง",
    fields: [
      select("language", "ภาษา", [
        ["en", "Lorem ipsum (ละติน)"],
        ["th", "ภาษาไทย"],
      ]),
      number("paragraphs", "จำนวนย่อหน้า", 3, { min: 1, max: 50 }),
      number("sentences", "ประโยคต่อย่อหน้า", 4, { min: 1, max: 20 }),
    ],
    run: (v) =>
      out.text(
        loremIpsum({
          language: str(v, "language") as "en" | "th",
          paragraphs: num(v, "paragraphs", "จำนวนย่อหน้า"),
          sentences: num(v, "sentences", "จำนวนประโยค"),
        }),
        false,
      ),
  },
  {
    kind: "spec",
    slug: "test-data-generator",
    name: "สร้างข้อมูลทดสอบ",
    description:
      "ข้อมูลสังเคราะห์สำหรับทดสอบโปรแกรม (ชื่อสมมติ อีเมล example.com เบอร์ 099-999) เป็น JSON หรือ CSV",
    category: "generator",
    icon: TableProperties,
    keywords: ["fake data", "mock", "seed", "test data", "ข้อมูลทดสอบ"],
    random: true,
    action: "สร้าง",
    fields: [
      number("count", "จำนวนแถว", 10, { min: 1, max: 500 }),
      select("format", "รูปแบบ", [
        ["json", "JSON"],
        ["csv", "CSV"],
      ]),
      checkbox("id", "id", true),
      checkbox("uuid", "uuid"),
      checkbox("name", "name", true),
      checkbox("email", "email", true),
      checkbox("phone", "phone"),
      checkbox("city", "city"),
      checkbox("age", "age"),
      checkbox("score", "score"),
      checkbox("date", "date"),
      checkbox("studentCode", "studentCode"),
    ],
    run: (v) => {
      const fields = [
        "id",
        "uuid",
        "name",
        "email",
        "phone",
        "city",
        "age",
        "score",
        "date",
        "studentCode",
      ].filter((f) => bool(v, f));

      if (!fields.length) throw new Error("เลือกอย่างน้อย 1 ฟิลด์");

      const records = fakeRecords(count(v, 500), fields);

      if (str(v, "format") === "json")
        return out.text(
          JSON.stringify(records, null, 2),
          true,
          { filename: "test-data.json", mime: "application/json" },
          "ข้อมูลสังเคราะห์ — ห้ามใช้แทนข้อมูลจริง",
        );

      const csv = [
        fields.join(","),
        ...records.map((r) =>
          fields.map((f) => `"${String(r[f]).replace(/"/gu, '""')}"`).join(","),
        ),
      ].join("\n");

      return out.text(
        csv,
        true,
        { filename: "test-data.csv", mime: "text/csv" },
        "ข้อมูลสังเคราะห์ — ห้ามใช้แทนข้อมูลจริง",
      );
    },
  },
  {
    kind: "spec",
    slug: "qr-code-generator",
    name: "สร้าง QR Code",
    description: "สร้าง QR จากข้อความ ลิงก์ หรือ Wi-Fi ปรับสีและขนาด ดาวน์โหลดเป็น PNG/SVG",
    category: "generator",
    icon: QrCode,
    keywords: ["qr", "qrcode", "barcode", "wifi"],
    live: true,
    fields: [
      select("type", "ชนิด", [
        ["text", "ข้อความ / ลิงก์"],
        ["wifi", "Wi-Fi"],
        ["email", "อีเมล"],
        ["tel", "เบอร์โทร"],
      ]),
      textarea("value", "ข้อความ / ลิงก์ / อีเมล / เบอร์", {
        rows: 3,
        mono: false,
        defaultValue: "https://example.com",
        when: { key: "type", in: ["text", "email", "tel"] },
      }),
      text("ssid", "ชื่อ Wi-Fi (SSID)", { when: { key: "type", in: ["wifi"] } }),
      {
        key: "wifiPassword",
        label: "รหัส Wi-Fi",
        kind: "password",
        help: "อยู่ในเครื่องคุณเท่านั้น ไม่ถูกบันทึกหรือส่งออก",
        when: { key: "type", in: ["wifi"] },
      },
      select(
        "security",
        "การเข้ารหัส Wi-Fi",
        [
          ["WPA", "WPA/WPA2/WPA3"],
          ["WEP", "WEP"],
          ["nopass", "ไม่มีรหัส"],
        ],
        "WPA",
        { when: { key: "type", in: ["wifi"] } },
      ),
      number("size", "ขนาด (px)", 256, { min: 96, max: 1024, step: 16 }),
      select("level", "ระดับแก้ไขข้อผิดพลาด", [
        ["M", "M (15%)"],
        ["L", "L (7%)"],
        ["Q", "Q (25%)"],
        ["H", "H (30%)"],
      ]),
      color("foreground", "สี QR", "rgb(22 38 77)"),
      color("background", "สีพื้น", "rgb(255 255 255)"),
    ],
    run: (v) => {
      const escapeWifi = (s: string) => s.replace(/([\\;,:"])/gu, "\\$1");
      const type = str(v, "type");
      const raw = limit(str(v, "value"), 2000).trim();
      let value = raw;

      if (type === "wifi") {
        if (!str(v, "ssid").trim()) throw new Error("กรอกชื่อ Wi-Fi");
        value = `WIFI:T:${str(v, "security")};S:${escapeWifi(str(v, "ssid"))};${str(v, "security") === "nopass" ? "" : `P:${escapeWifi(str(v, "wifiPassword"))};`};`;
      } else if (type === "email") value = `mailto:${raw}`;
      else if (type === "tel") value = `tel:${raw.replace(/[^\d+]/gu, "")}`;

      if (!value) throw new Error("กรอกข้อมูลที่จะทำเป็น QR");

      return {
        kind: "qr",
        value,
        size: num(v, "size", "ขนาด"),
        foreground: str(v, "foreground"),
        background: str(v, "background"),
        level: str(v, "level") as "L" | "M" | "Q" | "H",
      };
    },
  },
];

export const securityTools: SpecTool[] = [
  {
    kind: "spec",
    slug: "hash-generator",
    name: "สร้าง Hash ของข้อความ",
    description:
      "MD5, SHA-1, SHA-256, SHA-384, SHA-512 พร้อมกันทุกแบบ (MD5/SHA-1 ใช้ตรวจ checksum เท่านั้น ไม่ปลอดภัยสำหรับรหัสผ่าน)",
    category: "security",
    icon: Fingerprint,
    keywords: ["hash", "md5", "sha1", "sha256", "sha512", "checksum"],
    live: true,
    fields: [textarea("input", "ข้อความ", { rows: 6 }), checkbox("upper", "ตัวพิมพ์ใหญ่")],
    run: async (v) => {
      const bytes = new TextEncoder().encode(limit(str(v, "input"), 20_000_000));
      const algorithms: HashAlgorithm[] = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"];
      const hashes = await Promise.all(algorithms.map((a) => hashBytes(bytes, a)));

      return out.rows(
        algorithms.map((a, i) =>
          row(a, bool(v, "upper") ? hashes[i].toUpperCase() : hashes[i], true),
        ),
      );
    },
  },
  {
    kind: "spec",
    slug: "hmac-generator",
    name: "สร้าง HMAC",
    description:
      "ลายเซ็น HMAC-SHA ของข้อความด้วย secret (ใช้ตรวจ webhook) — secret ไม่ออกจากเครื่อง",
    category: "security",
    icon: KeySquare,
    keywords: ["hmac", "signature", "webhook", "sha256"],
    live: true,
    fields: [
      textarea("message", "ข้อความ", { rows: 5 }),
      { key: "secret", label: "Secret key", kind: "password", mono: true },
      select("algorithm", "อัลกอริทึม", ["SHA-256", "SHA-512", "SHA-384", "SHA-1"]),
    ],
    run: async (v) => {
      if (!str(v, "secret")) return out.rows([]);

      const r = await hmac(
        limit(str(v, "message")),
        str(v, "secret"),
        str(v, "algorithm") as "SHA-256",
      );

      return out.rows([row("Hex", r.hex, true), row("Base64", r.base64, true)]);
    },
  },
  {
    kind: "spec",
    slug: "totp-generator",
    name: "รหัส 2FA (TOTP)",
    description: "สร้างรหัส 6 หลักจาก secret แบบแอปยืนยันตัวตน ใช้ทดสอบระบบ 2FA ที่พัฒนาเอง",
    category: "security",
    icon: Timer,
    keywords: ["totp", "2fa", "otp", "authenticator", "mfa"],
    action: "สร้างรหัส",
    fields: [
      {
        key: "secret",
        label: "Secret (Base32)",
        kind: "password",
        mono: true,
        help: "อย่าใส่ secret ของบัญชีจริงในเครื่องที่ใช้ร่วมกับผู้อื่น",
      },
      select("digits", "จำนวนหลัก", [
        ["6", "6"],
        ["8", "8"],
      ]),
      select("period", "อายุรหัส", [
        ["30", "30 วินาที"],
        ["60", "60 วินาที"],
      ]),
      select("algorithm", "อัลกอริทึม", ["SHA-1", "SHA-256", "SHA-512"]),
    ],
    run: async (v) => {
      const r = await totp(str(v, "secret"), {
        digits: Number(str(v, "digits")),
        period: Number(str(v, "period")),
        algorithm: str(v, "algorithm") as "SHA-1",
      });

      return out.rows([
        row("รหัส", r.code, true),
        row("หมดอายุใน", `${r.remaining} วินาที (กดสร้างใหม่เมื่อหมด)`),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "password-strength-checker",
    name: "ตรวจความแข็งแรงของรหัสผ่าน",
    description: "ประเมินเอนโทรปีและรูปแบบที่เดาง่าย — ตรวจในเครื่องเท่านั้น ไม่ส่งรหัสไปที่ใด",
    category: "security",
    icon: ShieldCheck,
    keywords: ["password strength", "entropy", "รหัสผ่าน"],
    live: true,
    fields: [{ key: "password", label: "รหัสผ่าน", kind: "password", mono: true }],
    run: (v) => {
      if (!str(v, "password")) return out.rows([]);

      const s = passwordStrength(str(v, "password"));

      return out.rows(
        [
          row("ระดับ", `${s.label} (${s.score}/4)`),
          row("เอนโทรปี", `ราว ${s.entropy} บิต`),
          row("เวลาเดาแบบออฟไลน์", s.crackTime),
          ...s.issues.map((issue) => row("ควรปรับ", issue)),
        ],
        "ประมาณจากการเดา 10,000 ล้านครั้ง/วินาที — ใช้เป็นแนวทาง ไม่ใช่การรับรอง",
      );
    },
  },
  {
    kind: "spec",
    slug: "secure-token-generator",
    name: "สร้าง Secret / Token",
    description:
      "สุ่ม secret สำหรับ API key, session secret หรือ JWT secret แบบ hex, base64url, base32",
    category: "security",
    icon: Lock,
    keywords: ["token", "secret", "api key", "random bytes", "openssl rand"],
    random: true,
    action: "สร้าง",
    fields: [
      select("bits", "ความยาว", [
        ["256", "256 บิต (32 ไบต์)"],
        ["128", "128 บิต"],
        ["192", "192 บิต"],
        ["384", "384 บิต"],
        ["512", "512 บิต"],
        ["64", "64 บิต"],
      ]),
      select("format", "รูปแบบ", [
        ["hex", "Hex"],
        ["base64url", "Base64URL"],
        ["base32", "Base32 (ใช้กับ TOTP)"],
      ]),
      number("count", "จำนวน", 1, { min: 1, max: 20 }),
    ],
    run: (v) =>
      out.text(
        Array.from({ length: count(v, 20) }, () =>
          randomToken(Number(str(v, "bits")), str(v, "format") as "hex"),
        ).join("\n"),
      ),
  },
  {
    kind: "spec",
    slug: "hash-verify",
    name: "ตรวจว่ารหัสผ่านตรงกับ Hash (SHA)",
    description:
      "เทียบรหัสผ่านกับ SHA-256/SHA-512 hex ที่มีอยู่ (เช่นในไฟล์ตั้งค่า) โดยไม่ต้องส่งออก",
    category: "security",
    icon: UserRoundCog,
    keywords: ["verify hash", "compare hash", "checksum"],
    action: "ตรวจ",
    fields: [
      { key: "password", label: "ข้อความ / รหัสผ่าน", kind: "password", mono: true },
      text("hash", "Hash (hex)", { mono: true }),
      select("algorithm", "อัลกอริทึม", ["SHA-256", "SHA-512", "SHA-384", "SHA-1", "MD5"]),
    ],
    run: async (v) => {
      const expected = str(v, "hash").trim().toLowerCase();

      if (!/^[0-9a-f]+$/u.test(expected)) throw new Error("hash ต้องเป็นเลขฐาน 16");

      const actual = await hashBytes(
        new TextEncoder().encode(str(v, "password")),
        str(v, "algorithm") as HashAlgorithm,
      );

      return out.rows([
        row("ผล", actual === expected ? "ตรงกัน" : "ไม่ตรงกัน"),
        row("Hash ที่คำนวณได้", actual, true),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "base64-checksum",
    name: "ตรวจ Checksum ข้อความยาว / Base64",
    description:
      'วางข้อมูล Base64 ของไฟล์เพื่อคำนวณ SHA-256 — ถ้าเป็นไฟล์ ใช้ "ชุดเครื่องมือ Hash และเข้ารหัส"',
    category: "security",
    icon: FileText,
    keywords: ["checksum", "base64", "sha256", "integrity"],
    action: "คำนวณ",
    fields: [
      textarea("input", "ข้อมูล Base64", { rows: 6 }),
      select("algorithm", "อัลกอริทึม", ["SHA-256", "SHA-512", "SHA-1", "MD5"]),
    ],
    run: async (v) => {
      const cleaned = limit(str(v, "input"), 20_000_000).replace(/\s/gu, "");

      if (!/^[A-Za-z0-9+/_-]*={0,2}$/u.test(cleaned)) throw new Error("ไม่ใช่ Base64");

      const binary = atob(cleaned.replace(/-/gu, "+").replace(/_/gu, "/"));
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const hash = await hashBytes(bytes, str(v, "algorithm") as HashAlgorithm);

      return out.rows([
        row("ขนาด", `${bytes.length.toLocaleString("th-TH")} ไบต์`),
        row(str(v, "algorithm"), hash, true),
        row(
          "SRI",
          str(v, "algorithm").startsWith("SHA-") && str(v, "algorithm") !== "SHA-1"
            ? `${str(v, "algorithm").toLowerCase().replace("-", "")}-${btoa(String.fromCharCode(...(hash.match(/../gu) ?? []).map((h) => parseInt(h, 16))))}`
            : "—",
          true,
        ),
      ]);
    },
  },
];
