import { def, text, type Category, type Control, type Entry } from "../types";

const added = "2026-11-19";
const b = (
  category: Category,
  slug: string,
  name: string,
  summary: string,
  blend: readonly string[],
  controls: readonly Control[] = [],
  rank?: number,
) => def(added, category, slug, name, summary, blend, controls, rank);

/**
 * Blocks: whole website sections that follow the site theme (semantic tokens) and reflow with
 * container queries. Templates stitch blocks into full pages.
 */
export const blocks: readonly Entry[] = [
  b(
    "hero",
    "hero-split",
    "Hero Split",
    "หัวข้อใหญ่สองบรรทัดทางซ้าย ภาพตัวอย่างลอยทางขวา ปุ่มหลักกับปุ่มรอง",
    ["split hero", "floating mockup"],
    [
      text("title", "หัวข้อ", "สร้างเว็บที่คนจำได้"),
      text("accent", "บรรทัดสีฟ้า", "ในวันเดียว"),
      text("cta", "ปุ่มหลัก", "เริ่มฟรี", 20),
    ],
    30,
  ),
  b(
    "hero",
    "hero-centered",
    "Hero Centered",
    "หัวข้อกลางจอ ชิปประกาศ แสงใต้น้ำข้างหลัง และช่องใส่อีเมล",
    ["centered hero", "aurora glow", "email capture"],
    [
      text("title", "หัวข้อ", "ทุกอย่างที่ทีมต้องใช้ ในที่เดียว"),
      text("cta", "ปุ่ม", "ขอเข้าใช้ก่อน", 20),
    ],
  ),
  b(
    "hero",
    "hero-terminal",
    "Hero Terminal",
    "หัวข้อคู่หน้าต่างเทอร์มินัลที่พิมพ์คำสั่งทีละบรรทัด",
    ["developer hero", "terminal typing"],
    [text("title", "หัวข้อ", "ติดตั้งครั้งเดียว ใช้ได้ทุกแอป")],
  ),
  b(
    "chrome",
    "header-glass",
    "Glass Header",
    "แถบหัวเว็บกระจก เมนูกลาง ปุ่มขวา มือถือเป็นเมนูพับ",
    ["glass navbar", "mobile sheet"],
    [text("brand", "ชื่อแบรนด์", "crocwork", 20)],
  ),
  b(
    "chrome",
    "header-mega",
    "Mega Menu Header",
    "หัวเว็บที่ชี้หรือกดแล้วกางเมนูใหญ่เป็นหมวดพร้อมคำอธิบาย",
    ["mega menu", "panel"],
  ),
  b(
    "chrome",
    "footer-columns",
    "Footer Columns",
    "ท้ายเว็บหลายคอลัมน์ ช่องรับข่าว และบรรทัดลิขสิทธิ์",
    ["footer", "link columns"],
  ),
  b(
    "features",
    "features-grid",
    "Feature Grid",
    "ไอคอนพร้อมหัวข้อสั้นหกช่อง ลอยขึ้นทีละช่องเมื่อเห็น",
    ["feature grid", "stagger"],
    [text("title", "หัวข้อ", "ครบในที่เดียว")],
  ),
  b("features", "features-bento", "Feature Bento", "เบนโตหลายขนาด แต่ละกล่องมีภาพจำลองที่ขยับได้", [
    "bento",
    "live mockups",
  ]),
  b(
    "features",
    "features-alternating",
    "Alternating Features",
    "ภาพสลับซ้ายขวากับข้อความทีละหัวข้อ",
    ["zigzag", "media rows"],
  ),
  b(
    "proof",
    "testimonials-wall",
    "Testimonial Wall",
    "รีวิวหลายคอลัมน์ไหลช้าสวนทางกัน ชี้แล้วหยุด",
    ["review wall", "vertical marquee"],
  ),
  b("proof", "logo-cloud", "Logo Cloud", "แถบโลโก้ลูกค้าสมมติวิ่งไม่หยุดพร้อมขอบจาง", [
    "logo strip",
    "marquee",
  ]),
  b("proof", "stats-band", "Stats Band", "แถบตัวเลขใหญ่บนพื้นเข้ม นับขึ้นเมื่อเลื่อนมาเห็น", [
    "stats",
    "count up",
  ]),
  b(
    "pricing",
    "pricing-tiers",
    "Pricing Tiers",
    "สามแพ็กเกจ สลับรายเดือนรายปี แพ็กกลางเด่น",
    ["pricing cards", "billing toggle"],
    [],
    31,
  ),
  b(
    "pricing",
    "pricing-compare",
    "Pricing Compare",
    "ตารางเทียบฟีเจอร์ทุกแพ็กเกจ มือถือเลื่อนแนวนอนได้",
    ["comparison table", "sticky column"],
  ),
  b(
    "conversion",
    "cta-tide",
    "CTA Tide",
    "แถบชวนกดปิดท้าย มีน้ำค่อยๆ ขึ้นจากด้านล่าง",
    ["closing CTA", "rising water"],
    [text("title", "หัวข้อ", "พร้อมลงน้ำหรือยัง"), text("cta", "ปุ่ม", "คุยกับเรา", 20)],
  ),
  b(
    "conversion",
    "newsletter-box",
    "Newsletter",
    "กล่องสมัครรับข่าว ตรวจอีเมลก่อนส่ง แล้วขึ้นข้อความขอบคุณ",
    ["newsletter", "inline validation"],
  ),
  b("conversion", "contact-split", "Contact Split", "ข้อมูลติดต่อซ้าย ฟอร์มขวา ตรวจข้อมูลก่อนส่ง", [
    "contact form",
    "split layout",
  ]),
  b("conversion", "faq-accordion", "FAQ", "คำถามพบบ่อยแบบกางทีละข้อ", ["faq", "accordion"]),
  b("content", "team-grid", "Team Grid", "การ์ดทีมพร้อมตำแหน่ง ชี้แล้วเห็นลิงก์", [
    "team",
    "hover reveal",
  ]),
  b("content", "blog-cards", "Blog Cards", "การ์ดบทความล่าสุดพร้อมหมวดและเวลาอ่าน", [
    "blog",
    "cards",
  ]),
  b("content", "steps-timeline", "Steps", "ขั้นตอนการทำงานเป็นเลขลำดับเชื่อมด้วยเส้น", [
    "steps",
    "process",
  ]),
  b(
    "pages",
    "auth-card",
    "Sign-in Card",
    "กล่องเข้าสู่ระบบพร้อมปุ่มดูรหัสและลิงก์สมัคร (หน้าตาเท่านั้น ไม่ส่งข้อมูล)",
    ["auth form", "show password"],
  ),
  b("pages", "not-found", "404 Tide", "หน้าไม่พบที่เลข 404 ลอยอยู่บนน้ำพร้อมเงาสะท้อน", [
    "404",
    "floating reflection",
  ]),
  b(
    "pages",
    "dashboard-shell",
    "Dashboard Shell",
    "โครงหน้าแดชบอร์ด แถบข้าง หัว การ์ดตัวเลข และกราฟ",
    ["app shell", "stat cards"],
  ),

  b(
    "page",
    "saas-landing",
    "SaaS Landing",
    "หน้าขายซอฟต์แวร์ครบชุด ตั้งแต่ Hero ถึงท้ายเว็บ",
    ["landing page", "10 sections"],
    [],
    32,
  ),
  b(
    "page",
    "portfolio-page",
    "Portfolio",
    "หน้าพอร์ตโฟลิโอฟรีแลนซ์ ผลงาน ขั้นตอน รีวิว และฟอร์มติดต่อ",
    ["portfolio", "7 sections"],
  ),
  b("page", "agency-page", "Agency", "หน้าเอเจนซีที่มีเมนูใหญ่ บริการ ทีม บทความ และปุ่มชวนคุย", [
    "agency site",
    "7 sections",
  ]),
  b(
    "page",
    "launch-page",
    "Product Launch",
    "หน้าเปิดตัวสินค้า ชวนลงชื่อรอ เทียบราคา และคำถามพบบ่อย",
    ["launch page", "6 sections"],
  ),
];
