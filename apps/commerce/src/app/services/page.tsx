import { Input } from "@empire/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { CATEGORIES, isCategory } from "@/lib/market";
import { ServiceCard } from "../service-card";

export const metadata: Metadata = { title: "บริการทั้งหมด" };

export default async function ServicesPage({ searchParams }: PageProps<"/services">) {
  const params = await searchParams;
  const category = isCategory(params.category) ? params.category : null;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";

  let request = (await db())
    .from("service_cards")
    .select("id,title,category,price_satang,delivery_days,seller_name,rating,review_count")
    .eq("published", true);
  if (category) request = request.eq("category", category);
  // escape the LIKE wildcards so a search for "100%" means exactly that
  if (q) request = request.ilike("title", `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
  const { data: services } = await request.order("created_at", { ascending: false }).limit(60);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {category ? CATEGORIES[category] : "บริการทั้งหมด"}
        </h1>
        <p className="text-muted-foreground">ราคาล็อกตอนสั่ง ชำระผ่านเอสโครว์ทุกงาน</p>
      </div>
      <form className="flex flex-wrap gap-2" role="search">
        {category && <input type="hidden" name="category" value={category} />}
        <Input
          name="q"
          defaultValue={q}
          placeholder="ค้นหาบริการ…"
          aria-label="ค้นหาบริการ"
          className="max-w-sm"
        />
      </form>
      <nav aria-label="หมวดหมู่" className="flex flex-wrap gap-2">
        <Link
          href="/services"
          className={`rounded-full border px-3 py-1.5 text-sm ${category ? "bg-card" : "border-primary bg-secondary text-primary"}`}
        >
          ทั้งหมด
        </Link>
        {Object.entries(CATEGORIES).map(([key, label]) => (
          <Link
            key={key}
            href={`/services?category=${key}`}
            className={`rounded-full border px-3 py-1.5 text-sm ${key === category ? "border-primary bg-secondary text-primary" : "bg-card"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {services?.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <li key={service.id}>
              <ServiceCard service={service} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-16 text-center text-muted-foreground">ไม่พบบริการที่ตรงกับเงื่อนไข</p>
      )}
    </main>
  );
}
