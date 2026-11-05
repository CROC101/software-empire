import type { Metadata } from "next";
import { PageSections } from "../page-sections";
import { SiteShell } from "../site-shell";

export const metadata: Metadata = {
  title: "เกี่ยวกับ",
  description: "คนเดียวทั้งทีม: บทบาท ทักษะ กิจกรรมบน GitHub และเวลาที่ทำงาน",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <SiteShell>
      <PageSections page="about" />
    </SiteShell>
  );
}
