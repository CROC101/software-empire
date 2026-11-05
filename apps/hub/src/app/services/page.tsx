import type { Metadata } from "next";
import { PageSections } from "../page-sections";
import { SiteShell } from "../site-shell";

export const metadata: Metadata = {
  title: "รับทำอะไร",
  description: "บริการ ขั้นตอนการทำงาน คำถามที่พบบ่อย และช่องทางติดต่อ",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <SiteShell>
      <PageSections page="services" />
    </SiteShell>
  );
}
