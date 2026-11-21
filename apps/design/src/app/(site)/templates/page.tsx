import type { Metadata } from "next";
import { TemplateList } from "@/components/template-list";
import { templates } from "@/lib/templates";

export const metadata: Metadata = {
  title: "เทมเพลตแอป",
  description: "แอปต้นแบบทั้งตัว ดูตัวอย่างสดได้ และดาวน์โหลดซอร์สไปแก้ต่อได้",
};

export default function TemplatesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <header className="py-12">
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Templates · {templates.length} apps
        </p>
        <h1 className="mt-3 font-heading text-4xl leading-tight font-black sm:text-5xl">
          แอปต้นแบบทั้งตัว
          <span className="block text-(--em-blue-600) dark:text-(--em-sky-400)">
            ดูของจริง แล้วเอาซอร์สไปทำต่อ
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          แต่ละตัวได้แรงบันดาลใจจากแอปที่คนใช้กันทุกวัน แล้วทำใหม่ด้วยชื่อและแบรนด์ของเราเอง
          ข้อมูลในตัวอย่างเป็นข้อมูลสมมติ ดาวน์โหลดซอร์สไปเปิดแก้ต่อในเครื่องได้
        </p>
      </header>
      <TemplateList />
      <p className="mt-16 max-w-3xl text-sm text-muted-foreground">
        ชื่อและโลโก้ของ Netflix, YouTube, Spotify, TikTok, Instagram, Fastwork, Canva, 21st.dev,
        React Bits และ ArtCraft เป็นเครื่องหมายการค้าของเจ้าของแต่ละราย ใช้ที่นี่เพื่อบอกว่าเทมเพลตไหนได้แรงบันดาลใจจากอะไรเท่านั้น
        เราไม่ได้เกี่ยวข้องหรือได้รับการรับรองจากบริษัทเหล่านี้ ภาพยนตร์ตัวอย่างใน Lumora มาจาก Blender
        Foundation (CC BY)
      </p>
    </main>
  );
}
