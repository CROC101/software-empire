import { def, range, type Entry } from "../types";

/** Showpieces: the parts with the strongest effect, kept in their own group at the top. */
export const exclusive: readonly Entry[] = [
  {
    ...def(
      "2026-11-20",
      "showcase",
      "orbit-gallery-hero",
      "Orbit Gallery Hero",
      "รูปผลงานสิบรูปหมุนเป็นวงรอบข้อความกลางจอช้า ๆ แต่ละรูปหมุนกลับเท่ากันจึงตั้งตรงตลอดทาง กลางจอเป็นหัวเรื่อง ปุ่มสองปุ่ม และจุดเด่นสามข้อ",
      ["วงโคจร", "แกลเลอรี", "hero", "หมุนสวนทาง"],
      [range("seconds", "วินาทีต่อรอบ", 15, 60, 5, 35), range("tiles", "จำนวนรูป", 6, 10, 1, 10)],
    ),
    prompt:
      "Build a full-height landing hero: a ring of 6-10 landscape screenshots (16:9, rounded at most 0.75rem, hairline border) turns once every 35 seconds round the centre of the section, with a radius of about clamp(12rem, 40vw, 31rem). Place each picture with rotate(angle) translateX(radius) rotate(-angle), and give each picture the same spin in reverse so it stays upright all the way round. Drive both spins with one CSS keyframe on transform only, stop them under prefers-reduced-motion, and hide the ring from screen readers. Over it, a soft radial fade of the page background keeps the middle readable: a small chip, a two-line headline (second line in the accent), one paragraph, a primary and a secondary button, and three short points in a row. Use your stack's design tokens for every colour.",
  },
];
