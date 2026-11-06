import { cardAt, DECK, type Card, type Suit } from "./deck";

export type Topic = "general" | "love" | "work" | "money" | "study" | "health";
export type Drawn = { card: Card; reversed: boolean };

export const TOPICS: { id: Topic; label: string }[] = [
  { id: "general", label: "ภาพรวม" },
  { id: "love", label: "ความรัก" },
  { id: "work", label: "การงาน" },
  { id: "money", label: "การเงิน" },
  { id: "study", label: "การเรียน" },
  { id: "health", label: "สุขภาพ" },
];

type Spread = {
  label: string;
  blurb: string;
  positions: readonly string[];
  /** coins; must match tarot.spread_cost() in the database, which is what actually charges */
  cost: number;
  /** a spread about one subject sets the topic itself */
  topic?: Topic;
};

export const SPREADS = {
  one: { label: "ไพ่ใบเดียว", blurb: "คำตอบสั้น ๆ สำหรับวันนี้", positions: ["คำตอบ"], cost: 0 },
  three: {
    label: "สามใบ",
    blurb: "อดีต ปัจจุบัน อนาคต",
    positions: ["อดีต", "ปัจจุบัน", "อนาคต"],
    cost: 0,
  },
  yesno: {
    label: "ใช่หรือไม่",
    blurb: "ถามเรื่องเดียว ได้คำตอบเดียว",
    positions: ["คำตอบ"],
    cost: 0,
  },
  love: {
    label: "ความรัก 5 ใบ",
    blurb: "คุณ เขา และสิ่งที่อยู่ระหว่างกัน",
    positions: ["ตัวคุณ", "อีกฝ่าย", "ความสัมพันธ์ตอนนี้", "สิ่งที่ขวางอยู่", "แนวโน้ม"],
    cost: 10,
    topic: "love",
  },
  celtic: {
    label: "เซลติกครอส 10 ใบ",
    blurb: "ดูเรื่องเดียวให้ลึกครบทุกด้าน",
    positions: [
      "สถานการณ์",
      "สิ่งที่ท้าทาย",
      "รากของเรื่อง",
      "สิ่งที่เพิ่งผ่านไป",
      "สิ่งที่หวัง",
      "อนาคตอันใกล้",
      "ตัวคุณ",
      "คนรอบตัว",
      "ความหวังและความกลัว",
      "ผลลัพธ์",
    ],
    cost: 20,
  },
} as const satisfies Record<string, Spread>;
export type SpreadId = keyof typeof SPREADS;
export const SPREAD_IDS = Object.keys(SPREADS) as SpreadId[];

/** Yes/no reads the card's direction, softened for cards that never give a flat answer. */
export function yesNo({ card, reversed }: Drawn): { answer: string; note: string } {
  // cards about waiting, change or the unknown answer "not yet" either way up
  const unsure = ["m12", "m18", "m10", "swords02", "cups07"].includes(card.id);
  if (unsure)
    return { answer: "ยังไม่ชัด", note: "ไพ่ใบนี้บอกให้รอดูอีกสักพัก ยังไม่ใช่เวลาตัดสิน" };
  return reversed
    ? { answer: "ไม่ ตอนนี้", note: "ทางนี้ยังติดขัด ลองถามใหม่เมื่อสถานการณ์เปลี่ยน" }
    : { answer: "ใช่", note: "พลังของไพ่หนุนเรื่องที่คุณถาม" };
}

/** Today's date in Bangkok as YYYY-MM-DD, the same day the database counts check-ins on. */
export function bangkokDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(now);
}

/** FNV-1a: a stable 32-bit number from a string. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** One card per person per Bangkok day: the same all day, a new one tomorrow. */
export function dailyCard(who: string, day = bangkokDay()): Drawn {
  const h = hash(`${who}:${day}`);
  const card = cardAt(h);
  // a daily card is reversed about one day in four
  return { card, reversed: (h >>> 8) % 4 === 0 };
}

/** `n` different cards, each reversed with a one-in-three chance. */
export function draw(n: number, index: (below: number) => number = secureIndex): Drawn[] {
  const pool = [...DECK];
  const out: Drawn[] = [];
  for (let i = 0; i < n && pool.length; i++) {
    const [card] = pool.splice(index(pool.length), 1);
    if (card) out.push({ card, reversed: index(3) === 0 });
  }
  return out;
}

/** An unbiased whole number in [0, below): values past the last full multiple are redrawn. */
export function secureIndex(below: number): number {
  const limit = Math.floor(2 ** 32 / below) * below;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    const x = buf[0] ?? 0;
    if (x < limit) return x % below;
  }
}

/** What each suit says about a topic, upright and reversed. */
const LENS: Record<Suit, Record<Exclude<Topic, "general">, [string, string]>> = {
  major: {
    study: [
      "การเรียนกำลังถึงบทสำคัญ สิ่งที่เรียนตอนนี้จะอยู่กับคุณนาน",
      "การเรียนมีบทเรียนที่ต้องผ่าน ทบทวนพื้นฐานอีกรอบ",
    ],
    health: ["ร่างกายกำลังบอกอะไรบางอย่าง ฟังมันให้ดี", "อย่าฝืนร่างกาย ช่วงนี้ต้องพักให้พอ"],
    love: [
      "เรื่องหัวใจช่วงนี้มีความหมายลึกกว่าปกติ",
      "ความรักกำลังสอนบทเรียนสำคัญ ค่อย ๆ ทำความเข้าใจ",
    ],
    work: ["งานกำลังเข้าสู่จุดเปลี่ยนที่สำคัญ", "งานมีบทเรียนที่ต้องผ่าน อย่าเพิ่งท้อ"],
    money: [
      "การเงินอยู่ในช่วงที่ส่งผลระยะยาว คิดให้รอบ",
      "เงินช่วงนี้ต้องระวังการตัดสินใจครั้งใหญ่",
    ],
  },
  wands: {
    study: [
      "ไฟในการเรียนมาเต็ม เหมาะเริ่มวิชาหรือโปรเจกต์ใหม่",
      "ไฟหมดกลางทาง แบ่งงานเป็นชิ้นเล็กแล้วทำทีละชิ้น",
    ],
    health: ["พลังเหลือเฟือ ออกกำลังกายจะช่วยให้ใจนิ่ง", "ระวังหักโหมจนเหนื่อยล้า"],
    love: [
      "ความรักมีไฟและความตื่นเต้น กล้าเป็นฝ่ายเริ่มได้",
      "ไฟในความสัมพันธ์อ่อนลง ลองหากิจกรรมใหม่ทำด้วยกัน",
    ],
    work: ["งานมีพลังและโอกาสใหม่ เหมาะเริ่มโปรเจกต์", "งานติดขัดเพราะแรงหมด จัดลำดับใหม่ก่อน"],
    money: ["เงินมาจากความกล้าลงมือและไอเดียใหม่", "ระวังใช้เงินตามอารมณ์"],
  },
  cups: {
    study: [
      "เรียนสิ่งที่รักแล้วจะจำได้ดี หาเพื่อนติวด้วยกัน",
      "อารมณ์รบกวนสมาธิ จัดการใจก่อนแล้วค่อยอ่าน",
    ],
    health: ["ใจสบาย กายก็สบาย ดูแลอารมณ์คือดูแลสุขภาพ", "ความเครียดสะสมเริ่มส่งผลต่อร่างกาย"],
    love: ["หัวใจเปิดกว้าง เหมาะบอกความรู้สึก", "อารมณ์ขึ้นลง คุยกันตรง ๆ อย่าเดาใจ"],
    work: ["งานที่ทำด้วยใจจะออกมาดี ทีมเข้ากันได้", "ใจไม่อยู่กับงาน หาสิ่งที่ทำให้รักงานอีกครั้ง"],
    money: ["เงินเกี่ยวกับคนรอบตัว ความใจดีกลับมาเป็นโชค", "ระวังใช้เงินเพื่อเติมใจที่ว่าง"],
  },
  swords: {
    study: [
      "สมองไว เหมาะอ่านเรื่องยากและสอบที่ต้องใช้ตรรกะ",
      "คิดมากจนอ่านไม่เข้าหัว พักสายตาและนอนให้พอ",
    ],
    health: ["ใช้เหตุผลดูแลตัวเอง ตรวจสุขภาพตามนัด", "ความกังวลทำให้นอนไม่หลับ ลองลดหน้าจอก่อนนอน"],
    love: ["ความสัมพันธ์ต้องการความจริงใจและการคุยที่ชัด", "คำพูดอาจบาดใจกัน คิดก่อนพูด"],
    work: [
      "งานต้องใช้เหตุผลและการตัดสินใจเด็ดขาด",
      "ความกังวลทำให้งานช้า แยกข้อเท็จจริงออกจากความกลัว",
    ],
    money: ["วางแผนการเงินด้วยตัวเลขจริง ไม่ใช่ความรู้สึก", "อย่าตัดสินใจเรื่องเงินตอนเครียด"],
  },
  pentacles: {
    study: [
      "ความขยันสม่ำเสมอจะพาไปถึงเป้า อ่านทุกวันวันละนิด",
      "เรียนซ้ำแบบเดิมจนเบื่อ ลองเปลี่ยนวิธีอ่าน",
    ],
    health: [
      "ร่างกายแข็งแรงขึ้นจากกิจวัตรที่ดี กินนอนให้ตรงเวลา",
      "ระวังเรื่องกินและการนั่งนานเกินไป",
    ],
    love: [
      "ความรักที่มั่นคง ค่อยเป็นค่อยไป แสดงออกด้วยการกระทำ",
      "ความรักถูกเรื่องเงินหรืองานเบียด หาเวลาให้กันบ้าง",
    ],
    work: ["งานที่ขยันทำจะเห็นผลจับต้องได้", "งานซ้ำจำเจ หรือได้ผลไม่คุ้มแรง ทบทวนวิธีทำ"],
    money: ["การเงินมั่นคงขึ้น เหมาะออมและลงทุนระยะยาว", "ระวังรายจ่ายรั่วไหล ทำบัญชีสักเดือน"],
  },
};

/** The text shown for one drawn card under a topic. */
export function interpret({ card, reversed }: Drawn, topic: Topic): string {
  const base = reversed ? card.rev : card.up;
  if (topic === "general") return base;
  const [up, rev] = LENS[card.suit][topic];
  return `${base} · ${reversed ? rev : up}`;
}
