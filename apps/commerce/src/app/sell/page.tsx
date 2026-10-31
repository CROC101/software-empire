import { Button, Label } from "@empire/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserId, db } from "@/lib/db";
import { signInUrl } from "@/lib/env";
import { CATEGORIES, formatBaht, isCategory } from "@/lib/market";
import { ActionForm } from "../action-form";
import { deleteService, savePayout } from "../actions";

export const metadata: Metadata = { title: "ขายงาน" };

export default async function SellPage() {
  const me = await currentUserId();
  if (!me) redirect(signInUrl("/sell"));
  const client = await db();
  // RLS: sellers see their own drafts as well as published services, and only their own payout row
  const { data: payout } = await client
    .from("payout_accounts")
    .select("promptpay_id,account_name")
    .maybeSingle();
  const { data: services } = await client
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
            ร่างไว้ก่อนได้ เผยแพร่เมื่อพร้อม ผู้ซื้อโอนเข้าพร้อมเพย์ของคุณโดยตรง
            คุณยืนยันรับเงินแล้วค่อยเริ่มงาน
          </p>
        </div>
        <Button asChild variant="aurora">
          <Link href="/sell/new">+ บริการใหม่</Link>
        </Button>
      </div>

      <section
        aria-labelledby="payout"
        className={`rounded-xl border p-5 ${payout ? "bg-card" : "border-warning/50 bg-warning/5"}`}
      >
        <h2 id="payout" className="font-heading text-lg font-bold">
          ผู้ซื้อโอนเงินให้คุณทางไหน
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {payout
            ? "ผู้ซื้อจะเห็น QR พร้อมเพย์นี้เฉพาะคำสั่งซื้อของตัวเองที่รอชำระอยู่ ระบบไม่ถือเงินของคุณ"
            : "ยังไม่ได้ตั้ง: ผู้ซื้อจะสแกนจ่ายไม่ได้ ใช้เบอร์มือถือหรือเลขวอลเล็ต ไม่รับเลขบัตรประชาชน"}
        </p>
        <ActionForm
          action={savePayout}
          submit={payout ? "บันทึกการแก้ไข" : "บันทึกพร้อมเพย์"}
          variant="outline"
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="promptpay">พร้อมเพย์ (เบอร์มือถือ / วอลเล็ต)</Label>
            <input
              id="promptpay"
              name="promptpay"
              inputMode="numeric"
              required
              defaultValue={payout?.promptpay_id ?? ""}
              placeholder="0812345678"
              className="rounded-md border bg-background px-3 py-2 font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">ชื่อบัญชี</Label>
            <input
              id="name"
              name="name"
              required
              maxLength={80}
              defaultValue={payout?.account_name ?? ""}
              className="rounded-md border bg-background px-3 py-2"
            />
          </div>
        </ActionForm>
      </section>

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
