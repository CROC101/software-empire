import type { Metadata } from "next";
import { TemplatePreview } from "@/components/template-preview";
import { templateBase, templates, templateZip } from "@/lib/templates";

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
      <ul className="grid gap-x-6 gap-y-12 md:grid-cols-2">
        {templates.map((t) => (
          <li key={t.slug} className="flex flex-col gap-3">
            <TemplatePreview src={templateBase(t.slug)} title={`ตัวอย่าง ${t.name}`} />
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="font-heading text-xl font-black">{t.name}</h2>
              <span className="font-mono text-xs text-muted-foreground">{t.stack}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t.about}</p>
            <p className="flex items-center gap-2 text-sm">
              {t.inspired.icon && (
                // eslint-disable-next-line @next/next/no-img-element -- a 20px static svg
                <img src={`/brands/${t.inspired.icon}.svg`} alt="" className="size-5" />
              )}
              <span>
                แรงบันดาลใจจาก{" "}
                {t.inspired.url ? (
                  <a
                    href={t.inspired.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 hover:text-(--em-blue-600) dark:hover:text-(--em-sky-400)"
                  >
                    {t.inspired.name}
                  </a>
                ) : (
                  t.inspired.name
                )}
              </span>
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              <a
                href={templateZip(t.slug)}
                download
                className="rounded-md bg-foreground px-3 py-1.5 text-background hover:opacity-90"
              >
                ดาวน์โหลดซอร์ส
              </a>
              <a
                href={templateBase(t.slug)}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border px-3 py-1.5 hover:bg-muted"
              >
                เปิดเต็มจอ <span aria-hidden>↗</span>
              </a>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-16 max-w-3xl text-sm text-muted-foreground">
        ชื่อและโลโก้ของ Netflix, YouTube, Spotify, TikTok, Instagram, Fastwork, Canva, 21st.dev
        และ ArtCraft เป็นเครื่องหมายการค้าของเจ้าของแต่ละราย ใช้ที่นี่เพื่อบอกว่าเทมเพลตไหนได้แรงบันดาลใจจากอะไรเท่านั้น
        เราไม่ได้เกี่ยวข้องหรือได้รับการรับรองจากบริษัทเหล่านี้ ภาพยนตร์ตัวอย่างใน Lumora มาจาก Blender
        Foundation (CC BY)
      </p>
    </main>
  );
}
