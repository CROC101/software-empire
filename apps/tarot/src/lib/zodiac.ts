import type { Element } from "./deck";

export type Sign = {
  id: string;
  th: string;
  symbol: string;
  /** first day of the sign in the Thai (sidereal) reckoning: [month 1–12, day] */
  from: [number, number];
  element: Element;
  trait: string;
};

/**
 * The twelve signs as Thai horoscopes count them (the sun's sidereal ingress, so Aries begins
 * around Songkran, not 21 March). Days are approximate to ±1 because ingress shifts by year.
 */
export const SIGNS: readonly Sign[] = [
  {
    id: "aries",
    th: "เมษ",
    symbol: "♈",
    from: [4, 14],
    element: "fire",
    trait: "กล้า ตรงไปตรงมา เริ่มก่อนใคร",
  },
  {
    id: "taurus",
    th: "พฤษภ",
    symbol: "♉",
    from: [5, 15],
    element: "earth",
    trait: "มั่นคง อดทน รักความสบาย",
  },
  {
    id: "gemini",
    th: "เมถุน",
    symbol: "♊",
    from: [6, 15],
    element: "air",
    trait: "ช่างคุย หัวไว อยากรู้ทุกเรื่อง",
  },
  {
    id: "cancer",
    th: "กรกฎ",
    symbol: "♋",
    from: [7, 17],
    element: "water",
    trait: "อ่อนโยน รักบ้าน ดูแลคนรอบตัว",
  },
  {
    id: "leo",
    th: "สิงห์",
    symbol: "♌",
    from: [8, 17],
    element: "fire",
    trait: "มั่นใจ ใจกว้าง ชอบเป็นผู้นำ",
  },
  {
    id: "virgo",
    th: "กันย์",
    symbol: "♍",
    from: [9, 17],
    element: "earth",
    trait: "ละเอียด ช่างสังเกต ทำอะไรเป็นระบบ",
  },
  {
    id: "libra",
    th: "ตุลย์",
    symbol: "♎",
    from: [10, 17],
    element: "air",
    trait: "รักความยุติธรรม เข้ากับคนง่าย",
  },
  {
    id: "scorpio",
    th: "พิจิก",
    symbol: "♏",
    from: [11, 16],
    element: "water",
    trait: "ลึก มุ่งมั่น อ่านคนเก่ง",
  },
  {
    id: "sagittarius",
    th: "ธนู",
    symbol: "♐",
    from: [12, 16],
    element: "fire",
    trait: "รักอิสระ มองโลกบวก ชอบเดินทาง",
  },
  {
    id: "capricorn",
    th: "มังกร",
    symbol: "♑",
    from: [1, 14],
    element: "earth",
    trait: "จริงจัง มีเป้าหมาย ไปช้าแต่ถึง",
  },
  {
    id: "aquarius",
    th: "กุมภ์",
    symbol: "♒",
    from: [2, 13],
    element: "air",
    trait: "คิดต่าง เป็นตัวของตัวเอง",
  },
  {
    id: "pisces",
    th: "มีน",
    symbol: "♓",
    from: [3, 14],
    element: "water",
    trait: "ฝันเก่ง เห็นใจคน มีจินตนาการ",
  },
];

/** The sign of a birthday (YYYY-MM-DD), Thai reckoning. */
export function signOf(birthDate: string): Sign {
  const [, m = 1, d = 1] = birthDate.split("-").map(Number);
  const md = m * 100 + d;
  // the latest sign whose start is on or before the birthday; before 14 Jan it is still Sagittarius
  let best: Sign | undefined;
  for (const s of SIGNS) {
    const start = s.from[0] * 100 + s.from[1];
    if (start <= md && (!best || start > best.from[0] * 100 + best.from[1])) best = s;
  }
  return best ?? (SIGNS[8] as Sign);
}

/** How a card's element sits with the sign's: the same, helping, or pulling the other way. */
export function harmony(sign: Element, card: Element): "same" | "help" | "pull" {
  if (sign === card) return "same";
  const pairs = [
    ["fire", "air"],
    ["water", "earth"],
  ];
  return pairs.some(([a, b]) => (a === sign && b === card) || (b === sign && a === card))
    ? "help"
    : "pull";
}
