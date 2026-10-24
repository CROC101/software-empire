import { Button } from "@empire/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserId, db } from "@/lib/db";
import { signInUrl } from "@/lib/env";
import { CATEGORIES, formatBaht, isCategory } from "@/lib/market";
import { deleteService } from "../actions";

export const metadata: Metadata = { title: "ขายงาน" };

export default async function SellPage() {
  const me = await currentUserId();
  if (!me) redirect(signInUrl("/sell"));
  // RLS lets sellers see their own drafts as well as published services
  const { data: services } = await (
    await db()
  )
    .from("services")
    .select("id,title,category,price_satang,delivery_days,published,updated_at")
    .eq("seller_id", me)
    .order("updated_at", { ascending: false });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">sell</p>
          <h1 className="mt-2 font-heading text-3xl font-black tracking-tight">บริการของฉัน</h1>
          <p className="mt-1 text-muted-foreground">
            ร่างไว้ก่อนได้ เผยแพร่เมื่อพร้อม ผู้ซื้อจ่ายเข้าเอสโครว์ คุณได้เงินเมื่อเขากดรับงาน
          </p>
        </div>
        <Button asChild variant="aurora">
          <Link href="/sell/new">+ บริการใหม่</Link>
        </Button>
      </div>

      {services?.length ? (
        <ul className="flex flex-col gap-3">
          {services.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${s.published ? "bg-success/12 text-success" : "bg-muted text-muted-foreground"}`}
                  >
                    {s.published ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                  </span>
                  <span className="truncate font-medium">{s.title}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {isCategory(s.category) ? CATEGORIES[s.category] : "อื่น ๆ"} · ส่งใน{" "}
                  {s.delivery_days} วัน
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="font-heading font-bold tabular-nums">
                  {formatBaht(s.price_satang)}
                </span>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/sell/${s.id}`}>แก้ไข</Link>
                </Button>
                <form action={deleteService}>
                  <input type="hidden" name="serviceId" value={s.id} />
                  <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                    ลบ
                  </Button>
                </form>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          ยังไม่มีบริการ กด “+ บริการใหม่” เพื่อเริ่มขายงานแรก
        </p>
      )}
    </main>
  );
}
