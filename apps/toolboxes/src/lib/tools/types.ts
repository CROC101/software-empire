import type { LucideIcon } from "lucide-react";

/// ทะเบียนเครื่องมือ — เครื่องมือหนึ่งตัว = ช่องกรอก (fields) + ฟังก์ชันคำนวณล้วน (run) + ผลลัพธ์ชนิดหนึ่ง
///
/// ตัวแสดงผลกลาง (components/tools/spec-tool.tsx) วาดฟอร์ม ปุ่ม และผลลัพธ์ให้ทุกตัว
/// เครื่องมือทุกตัวทำงานในเบราว์เซอร์ของผู้ใช้ — ข้อความ/ไฟล์ไม่ถูกส่งออกจากเครื่อง (บรีฟ: ความปลอดภัยสำคัญที่สุด)
/// ข้อผิดพลาดของผู้ใช้ (กรอกผิดรูปแบบ) ให้ `throw new Error('ข้อความภาษาไทย')` — ตัวแสดงผลจะแสดงข้อความนั้น

export type CategoryKey =
  | "developer"
  | "text"
  | "calculator"
  | "converter"
  | "generator"
  | "network"
  | "seo"
  | "security"
  | "identity"
  | "finance"
  | "time"
  | "reference"
  | "image"
  | "document";

export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "checkbox"
  | "date"
  | "datetime-local"
  | "color"
  | "password";

export type FieldValue = string | number | boolean;

export interface Field {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: FieldValue;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  /// คำอธิบายใต้ช่อง
  help?: string;
  /// ตัวอักษรแบบโค้ด (JSON · regex · hash)
  mono?: boolean;
  /// แสดงช่องนี้เฉพาะเมื่อช่อง `key` มีค่าตรงกับค่าใดค่าหนึ่งใน `in`
  when?: { key: string; in: string[] };
}

export type Values = Record<string, FieldValue>;

export interface ResultRow {
  label: string;
  value: string;
  mono?: boolean;
}

export type ToolOutput =
  | {
      kind: "text";
      text: string;
      mono?: boolean;
      download?: { filename: string; mime: string };
      note?: string;
    }
  | { kind: "rows"; rows: ResultRow[]; note?: string }
  | { kind: "table"; columns: string[]; rows: string[][]; note?: string }
  | { kind: "markdown"; markdown: string }
  | {
      kind: "qr";
      value: string;
      size: number;
      foreground: string;
      background: string;
      level: "L" | "M" | "Q" | "H";
    }
  | { kind: "swatches"; items: { label: string; color: string }[]; rows?: ResultRow[] }
  | { kind: "diff"; lines: { type: "same" | "add" | "del"; text: string }[]; summary: string }
  | { kind: "highlight"; text: string; ranges: { start: number; end: number }[]; rows: ResultRow[] }
  | { kind: "serp"; title: string; url: string; description: string }
  | { kind: "card"; title: string; description: string; site: string; image: string | null };

export interface ToolMeta {
  slug: string;
  name: string;
  description: string;
  category: CategoryKey;
  icon: LucideIcon;
  /// คำค้นเพิ่มเติม (อังกฤษ/ไทย) ให้ค้นเจอ
  keywords?: string[];
}

export interface SpecTool extends ToolMeta {
  kind: "spec";
  fields: Field[];
  run: (values: Values) => ToolOutput | Promise<ToolOutput>;
  /// คำนวณใหม่ทุกครั้งที่กรอก (ไม่ต้องกดปุ่ม) — ใช้กับงานเบา ๆ
  live?: boolean;
  /// ข้อความบนปุ่ม (ไม่ live) เช่น "สร้าง" "ตรวจสอบ"
  action?: string;
  /// เครื่องมือที่ใช้ความสุ่ม — มีปุ่ม "สุ่มใหม่" และไม่ live
  random?: boolean;
}

/// เครื่องมือที่มีหน้าของตัวเอง (งานไฟล์/รูปที่ต้องมี UI เฉพาะ)
export interface PageTool extends ToolMeta {
  kind: "page";
  href: string;
}

export type Tool = SpecTool | PageTool;

export function str(values: Values, key: string): string {
  const value = values[key];

  return typeof value === "string" ? value : value === undefined ? "" : String(value);
}

export function num(values: Values, key: string, label = key): number {
  const raw = values[key];
  const value =
    typeof raw === "number"
      ? raw
      : Number(
          String(raw ?? "")
            .replace(/,/g, "")
            .trim(),
        );

  if (raw === "" || raw === undefined || !Number.isFinite(value))
    throw new Error(`กรุณากรอก${label}เป็นตัวเลข`);

  return value;
}

export function bool(values: Values, key: string): boolean {
  return values[key] === true || values[key] === "true";
}
