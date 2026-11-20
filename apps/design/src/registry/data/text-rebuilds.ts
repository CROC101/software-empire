import { def, pick, range, text, toggle, type Control, type Entry } from "../types";

/**
 * crocwork Lite rebuilds of React Bits text animations. Written from each original's title and how
 * it behaves on reactbits.dev, never from its code (React Bits is MIT + Commons Clause: no ports).
 * The original is only linked and shown in a click-to-load frame on the part's page.
 */
const t = (
  inspiredBy: string,
  slug: string,
  name: string,
  summary: string,
  blend: readonly string[],
  controls: readonly Control[],
): Entry => ({ ...def("2026-11-20", "text", slug, name, summary, blend, controls), inspiredBy });

/** Parts already in the library that are our take on a React Bits text animation. */
export const textOrigins: Readonly<Record<string, string>> = {
  "particle-title": "Particle Text",
  "flip-words": "Split Flap Text",
  "split-chars": "Split Text",
  "reveal-text": "Blur Text",
  "circle-text": "Circular Text",
  typewriter: "Text Type",
  "shine-text": "Shiny Text",
  "decode-text": "Decrypted Text",
  "word-rotate": "Rotating Text",
};

const words = (value: string, max = 40) => text("text", "ข้อความ", value, max);

export const textRebuilds: readonly Entry[] = [
  t(
    "Tech Text",
    "circuit-text",
    "Circuit Text",
    "เคอร์เซอร์บล็อกสีน้ำเงินเดินจากซ้ายไปขวาพิมพ์ทีละตัว ใต้บรรทัดมีเลขที่อยู่ฐานสิบหกนับตาม แล้ววนพิมพ์ใหม่",
    ["block cursor", "terminal print", "hex counter"],
    [words("SYSTEM ONLINE", 24), range("speed", "จังหวะ (มิลลิวินาที/ตัว)", 30, 300, 10, 90)],
  ),
  t(
    "Text Loop",
    "roll-lines",
    "Roll Lines",
    "หน้าต่างสามบรรทัด กองข้อความเลื่อนขึ้นทีละบรรทัด บรรทัดกลางสว่างที่สุด",
    ["vertical roll", "spring layout", "focus line"],
    [
      text("lines", "บรรทัด (คั่นด้วยจุลภาค)", "ออกแบบ,เขียนโค้ด,ทดสอบ,ส่งงาน", 80),
      range("interval", "เปลี่ยนทุก (วินาที)", 0.6, 5, 0.1, 1.8),
    ],
  ),
  t(
    "Masked Heading",
    "window-heading",
    "Window Heading",
    "หัวข้อหลายบรรทัด แต่ละบรรทัดโผล่ขึ้นจากช่องของตัวเองทีละบรรทัด คั่นบรรทัดด้วย |",
    ["line mask", "stagger rise"],
    [
      words("ทุกบรรทัด|โผล่จาก|ช่องของมันเอง", 60),
      range("stagger", "ห่างกันต่อบรรทัด (วินาที)", 0, 0.4, 0.02, 0.12),
    ],
  ),
  t(
    "Warp Text",
    "bend-text",
    "Bend Text",
    "คลื่นความร้อนวิ่งผ่านคำ ตัวอักษรเอนและยืดตามกันทีละตัวบนพื้นที่เอียงไปด้านหลัง",
    ["skew wave", "letter delay", "tilted plane"],
    [
      words("WARP SPEED", 24),
      range("amount", "องศาที่เอน", 0, 40, 1, 18),
      range("speed", "ความเร็ว (วินาที/รอบ)", 0.8, 6, 0.1, 2.4),
    ],
  ),
  t(
    "Stroke Text",
    "outline-draw",
    "Outline Draw",
    "ปากกาลากเส้นขอบตัวอักษรจนครบ แล้วหมึกค่อยเติมเต็ม กดวาดใหม่ได้",
    ["svg stroke draw", "fill fade"],
    [words("crocwork", 16), range("duration", "เวลาวาด (วินาที)", 0.5, 6, 0.1, 2.5)],
  ),
  t(
    "Depth Text",
    "stack-depth",
    "Stack Depth",
    "คำเป็นก้อนทึบ สำเนาซ้อนลึกเข้าไปเป็นด้านข้าง ทั้งก้อนเอียงตามเมาส์แบบสปริง",
    ["stacked layers", "3d tilt", "pointer spring"],
    [
      words("DEPTH", 16),
      range("layers", "จำนวนชั้น", 2, 20, 1, 10),
      range("tilt", "เอียงสูงสุด (องศา)", 0, 45, 1, 24),
    ],
  ),
  t(
    "Fold Text",
    "paper-fold",
    "Paper Fold",
    "ครึ่งบนของคำพับลงมาทับครึ่งล่างเหมือนกระดาษ รอยพับมืดลงตอนปิด แล้วกางออกวนไป",
    ["half fold", "crease shade"],
    [words("พับแล้วกาง", 24), range("speed", "ความเร็ว (วินาที/รอบ)", 1, 8, 0.1, 3)],
  ),
  t(
    "Echo Text",
    "echo-trail",
    "Echo Trail",
    "คำส่ายไปมา สำเนาจางๆ ตามหลังช้ากว่าทีละจังหวะเหมือนเสียงสะท้อนที่มองเห็นได้",
    ["delayed copies", "sway"],
    [
      words("ECHO", 16),
      range("echoes", "จำนวนเงา", 1, 10, 1, 5),
      range("distance", "ระยะส่าย (px)", 0, 60, 1, 24),
      range("speed", "ความเร็ว (วินาที/รอบ)", 0.8, 8, 0.1, 2.6),
    ],
  ),
  t(
    "Shuffle",
    "shuffle-letters",
    "Shuffle Letters",
    "ตัวอักษรสลับที่กันเหมือนสับไพ่ แล้วไหลกลับเข้าตำแหน่งเดิมเป็นคำ วนไป",
    ["layout reorder", "spring"],
    [words("CROCWORK", 20), range("interval", "สลับทุก (วินาที)", 0.6, 4, 0.1, 1.6)],
  ),
  t(
    "Text Pressure",
    "press-weight",
    "Press Weight",
    "ตัวอักษรใต้เมาส์พองหนาสุดและสูงขึ้น ตัวที่ไกลออกไปบางลง ใช้แกนน้ำหนักของฟอนต์แปรผัน",
    ["variable weight", "pointer distance", "scaleY"],
    [
      words("PRESSURE", 16),
      range("thin", "น้ำหนักบางสุด", 100, 500, 50, 200),
      range("radius", "รัศมี (px)", 60, 400, 10, 220),
    ],
  ),
  t(
    "Curved Loop",
    "arc-marquee",
    "Arc Marquee",
    "ริบบิ้นข้อความวิ่งไม่รู้จบบนเส้นโค้ง ไม่เห็นรอยต่อ ลากเพื่อดันให้เร็วขึ้นได้",
    ["svg textPath", "seamless loop", "drag push"],
    [
      words("crocwork design ✦ ", 40),
      range("speed", "ความเร็ว (px/วินาที)", 0, 200, 5, 60),
      range("curve", "ความโค้ง", 0, 120, 5, 60),
    ],
  ),
  t(
    "Fuzzy Text",
    "static-text",
    "Static Text",
    "สัญญาณขาดๆ หายๆ คำถูกฉีกเป็นแถวบางที่สั่นออกข้าง ชี้เมาส์แล้วสั่นแรงขึ้น วาดด้วย canvas",
    ["canvas row slices", "hover intensity"],
    [
      words("NO SIGNAL", 20),
      range("intensity", "สั่นปกติ", 0, 1, 0.05, 0.2),
      range("hover", "สั่นตอนชี้", 0, 1.5, 0.05, 0.6),
    ],
  ),
  t(
    "Gradient Text",
    "tide-gradient",
    "Tide Gradient",
    "ในตัวอักษรมีน้ำไหล ไล่จากฟ้าถึงน้ำเงินเข้มเลื่อนไปมา ใช้สีน้ำของบ้านจึงเข้ากับทั้งธีมสว่างและมืด",
    ["background-clip text", "water ramp"],
    [words("น้ำขึ้นให้รีบตัก", 32), range("speed", "ความเร็ว (วินาที/รอบ)", 2, 16, 0.5, 6)],
  ),
  t(
    "Falling Text",
    "drop-letters",
    "Drop Letters",
    "แตะคำแล้วตัวอักษรหล่นลงพื้น หมุนและเด้ง แตะอีกครั้งให้ลุกกลับขึ้นมา",
    ["spring drop", "tap toggle"],
    [words("แรงโน้มถ่วง", 24), range("bounce", "ความเด้ง", 0, 0.8, 0.05, 0.5)],
  ),
  t(
    "Text Cursor",
    "trail-cursor",
    "Trail Cursor",
    "ลากเมาส์หรือนิ้วผ่านกรอบ ทิ้งรอยคำหรือสัญลักษณ์สั้นๆ ที่ค่อยจางและจมลง",
    ["pointer trail", "fade out"],
    [
      words("◆", 8),
      range("spacing", "ระยะห่าง (px)", 8, 80, 2, 28),
      range("max", "จำนวนรอยสูงสุด", 4, 30, 1, 14),
    ],
  ),
  t(
    "True Focus",
    "focus-frame",
    "Focus Frame",
    "ช่องมองภาพกระโดดจากคำหนึ่งไปอีกคำ คำในกรอบชัด คำอื่นเบลอ ชี้คำเพื่อเลือกเองได้",
    ["shared layout frame", "blur others"],
    [
      words("ดู ทีละ คำ ให้ ชัด", 60),
      range("interval", "เลื่อนทุก (วินาที)", 0.6, 4, 0.1, 1.4),
      range("blur", "ความเบลอ (px)", 0, 10, 0.5, 4),
    ],
  ),
  t(
    "Scroll Float",
    "scroll-rise",
    "Scroll Rise",
    "เลื่อนในกรอบแล้วตัวอักษรลอยขึ้นเข้าที่ทีละตัวตามระยะที่เลื่อน กรอบเลื่อนเองจึงใส่ในหน้าไหนก็ได้",
    ["scroll progress", "letter rise"],
    [words("ลอยขึ้นมา", 24)],
  ),
  t(
    "Scroll Reveal",
    "scroll-read",
    "Scroll Read",
    "ย่อหน้าที่สว่างขึ้นทีละคำตามการเลื่อน ตาจึงรู้เสมอว่ากำลังอ่านถึงไหน",
    ["scroll progress", "word opacity"],
    [
      words(
        "ทุกคำค่อยๆ สว่างขึ้นตามจังหวะที่คุณเลื่อน อ่านไปพร้อมกัน ไม่ต้องรีบ ไม่มีอะไรหลุดสายตา",
        160,
      ),
    ],
  ),
  t(
    "ASCII Text",
    "glyph-text",
    "Glyph Text",
    "คำที่วาดด้วยตัวพิมพ์ดีด แต่ละช่องเลือกอักขระตามปริมาณหมึก มีคลื่นช้าๆ ส่องผ่าน",
    ["canvas sampling", "ascii ramp", "wave shimmer"],
    [
      words("CROC", 12),
      range("cols", "จำนวนคอลัมน์", 32, 120, 4, 72),
      range("wave", "คลื่น", 0, 1, 0.05, 0.6),
    ],
  ),
  t(
    "Scrambled Text",
    "scatter-scramble",
    "Scatter Scramble",
    "ตัวอักษรใกล้เมาส์แตกเป็นสัญลักษณ์สุ่ม แล้วกลับเป็นตัวเดิมเมื่อเมาส์ผ่านไป",
    ["pointer radius", "glyph scramble", "timed settle"],
    [
      words(
        "Move your pointer over this line and watch the letters near it scramble, then settle back.",
        120,
      ),
      range("radius", "รัศมี (px)", 30, 200, 5, 90),
      range("hold", "ค้าง (มิลลิวินาที)", 100, 1500, 50, 500),
    ],
  ),
  t(
    "Glitch Text",
    "signal-glitch",
    "Signal Glitch",
    "ภาพสัญญาณเสีย สำเนาสีฟ้าและน้ำเงินเลื่อนออกข้างเป็นแถบบางที่กระโดดทุกไม่กี่เฟรม",
    ["clip-path bands", "step jitter"],
    [
      words("GLITCH", 16),
      range("speed", "ความเร็ว (วินาที/รอบ)", 0.5, 5, 0.1, 2),
      toggle("hover", "เฉพาะตอนชี้", false),
    ],
  ),
  t(
    "Scroll Velocity",
    "drift-rows",
    "Drift Rows",
    "ข้อความสองแถบลอยสวนทางกัน หมุนล้อหรือปัดแล้วเร็วขึ้นและกลับทิศตามมือ ก่อนค่อยๆ ช้าลง",
    ["dual marquee", "wheel velocity", "decay"],
    [
      words("crocwork ✦ design ✦ registry ✦ ", 60),
      range("speed", "ความเร็วปกติ (px/วินาที)", 0, 150, 5, 40),
      range("boost", "แรงเร่ง", 0, 20, 1, 6),
    ],
  ),
  t(
    "Variable Proximity",
    "near-weight",
    "Near Weight",
    "ตัวอักษรใกล้เมาส์หนาและสว่างขึ้นบนแกนน้ำหนักของฟอนต์ ไกลออกไปค่อยๆ จางกลับ",
    ["variable weight", "distance falloff"],
    [
      words("ตัวหนังสือรู้ว่าคุณอยู่ใกล้", 60),
      range("radius", "รัศมี (px)", 40, 400, 10, 140),
      pick("falloff", "การลดลง", ["linear", "smooth", "sharp"], "smooth"),
    ],
  ),
  t(
    "Count Up",
    "roll-count",
    "Roll Count",
    "ตัวเลขนับขึ้นจากศูนย์ครั้งแรกที่เห็นแล้วชะลอเข้าค่าจริง ค่าจริงอยู่ใน HTML ตั้งแต่แรก",
    ["in-view trigger", "eased count", "tabular figures"],
    [
      range("to", "นับถึง", 0, 1000000, 10, 12480),
      range("duration", "เวลา (วินาที)", 0.3, 6, 0.1, 2),
      text("label", "คำอธิบาย", "ชิ้นงานที่ส่งแล้ว"),
      toggle("separator", "คั่นหลักพัน", true),
    ],
  ),
];
