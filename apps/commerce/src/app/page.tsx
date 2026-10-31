import { Button } from "@empire/ui";
import Link from "next/link";
import { COMMERCE_HOME } from "@empire/core/cms-pages";
import { getContent } from "@/lib/cms";
import { db } from "@/lib/db";
import { CATEGORIES } from "@/lib/market";
import { ServiceCard } from "./service-card";

const STEPS = [
  { title: "สั่งงาน", body: "บอกรายละเอียดที่ต้องการ ราคาล็อกตามที่ประกาศ" },
  {
    title: "โอนตรงให้ผู้ขาย",
    body: "สแกน QR พร้อมเพย์ของผู้ขาย แล้วกดแจ้งโอน ผู้ขายยืนยันรับเงินแล้วงานจึงเริ่ม",
  },
  { title: "ตรวจรับงาน", body: "พอใจแล้วกดรับงานและรีวิว มีปัญหาเปิดข้อพิพาทให้ผู้ดูแลช่วยตัดสิน" },
];

export default async function HomePage() {
  const cms = await getContent(COMMERCE_HOME);
  const { data: latest } = await (
    await db()
  )
    .from("service_cards")
    .select("id,title,category,price_satang,delivery_days,seller_name,rating,review_count")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-10 pt-10 sm:px-6 sm:pt-16">
      <section className="relative overflow-hidden rounded-3xl bg-rail p-8 text-white shadow-glow sm:p-14">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 size-96 rounded-full bg-aurora opacity-50 blur-3xl"
        />
        <p className="relative text-sm text-white/70">{cms.text("hero.eyebrow")}</p>
        <h1 className="relative mt-2 max-w-2xl font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          {cms.text("hero.title")}
        </h1>
        <p className="relative mt-4 max-w-xl text-white/80">{cms.text("hero.intro")}</p>
        <div className="relative mt-8 flex flex-wrap gap-3">
          <Button asChild variant="aurora" size="lg">
            <Link href="/services">{cms.text("hero.browse")}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20"
          >
            <Link href="/sell">{cms.text("hero.sell")}</Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="how" className="flex flex-col gap-6">
        <h2 id="how" className="font-heading text-2xl font-bold tracking-tight">
          จ้างงานทำงานอย่างไร
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border bg-card p-5">
              <span className="grid size-9 place-items-center rounded-full bg-aurora font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-3 font-heading font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="categories" className="flex flex-col gap-4">
        <h2 id="categories" className="font-heading text-2xl font-bold tracking-tight">
          หมวดหมู่
        </h2>
        <ul className="flex flex-wrap gap-2">
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <li key={key}>
              <Link
                href={`/services?category=${key}`}
                className="inline-block rounded-full border bg-card px-4 py-2 text-sm hover:border-primary hover:text-primary"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="latest" className="flex flex-col gap-4">
        <h2 id="latest" className="font-heading text-2xl font-bold tracking-tight">
          บริการล่าสุด
        </h2>
        {latest?.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((service) => (
              <li key={service.id}>
                <ServiceCard service={service} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">ยังไม่มีบริการ — เป็นคนแรกที่เปิดขายได้เลย</p>
        )}
      </section>
    </main>
  );
}
