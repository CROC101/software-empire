/// Pure rules shared by pages and server actions — money formatting and what each side may do next.
/// The database enforces the same state machine (commerce.step); this only decides which buttons show.
import { z } from "zod";

export const CATEGORIES = {
  DEVELOPMENT: "พัฒนาโปรแกรม",
  DESIGN: "ออกแบบ",
  WRITING: "เขียนและแปล",
  MARKETING: "การตลาด",
  VIDEO: "วิดีโอและแอนิเมชัน",
  AI: "AI และข้อมูล",
  OTHER: "อื่น ๆ",
} as const;
export type Category = keyof typeof CATEGORIES;
export const isCategory = (value: unknown): value is Category =>
  typeof value === "string" && value in CATEGORIES;

export type OrderStatus =
  "CREATED" | "FUNDED" | "DELIVERED" | "RELEASED" | "CANCELLED" | "DISPUTED" | "REFUNDED";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  CREATED: "รอชำระเงิน",
  FUNDED: "ชำระแล้ว · กำลังทำงาน",
  DELIVERED: "ส่งมอบแล้ว · รอผู้ซื้อตรวจรับ",
  RELEASED: "เสร็จสิ้น · โอนเงินให้ผู้ขายแล้ว",
  CANCELLED: "ยกเลิกแล้ว",
  DISPUTED: "มีข้อพิพาท · รอผู้ดูแลตัดสิน",
  REFUNDED: "คืนเงินผู้ซื้อแล้ว",
};

const BAHT = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Money lives as integer satang everywhere; only screens see baht. */
export const formatBaht = (satang: number | bigint) => BAHT.format(Number(satang) / 100);

/** "1,250.50" → 125050 satang. Rejects more than 2 decimals instead of rounding money. */
export const bahtInput = z
  .string()
  .trim()
  .transform((s) => s.replaceAll(",", ""))
  .pipe(z.string().regex(/^\d{1,7}(\.\d{1,2})?$/, "ใส่จำนวนเงินเป็นบาท ทศนิยมไม่เกิน 2 ตำแหน่ง"))
  .transform((s) => {
    const [whole = "0", fraction = ""] = s.split(".");
    return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  });

export type Side = "buyer" | "seller" | "staff" | "none";
export type OrderAction =
  "fund" | "cancel" | "deliver" | "release" | "dispute" | "resolve" | "review";

/** What the viewer may do now — mirrors the SQL state machine so the UI never offers a dead button. */
export function availableActions(
  status: OrderStatus,
  side: Side,
  opts: { reviewed?: boolean } = {},
): OrderAction[] {
  const actions: OrderAction[] = [];
  if (status === "CREATED" && side === "buyer") actions.push("fund");
  if (status === "CREATED" && (side === "buyer" || side === "seller")) actions.push("cancel");
  if (status === "FUNDED" && side === "seller") actions.push("deliver", "cancel");
  if (status === "DELIVERED" && side === "buyer") actions.push("release");
  if ((status === "FUNDED" || status === "DELIVERED") && (side === "buyer" || side === "seller"))
    actions.push("dispute");
  if (status === "DISPUTED" && side === "staff") actions.push("resolve");
  if (status === "RELEASED" && side === "buyer" && !opts.reviewed) actions.push("review");
  return actions;
}

export function sideOf(
  order: { buyer_id: string; seller_id: string },
  me: string | null,
  staff: boolean,
): Side {
  if (me === order.buyer_id) return "buyer";
  if (me === order.seller_id) return "seller";
  return staff ? "staff" : "none";
}
