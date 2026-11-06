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

export const TAROT_HOME: CmsPage = {
  app: "tarot",
  page: "home",
  label: "หน้าแรก",
  sections: [
    {
      key: "announce",
      label: "ประกาศ",
      fields: {
        title: { kind: "text", label: "หัวข้อประกาศ", default: "ยินดีต้อนรับสู่ crocwork tarot" },
        body: {
          kind: "text",
          label: "ข้อความ",
          multiline: true,
          default: "เช็กอินทุกวันเพื่อสะสมเหรียญ แล้วลองกระดานความรักหรือเซลติกครอสดู",
        },
      },
    },
    {
      key: "faq",
      label: "คำถามที่พบบ่อย (เว้นคำถามว่างเพื่อซ่อนข้อนั้น)",
      fields: {
        q1: { kind: "text", label: "คำถาม 1", default: "ไพ่ประจำวันเปลี่ยนเมื่อไร" },
        a1: {
          kind: "text",
          label: "คำตอบ 1",
          multiline: true,
          default: "เปลี่ยนตอนเที่ยงคืนตามเวลาไทย แต่ละคนได้ไพ่ของตัวเอง ทั้งวันจะเป็นใบเดิม",
        },
        q2: { kind: "text", label: "คำถาม 2", default: "เหรียญได้มาจากไหน" },
        a2: {
          kind: "text",
          label: "คำตอบ 2",
          multiline: true,
          default: "เช็กอินวันละครั้งได้ 10 เหรียญ ถ้าเช็กอินติดกันครบวันที่ 7 ได้ 30 เหรียญ",
        },
        q3: { kind: "text", label: "คำถาม 3", default: "เหรียญใช้ทำอะไร" },
        a3: {
          kind: "text",
          label: "คำตอบ 3",
          multiline: true,
          default:
            "เปิดกระดานไพ่พิเศษ เช่น ความรัก 5 ใบ และเซลติกครอส ส่วนไพ่ใบเดียว สามใบ และใช่หรือไม่ ใช้ฟรี",
        },
        q4: { kind: "text", label: "คำถาม 4", default: "ไพ่กลับหัวแปลว่าร้ายไหม" },
        a4: {
          kind: "text",
          label: "คำตอบ 4",
          multiline: true,
          default:
            "ไม่เสมอไป ไพ่กลับหัวคือพลังเดียวกันที่ติดขัดหรือหันเข้าข้างใน อ่านคู่กับคำถามของคุณ",
        },
        q5: { kind: "text", label: "คำถาม 5", default: "ข้อมูลของฉันเก็บอะไรบ้าง" },
        a5: {
          kind: "text",
          label: "คำตอบ 5",
          multiline: true,
          default:
            "ชื่อเล่น วันเกิด เพศ การเช็กอิน และประวัติการอ่านไพ่ เห็นได้เฉพาะคุณ ซ่อนประวัติได้ทุกเมื่อ",
        },
      },
    },
    {
      key: "contact",
      label: "ติดต่อ",
      fields: {
        line: { kind: "text", label: "LINE ID (เว้นว่างเพื่อซ่อนปุ่ม LINE)", default: "" },
      },
    },
  ],
};

// shortcut: community (all routes behind sign-in, no landing) and crocbyte (Firebase, TH/EN copy
// in its i18n table) are not listed; add them when they get a public page that reads Supabase
export const SUBSYSTEM_PAGES: CmsPage[] = [TOOLBOXES_HOME, CANVA_HOME, COMMERCE_HOME, TAROT_HOME];
