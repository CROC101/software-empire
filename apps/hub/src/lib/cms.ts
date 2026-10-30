import "server-only";
import { readCms, resolveCms, type CmsPage } from "@empire/core/cms";
import { subsystems } from "@empire/core/subsystems";
import { env } from "@/lib/env";

/** Cache tag of every CMS read; the admin's save calls updateTag(CMS_TAG). */
export const CMS_TAG = "cms";

// the hub's home page, top to bottom; keys match the render map in app/page.tsx
const HOME_SECTIONS: [key: string, label: string][] = [
  ["depth", "ความลึกของระบบ"],
  ["croc", "โปสเตอร์ CROCWORK (จระเข้)"],
  ["about", "เกี่ยวกับผม"],
  ["work-reel", "ภาพหน้าจอเดสก์ท็อป"],
  ["work", "ผลงาน"],
  ["work-tunnel", "บินเข้าไปในงาน"],
  ["shots", "หน้าจอจริง"],
  ["laptop", "แล็ปท็อป"],
  ["pocket", "ในกระเป๋า"],
  ["hidden-work", "งานที่มองไม่เห็น"],
  ["skills", "ทักษะ"],
  ["activity", "กราฟกิจกรรม"],
  ["rhythm", "จังหวะการทำงาน"],
  ["codebase", "ขนาดโค้ด"],
  ["services", "รับทำ"],
  ["how", "ทำงานยังไง"],
  ["team", "ทีม"],
  ["wardrobe", "ตู้เสื้อผ้า (บทบาท)"],
  ["faq", "คำถามที่พบบ่อย"],
  ["where", "อยู่ที่ไหน"],
  ["croc-poster", "โปสเตอร์ปิดท้าย"],
  ["contact", "ติดต่อ"],
  ["sign-off", "ลายเซ็นท้ายหน้า"],
];

export const HUB_HOME: CmsPage = {
  app: "hub",
  page: "home",
  label: "หน้าแรก",
  sections: [
    {
      key: "hero",
      label: "ส่วนบนสุด",
      movable: false,
      fields: {
        chip: { kind: "text", label: "ป้ายเล็กบนหัว", default: "ซอฟต์แวร์ · AI · ระบบหลังบ้าน" },
        line1: { kind: "text", label: "หัวข้อ บรรทัด 1", default: "ระบบที่ผมสร้าง" },
        line2: { kind: "text", label: "หัวข้อ บรรทัด 2", default: "ทำงานได้จริง" },
        cta: { kind: "text", label: "ปุ่มหลัก", default: "ดูผลงาน" },
        promise: {
          kind: "text",
          label: "ป้ายข้อเท็จจริงอันสุดท้าย",
          default: "ล็อกอินครั้งเดียว ใช้ได้ทุกระบบ",
        },
      },
    },
    {
      key: "status",
      label: "สถานะระบบ",
      fields: {
        title1: { kind: "text", label: "หัวข้อ บรรทัด 1", default: "ระบบที่ผมทำ" },
        title2: { kind: "text", label: "หัวข้อ บรรทัด 2 (สีฟ้า)", default: "ยังรันอยู่ตอนนี้" },
        intro: {
          kind: "text",
          label: "คำอธิบาย",
          multiline: true,
          default:
            "คนที่คุยงานกับคุณ คือคนที่เขียนโค้ดเอง ตัวเลขข้าง ๆ ไม่ได้แต่ง ดึงจากระบบกับ repo จริง",
        },
        rounds: { kind: "number", label: "จำนวนรอบที่ทำ Community", default: 7 },
      },
    },
    ...HOME_SECTIONS.map(([key, label]) => ({ key, label })),
  ],
};

export const HUB_SUBSYSTEMS: CmsPage = {
  app: "hub",
  page: "subsystems",
  label: "การ์ดระบบย่อย",
  sections: subsystems.map((s) => ({
    key: s.slug,
    label: s.name,
    movable: false,
    fields: { summary: { kind: "text", label: "คำโปรย", multiline: true, default: s.summary } },
  })),
};

/** Every page the admin can edit. Each subsystem adds its own CmsPage here as it reads the CMS. */
export const CMS_PAGES: CmsPage[] = [HUB_HOME, HUB_SUBSYSTEMS];

/** One page's content: cached until the admin saves; defaults when the database is down. */
export async function getContent(page: CmsPage) {
  const rows = await readCms(env, page.app, page.page, {
    cache: "force-cache",
    next: { tags: [CMS_TAG] },
  });
  return resolveCms(page, rows);
}
