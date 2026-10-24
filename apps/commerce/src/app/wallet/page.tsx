import { Label } from "@empire/ui";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUserId, db, walletBalance } from "@/lib/db";
import { signInUrl } from "@/lib/env";
import { formatBaht } from "@/lib/market";
import { ActionForm } from "../action-form";
import { topUp } from "../actions";

export const metadata: Metadata = { title: "กระเป๋าเงิน" };

export default async function WalletPage() {
  if (!(await currentUserId())) redirect(signInUrl("/wallet"));
  const [balance, { data: rows }] = await Promise.all([
    walletBalance(),
    (await db())
      .from("my_wallet")
      .select("id,amount_satang,memo,order_id,created_at")
      .order("id", { ascending: false })
      .limit(100),
  ]);

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_20rem]">
      <section className="flex flex-col gap-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">wallet</p>
          <h1 className="mt-2 font-heading text-3xl font-black tracking-tight">กระเป๋าเงิน</h1>
          <p className="mt-1 text-muted-foreground">
            เงินจำลองสำหรับทดลองระบบเอสโครว์ ทุกบาทมีรายการบัญชีคู่รองรับ ไม่มีเงินจริง
          </p>
        </div>

        <div className="rounded-xl bg-[var(--em-ink-975)] p-6 text-[var(--em-ink-0)]">
          <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-60">ยอดคงเหลือ</p>
          <p className="mt-2 font-heading text-4xl font-black tabular-nums">
            {formatBaht(balance)}
          </p>
          <p className="mt-1 text-xs opacity-60">= ผลรวมรายการทั้งหมดของบัญชีคุณในสมุดบัญชี</p>
        </div>

        <section aria-labelledby="ledger" className="flex flex-col gap-3">
          <h2 id="ledger" className="font-heading text-xl font-bold">
            รายการเดินบัญชี
          </h2>
          {rows?.length ? (
            <ul className="divide-y rounded-xl border bg-card">
              {rows.map((row) => {
                const amount = row.amount_satang ?? 0;
                return (
                  <li key={row.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{row.memo}</span>
                      <span className="text-xs text-muted-foreground">
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString("th-TH", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : ""}
                        {row.order_id ? " · คำสั่งซื้อ" : ""}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${amount > 0 ? "text-success" : "text-foreground"}`}
                    >
                      {amount > 0 ? "+" : "−"}
                      {formatBaht(Math.abs(amount))}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
              ยังไม่มีรายการ ลองเติมเงินจำลองทางขวาก่อน
            </p>
          )}
        </section>
      </section>

      <aside className="h-fit rounded-xl border bg-card p-6 lg:sticky lg:top-20">
        <h2 className="font-heading text-lg font-bold">เติมเงินจำลอง</h2>
        <p className="mt-1 text-sm text-muted-foreground">ครั้งละ 100 – 50,000 บาท</p>
        <ActionForm action={topUp} submit="เติมเงิน" className="mt-4 flex flex-col gap-3">
          <Label htmlFor="amount">จำนวน (บาท)</Label>
          <input
            id="amount"
            name="amount"
            inputMode="decimal"
            required
            defaultValue="1000"
            className="rounded-md border bg-background px-3 py-2 tabular-nums"
          />
        </ActionForm>
      </aside>
    </main>
  );
}
