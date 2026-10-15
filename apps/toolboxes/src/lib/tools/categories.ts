import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BookOpen,
  Braces,
  Calculator,
  CalendarClock,
  FileText,
  Globe,
  Image as ImageIcon,
  Network,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { CategoryKey } from "./types";

/// หมวดของเครื่องมือ (12 หมวดแบบ 100tools.dev + รูปภาพ/เอกสารของบรีฟ)
export interface Category {
  key: CategoryKey;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const CATEGORIES: Category[] = [
  {
    key: "developer",
    label: "นักพัฒนา",
    description: "จัดรูปแบบ เข้ารหัส ถอดรหัส และตรวจข้อมูลที่ใช้เขียนโปรแกรม",
    icon: Braces,
  },
  {
    key: "text",
    label: "ข้อความ",
    description: "นับ แปลง เรียง ล้าง และเปรียบเทียบข้อความ",
    icon: FileText,
  },
  {
    key: "calculator",
    label: "เครื่องคิดเลข",
    description: "คำนวณทั่วไป สัดส่วน สุขภาพ และเกรดเฉลี่ย",
    icon: Calculator,
  },
  {
    key: "converter",
    label: "แปลงค่า",
    description: "แปลงสี หน่วย เลขฐาน CSV YAML JSON และอื่น ๆ",
    icon: Repeat,
  },
  {
    key: "generator",
    label: "สร้างข้อมูล",
    description: "สร้าง UUID รหัสผ่าน QR code ตัวเลขสุ่ม และข้อมูลทดสอบ",
    icon: Sparkles,
  },
  {
    key: "network",
    label: "เครือข่าย",
    description: "ตรวจ IP คำนวณ CIDR และ subnet",
    icon: Network,
  },
  {
    key: "seo",
    label: "SEO",
    description: "สร้างและดูตัวอย่าง meta tag ที่เครื่องมือค้นหาใช้",
    icon: Search,
  },
  {
    key: "security",
    label: "ความปลอดภัย",
    description: "Hash ลายเซ็น รหัสผ่าน token และรหัสใช้ครั้งเดียว",
    icon: ShieldCheck,
  },
  {
    key: "identity",
    label: "ตรวจเลขประจำตัว",
    description: "ตรวจรูปแบบเลขบัตรประชาชน เบอร์โทร บัตร และบัญชี",
    icon: BadgeCheck,
  },
  {
    key: "finance",
    label: "การเงิน",
    description: "ส่วนลด ภาษี ดอกเบี้ย ผ่อนชำระ และจุดคุ้มทุน",
    icon: Wallet,
  },
  {
    key: "time",
    label: "วันและเวลา",
    description: "แปลง timestamp นับวัน อายุ เขตเวลา และ cron",
    icon: CalendarClock,
  },
  {
    key: "reference",
    label: "อ้างอิง",
    description: "รหัสสถานะ HTTP ชนิดไฟล์ และข้อมูลเบราว์เซอร์",
    icon: BookOpen,
  },
  {
    key: "image",
    label: "รูปภาพ",
    description: "บีบอัด ย่อ ครอป แปลงไฟล์ และดูดสีจากรูป",
    icon: ImageIcon,
  },
  {
    key: "document",
    label: "เอกสาร",
    description: "เปรียบเทียบไฟล์ แปลง PDF และตรวจ CSV",
    icon: Globe,
  },
];

export function categoryOf(key: CategoryKey): Category {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];
}
