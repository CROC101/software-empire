import type { CmsPage } from "./cms";

/**
 * The subsystems' editable pages, shared so the hub's /admin can list them and each app can read
 * them. Defaults are the copy the apps shipped with; edit it in code here, override it at /admin.
 */
export const TOOLBOXES_HOME: CmsPage = {
  app: "toolboxes",
  page: "home",
  label: "หน้าแรก",
  sections: [
    {
      key: "hero",
      label: "ส่วนบนสุด",
      movable: false,
      fields: {
        title: { kind: "text", label: "หัวข้อ", default: "เครื่องมือออนไลน์ฟรี" },
        intro: {
          kind: "text",
          label: "คำอธิบาย",
          multiline: true,
          default: "สำหรับนักพัฒนาและทุกคน — แปลง คำนวณ สร้าง ตรวจ ทำงานในเบราว์เซอร์ทั้งหมด",
        },
        perk1: { kind: "text", label: "จุดเด่น 1", default: "ข้อมูลไม่ออกจากเครื่อง" },
        perk2: { kind: "text", label: "จุดเด่น 2", default: "ผลลัพธ์ทันทีขณะพิมพ์" },
        perk3: { kind: "text", label: "จุดเด่น 3", default: "ฟรี ไม่มีโฆษณา" },
      },
    },
  ],
};

export const CANVA_HOME: CmsPage = {
  app: "canva",
  page: "home",
  label: "หน้าแรก",
  sections: [
    {
      key: "hero",
      label: "ส่วนบนสุด",
      movable: false,
      fields: { title: { kind: "text", label: "หัวข้อ", default: "วันนี้คุณจะดีไซน์อะไร?" } },
    },
  ],
};

export const COMMERCE_HOME: CmsPage = {
  app: "commerce",
  page: "home",
  label: "หน้าแรก",
  sections: [
    {
      key: "hero",
      label: "ส่วนบนสุด",
      movable: false,
      fields: {
        eyebrow: { kind: "text", label: "ป้ายเล็กบนหัว", default: "ระบบย่อย 2 · Software Empire" },
        title: { kind: "text", label: "หัวข้อ", default: "จ้างฟรีแลนซ์ จ่ายตรงถึงคนทำงาน" },
        intro: {
          kind: "text",
          label: "คำอธิบาย",
          multiline: true,
          default:
            "ไม่มีคนกลางถือเงิน ไม่มีค่าธรรมเนียม ผู้ซื้อโอนเข้าพร้อมเพย์ของผู้ขายโดยตรง ทุกขั้นบันทึกในไทม์ไลน์ของคำสั่งซื้อ",
        },
        browse: { kind: "text", label: "ปุ่มหลัก", default: "ดูบริการทั้งหมด" },
        sell: { kind: "text", label: "ปุ่มรอง", default: "เริ่มขายงาน" },
      },
    },
  ],
};

// shortcut: community (all routes behind sign-in, no landing) and crocbyte (Firebase, TH/EN copy
// in its i18n table) are not listed; add them when they get a public page that reads Supabase
export const SUBSYSTEM_PAGES: CmsPage[] = [TOOLBOXES_HOME, CANVA_HOME, COMMERCE_HOME];
