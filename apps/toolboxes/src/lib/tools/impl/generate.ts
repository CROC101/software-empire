import { randomInt, toHex } from "./security";

/// เครื่องมือสร้างข้อมูล — ความสุ่มทั้งหมดจาก crypto.getRandomValues (ไม่ใช้ Math.random)

export function uuidV4(): string {
  return crypto.randomUUID();
}

/// UUID v7 (RFC 9562) — เรียงตามเวลาได้ เหมาะเป็น primary key
export function uuidV7(now = Date.now()): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const ts = BigInt(now);

  for (let i = 0; i < 6; i++) bytes[i] = Number((ts >> BigInt(8 * (5 - i))) & 0xffn);

  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = toHex(bytes);

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function randomNumbers(options: {
  min: number;
  max: number;
  count: number;
  unique: boolean;
  decimals: number;
}): number[] {
  const { min, max, count, unique, decimals } = options;

  if (max < min) throw new Error("ค่าสูงสุดต้องไม่น้อยกว่าค่าต่ำสุด");
  if (!Number.isInteger(count) || count < 1 || count > 1000)
    throw new Error("จำนวนต้องอยู่ระหว่าง 1–1000");
  if (decimals < 0 || decimals > 6) throw new Error("ทศนิยมได้ 0–6 ตำแหน่ง");

  const scale = 10 ** decimals;
  const lo = Math.ceil(min * scale);
  const hi = Math.floor(max * scale);
  const span = hi - lo + 1;

  if (span <= 0) throw new Error("ช่วงนี้ไม่มีค่าที่เลือกได้");
  if (unique && count > span) throw new Error(`ช่วงนี้มีค่าไม่ซ้ำได้แค่ ${span} ค่า`);
  if (span > 2 ** 32) throw new Error("ช่วงกว้างเกินไป");

  const seen = new Set<number>();
  const out: number[] = [];

  while (out.length < count) {
    const v = lo + randomInt(span);

    if (unique && seen.has(v)) continue;
    seen.add(v);
    out.push(v / scale);
  }

  return out;
}

export function randomStrings(options: {
  length: number;
  count: number;
  charset: string;
}): string[] {
  if (!options.charset) throw new Error("ชุดตัวอักษรว่าง");
  if (options.length < 1 || options.length > 1024) throw new Error("ความยาวต้องอยู่ระหว่าง 1–1024");
  if (options.count < 1 || options.count > 500) throw new Error("จำนวนต้องอยู่ระหว่าง 1–500");

  const chars = [...new Set([...options.charset])];

  return Array.from({ length: options.count }, () =>
    Array.from({ length: options.length }, () => chars[randomInt(chars.length)]).join(""),
  );
}

const LOREM =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(
    " ",
  );

/// ข้อความไทยสำหรับวางเลย์เอาต์ (คำทั่วไป ไม่มีความหมายต่อเนื่อง)
const THAI_WORDS =
  "การ ออกแบบ ระบบ ข้อมูล นักศึกษา มหาวิทยาลัย เทคโนโลยี พัฒนา โครงการ เรียนรู้ ชุมชน คอมพิวเตอร์ เครือข่าย ความรู้ สร้างสรรค์ อนาคต ทักษะ กิจกรรม ตัวอย่าง ข้อความ เนื้อหา หน้าเว็บ ภาพรวม ประสบการณ์ ผู้ใช้ งานวิจัย นวัตกรรม ความร่วมมือ บริการ คุณภาพ".split(
    " ",
  );

export function loremIpsum(options: {
  language: "en" | "th";
  paragraphs: number;
  sentences: number;
}): string {
  if (options.paragraphs < 1 || options.paragraphs > 50) throw new Error("จำนวนย่อหน้าได้ 1–50");

  const words = options.language === "th" ? THAI_WORDS : LOREM;
  const sentence = () => {
    const n = 6 + randomInt(10);
    const picked = Array.from({ length: n }, () => words[randomInt(words.length)]);

    if (options.language === "th") return picked.join("");

    const text = picked.join(" ");

    return `${text[0].toUpperCase()}${text.slice(1)}.`;
  };

  return Array.from({ length: options.paragraphs }, (_, p) => {
    const body = Array.from({ length: Math.max(1, options.sentences) }, sentence).join(
      options.language === "th" ? " " : " ",
    );

    return p === 0 && options.language === "en"
      ? `Lorem ipsum dolor sit amet, ${body.charAt(0).toLowerCase()}${body.slice(1)}`
      : body;
  }).join("\n\n");
}

const FIRST = [
  "สมชาย",
  "สมหญิง",
  "มะลิ",
  "ธนา",
  "ปิยะ",
  "กานดา",
  "วิทยา",
  "อรอุมา",
  "ณัฐ",
  "พิมพ์ชนก",
  "ภานุ",
  "ศิริพร",
];
const LAST = ["ใจดี", "รักเรียน", "ทดสอบ", "ตัวอย่าง", "สมมติ", "เขียนโค้ด", "ข้อมูลดี", "มีสุข"];
const CITY = ["เชียงใหม่", "ลำพูน", "ลำปาง", "เชียงราย", "แพร่", "น่าน", "พะเยา", "แม่ฮ่องสอน"];

/// ข้อมูลทดสอบสังเคราะห์ (ใช้ทดสอบโปรแกรม) — ชื่อเป็นคำสมมติ · อีเมลใช้โดเมน example.com (RFC 2606) ·
/// เบอร์ขึ้นต้น 099-999 · เลขบัตรขึ้นต้น 0 ซึ่งไม่มีออกจริง
export function fakeRecords(count: number, fields: string[]): Record<string, string | number>[] {
  if (count < 1 || count > 500) throw new Error("จำนวนแถวได้ 1–500");

  return Array.from({ length: count }, (_, i) => {
    const first = FIRST[randomInt(FIRST.length)];
    const last = LAST[randomInt(LAST.length)];
    const row: Record<string, string | number> = {};

    for (const field of fields) {
      if (field === "id") row.id = i + 1;
      if (field === "uuid") row.uuid = crypto.randomUUID();
      if (field === "name") row.name = `${first} ${last}`;
      if (field === "email") row.email = `user${i + 1}.${randomInt(9999)}@example.com`;
      if (field === "phone") row.phone = `099-999-${String(randomInt(10000)).padStart(4, "0")}`;
      if (field === "city") row.city = CITY[randomInt(CITY.length)];
      if (field === "age") row.age = 18 + randomInt(43);
      if (field === "score") row.score = randomInt(101);
      if (field === "date")
        row.date = new Date(Date.UTC(2026, randomInt(12), 1 + randomInt(28)))
          .toISOString()
          .slice(0, 10);
      if (field === "studentCode") row.studentCode = `69${String(randomInt(1e8)).padStart(8, "0")}`;
    }

    return row;
  });
}
