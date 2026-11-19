/**
 * The registry: every part the library shows, its playground controls and the prompt that rebuilds
 * it. Plain data (no React), so server pages and tests read it too. `src/registry/ui/<slug>.tsx` is
 * the code; the first twelve parts are hand-tuned here, the rest live in `data/`.
 */
import { blocks } from "./data/blocks";
import { components } from "./data/components";
import { exclusive } from "./data/exclusive";
import { rebuilds } from "./data/rebuilds";
import { remakes } from "./data/remakes";
import type { Entry } from "./types";

export * from "./types";

const tone = ["blue", "sky", "violet", "teal"] as const;

const core: readonly Entry[] = [
  {
    slug: "aurora-tide",
    added: "2026-11-18",
    rank: 1,
    name: "Aurora Tide",
    summary: "ใต้ผิวน้ำยามค่ำ ลำแสงจันทร์ส่ายช้าๆ ลงมาในน้ำ ผิวน้ำด้านบนกระเพื่อมสองชั้น",
    category: "background",
    blend: ["god rays", "water surface", "night water"],
    controls: [
      { key: "title", label: "หัวข้อ", type: "text", maxLength: 40, value: "แสงใต้น้ำ" },
      {
        key: "speed",
        label: "ความเร็ว (วินาที/รอบ)",
        type: "range",
        min: 6,
        max: 40,
        step: 1,
        value: 16,
      },
      {
        key: "blur",
        label: "ความนุ่มของแสง",
        type: "range",
        min: 30,
        max: 140,
        step: 5,
        value: 80,
      },
      {
        key: "intensity",
        label: "ความเข้ม",
        type: "range",
        min: 0.2,
        max: 1,
        step: 0.05,
        value: 0.65,
      },
      { key: "surface", label: "ผิวน้ำด้านบน", type: "toggle", value: true },
    ],
    prompt:
      "Build a React background component seen from under water at night: a dark water gradient (blue-700 to ink-975 tokens), four slanted light shafts falling from the top right that sway slowly (rotate and scaleX plus opacity, CSS keyframes, period set by a speed prop), and an optional lapping waterline along the top made of two sum-of-sines SVG layers sliding opposite ways at 7 s and 11 s. Centred title or children on top. Transform and opacity only; under prefers-reduced-motion everything stands still.",
  },
  {
    slug: "decode-text",
    added: "2026-11-18",
    rank: 3,
    name: "Decode Text",
    summary: "ตัวอักษรสุ่มวิ่งแล้วค่อยๆ ถอดรหัสจากซ้ายไปขวา เริ่มเอง ชี้เมาส์ หรือวนซ้ำ",
    category: "text",
    blend: ["decrypted text", "hyper scramble"],
    controls: [
      { key: "text", label: "ข้อความ", type: "text", maxLength: 32, value: "CROCWORK DESIGN" },
      {
        key: "duration",
        label: "เวลา (มิลลิวินาที)",
        type: "range",
        min: 300,
        max: 3000,
        step: 100,
        value: 1200,
      },
      {
        key: "trigger",
        label: "เริ่มเมื่อ",
        type: "select",
        options: ["mount", "hover", "loop"],
        value: "loop",
      },
      {
        key: "charset",
        label: "ชุดอักษร",
        type: "select",
        options: ["letters", "symbols", "binary"],
        value: "letters",
      },
    ],
    prompt:
      "Build a React text component that scrambles its characters and reveals the real text left to right over a set duration with requestAnimationFrame. Triggers: on mount, on hover, or on a loop. Charsets: letters, symbols, binary. Keep spaces, render the real text first for SSR and screen readers (aria-label), and skip the effect under prefers-reduced-motion.",
  },
  {
    slug: "reveal-text",
    added: "2026-11-18",
    rank: 8,
    name: "Reveal Text",
    summary: "ข้อความโผล่ทีละคำหรือทีละตัว แบบหายเบลอ ลอยขึ้น หรือพลิก ตัดคำไทยถูกต้อง",
    category: "text",
    blend: ["blur text", "split reveal"],
    controls: [
      {
        key: "text",
        label: "ข้อความ",
        type: "text",
        maxLength: 60,
        value: "ออกแบบให้ขยับอย่างมีเหตุผล",
      },
      {
        key: "split",
        label: "แยกเป็น",
        type: "select",
        options: ["words", "chars"],
        value: "words",
      },
      {
        key: "mode",
        label: "ลีลา",
        type: "select",
        options: ["blur", "rise", "flip"],
        value: "blur",
      },
      {
        key: "stagger",
        label: "หน่วงต่อชิ้น (มิลลิวินาที)",
        type: "range",
        min: 10,
        max: 200,
        step: 5,
        value: 70,
      },
    ],
    prompt:
      "Build a React text reveal: split text into words or grapheme clusters with Intl.Segmenter (so Thai vowels and tone marks stay on their letter), then animate each piece in with motion/react when it scrolls into view: blur-to-sharp, rise from below, or flip on the X axis, with a stagger. Keep the full text in aria-label.",
  },
  {
    slug: "spotlight-card",
    added: "2026-11-18",
    rank: 2,
    name: "Spotlight Card",
    summary: "การ์ดกระจกที่เอียงตามเมาส์ ถูกดึงเข้าหาเคอร์เซอร์ และมีไฟส่องตามขอบ",
    category: "card",
    blend: ["magnetic", "3D tilt", "spotlight border"],
    controls: [
      { key: "title", label: "หัวข้อ", type: "text", maxLength: 40, value: "ส่งงานไวขึ้น" },
      { key: "tilt", label: "องศาเอียง", type: "range", min: 0, max: 20, step: 1, value: 10 },
      {
        key: "magnet",
        label: "แรงดูด (พิกเซล)",
        type: "range",
        min: 0,
        max: 40,
        step: 1,
        value: 12,
      },
      { key: "spotlight", label: "ไฟส่อง", type: "toggle", value: true },
    ],
    prompt:
      "Build a React card that tilts in 3D toward the pointer (spring rotateX/rotateY), drifts a few pixels toward it like a magnet, and carries a soft spotlight that follows the pointer inside and along a 1px border. Move the spotlight with transform only (a blurred circle), spring back on leave, keep it still under reduced motion.",
  },
  {
    slug: "pixel-card",
    added: "2026-11-18",
    rank: 18,
    name: "Pixel Card",
    summary: "การ์ดสองหน้า เปลี่ยนหน้าด้วยพิกเซลที่ปิดแล้วเปิดตามลำดับสุ่ม",
    category: "card",
    blend: ["pixel transition", "flip card"],
    controls: [
      { key: "grid", label: "จำนวนช่องต่อแถว", type: "range", min: 4, max: 16, step: 1, value: 9 },
      {
        key: "duration",
        label: "เวลา (มิลลิวินาที)",
        type: "range",
        min: 200,
        max: 1200,
        step: 50,
        value: 450,
      },
      { key: "tone", label: "สีพิกเซล", type: "select", options: tone, value: "blue" },
    ],
    prompt:
      "Build a React card with two faces. On hover, focus or tap, a grid of square pixels fades in cell by cell in a seeded random order, the face swaps at the halfway point, then the pixels fade out. Only opacity animates. Make it a real button with aria-pressed.",
  },
  {
    slug: "click-spark",
    added: "2026-11-18",
    rank: 14,
    name: "Click Spark",
    summary: "แตะตรงไหนก็มีประกายแตกออกเป็นเส้นรอบจุดนั้น วาดบน canvas",
    category: "interaction",
    blend: ["click spark", "ripple"],
    controls: [
      { key: "count", label: "จำนวนประกาย", type: "range", min: 4, max: 16, step: 1, value: 8 },
      { key: "radius", label: "รัศมี", type: "range", min: 10, max: 60, step: 2, value: 26 },
      {
        key: "duration",
        label: "เวลา (มิลลิวินาที)",
        type: "range",
        min: 200,
        max: 1000,
        step: 50,
        value: 450,
      },
      { key: "tone", label: "สี", type: "select", options: tone, value: "sky" },
    ],
    prompt:
      "Build a React wrapper that draws spark lines bursting out of every pointer-down point on a full-size canvas (ResizeObserver, devicePixelRatio, one requestAnimationFrame loop that stops when no sparks are left). Read the colour from a CSS design token at runtime, never a hex literal. No sparks under reduced motion.",
  },
  {
    slug: "constellation",
    added: "2026-11-18",
    rank: 16,
    name: "Constellation",
    summary: "จุดดาวลอยช้าๆ ลากเส้นหากันเมื่ออยู่ใกล้ และต่อเส้นมาหาเมาส์",
    category: "background",
    blend: ["particles", "constellation links"],
    controls: [
      { key: "count", label: "จำนวนจุด", type: "range", min: 20, max: 140, step: 5, value: 60 },
      { key: "link", label: "ระยะลากเส้น", type: "range", min: 60, max: 200, step: 10, value: 120 },
      { key: "speed", label: "ความเร็ว", type: "range", min: 0.1, max: 2, step: 0.1, value: 0.5 },
      { key: "mouse", label: "ต่อเส้นหาเมาส์", type: "toggle", value: true },
    ],
    prompt:
      "Build a React canvas background of drifting particles that draw fading lines to neighbours within a link distance and to the pointer. Resize with ResizeObserver, pause the loop while off screen (IntersectionObserver), colours from design tokens at runtime, a single still frame under reduced motion.",
  },
  {
    slug: "beam-button",
    added: "2026-11-18",
    rank: 5,
    name: "Beam Button",
    summary: "ปุ่มที่มีลำแสงวิ่งรอบขอบ ใช้การหมุนล้วนๆ ไม่แตะสีพื้นหลัง",
    category: "button",
    blend: ["border beam", "shiny button"],
    controls: [
      { key: "label", label: "ข้อความปุ่ม", type: "text", maxLength: 24, value: "เริ่มสร้างเลย" },
      {
        key: "duration",
        label: "รอบละ (วินาที)",
        type: "range",
        min: 1,
        max: 8,
        step: 0.5,
        value: 3,
      },
      { key: "tone", label: "สีลำแสง", type: "select", options: tone, value: "sky" },
    ],
    prompt:
      "Build a React button with a light beam travelling around its 1px border: an oversized conic-gradient square behind the button face, rotated with a linear infinite transform animation and clipped by the button. Static border under reduced motion. Real <button>, visible focus ring.",
  },
  {
    slug: "dock",
    added: "2026-11-18",
    rank: 4,
    name: "Magnify Dock",
    summary: "แถบไอคอนที่ขยายตามระยะห่างจากเมาส์ พร้อมป้ายชื่อลอยขึ้น",
    category: "navigation",
    blend: ["dock magnification", "tooltip"],
    controls: [
      {
        key: "magnify",
        label: "ขยายสูงสุด",
        type: "range",
        min: 1.2,
        max: 2.2,
        step: 0.1,
        value: 1.6,
      },
      {
        key: "distance",
        label: "ระยะมีผล (พิกเซล)",
        type: "range",
        min: 80,
        max: 240,
        step: 10,
        value: 140,
      },
      { key: "labels", label: "ป้ายชื่อ", type: "toggle", value: true },
    ],
    prompt:
      "Build a React dock of icon buttons that scale up by their distance to the pointer (useMotionValue for pointer x, useTransform + useSpring for scale and lift). Scale with transform, never width. Labels rise above the hovered or focused icon. Each icon is a labelled button.",
  },
  {
    slug: "island",
    added: "2026-11-18",
    rank: 9,
    name: "Command Island",
    summary: "เกาะลอยที่ยืดหดตามสถานะ สายเข้า เพลง ตัวจับเวลา ด้วย layout animation",
    category: "feedback",
    blend: ["floating island", "morphing status"],
    controls: [
      {
        key: "state",
        label: "สถานะ",
        type: "select",
        options: ["idle", "call", "music", "timer"],
        value: "music",
      },
      { key: "autoplay", label: "สลับเอง", type: "toggle", value: true },
    ],
    prompt:
      "Build a React status island that morphs between idle, incoming call, now playing and timer. Size changes use motion/react layout animation (transform based), content cross-fades with AnimatePresence. Click cycles states; an optional autoplay cycles every few seconds and stops under reduced motion.",
  },
  {
    slug: "metric-bento",
    added: "2026-11-18",
    rank: 12,
    name: "Metric Bento",
    summary: "ตารางตัวเลขแบบเบนโต ตัวเลขนับขึ้น กราฟเส้นค่อยๆ เผย การ์ดลอยเมื่อชี้",
    category: "data",
    blend: ["bento grid", "number ticker", "sparkline"],
    controls: [
      {
        key: "duration",
        label: "เวลานับ (วินาที)",
        type: "range",
        min: 0.4,
        max: 3,
        step: 0.1,
        value: 1.4,
      },
      { key: "lift", label: "ลอยเมื่อชี้", type: "toggle", value: true },
      { key: "tone", label: "สีกราฟ", type: "select", options: tone, value: "blue" },
    ],
    prompt:
      "Build a React bento grid of metric tiles. Numbers count up with motion's animate() when the grid scrolls into view, a sparkline is revealed by a cover that scales away (transform only), tiles lift slightly on hover. Mark demo numbers as examples. Final values at once under reduced motion.",
  },
  {
    slug: "marquee",
    added: "2026-11-18",
    rank: 6,
    name: "Name Marquee",
    summary: "แถบชื่อเลื่อนไม่รู้จบ หนึ่งหรือสองแถวสวนกัน ขอบจางหาย หยุดเมื่อชี้",
    category: "layout",
    blend: ["infinite marquee", "edge fade"],
    controls: [
      { key: "rows", label: "จำนวนแถว", type: "select", options: ["1", "2"], value: "2" },
      {
        key: "speed",
        label: "รอบละ (วินาที)",
        type: "range",
        min: 10,
        max: 60,
        step: 2,
        value: 28,
      },
      { key: "gap", label: "ช่องไฟ", type: "range", min: 16, max: 80, step: 4, value: 40 },
      { key: "pause", label: "หยุดเมื่อชี้", type: "toggle", value: true },
    ],
    prompt:
      "Build a React marquee: a row of names with icons duplicated once and translated by -50% in a linear infinite CSS keyframe, an optional second row running the other way, a mask that fades both edges, pause on hover, still under reduced motion. The duplicate copy is aria-hidden.",
  },
];

export const registry: readonly Entry[] = [
  ...core,
  ...components,
  ...rebuilds,
  ...blocks,
  ...remakes,
  ...exclusive,
];

export function entry(slug: string): Entry | undefined {
  return registry.find((e) => e.slug === slug);
}
