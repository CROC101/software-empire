import type { Metadata } from "next";
import { PageSections } from "../page-sections";
import { SiteShell } from "../site-shell";

export const metadata: Metadata = {
  title: "ผลงาน",
  description: "8 ระบบที่ทำเองคนเดียว พร้อมหน้าจอจริงบนโน้ตบุ๊กและมือถือ",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    <SiteShell>
      <PageSections page="work" />
    </SiteShell>
  );
}
