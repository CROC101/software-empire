import { useEffect } from "react";
import { rememberRecent } from "@/lib/tools/prefs";

/// บันทึกว่าเพิ่งเปิดเครื่องมือนี้ (ใช้ในหน้าของเครื่องมือที่มีโฟลเดอร์ของตัวเอง)
export function RememberRecent({ slug }: { slug: string }) {
  useEffect(() => rememberRecent(slug), [slug]);

  return null;
}
