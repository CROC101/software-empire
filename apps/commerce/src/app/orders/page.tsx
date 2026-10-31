import type { Metadata } from "next";
import Link from "next/link";
import { currentUserId, db, isStaff } from "@/lib/db";
import { formatBaht, STATUS_LABEL, type OrderStatus } from "@/lib/market";

export const metadata: Metadata = { title: "คำสั่งซื้อ" };

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const me = await currentUserId();
  const view = (await searchParams).view;
  const staff = await isStaff();
  const client = await db();
  // overdue delivered work releases itself; checked lazily whenever orders are looked at
  await client.rpc("auto_release");

  let request = client
    .from("orders")
    .select("id,title,amount_satang,status,buyer_id,seller_id,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const tab = view === "selling" ? "selling" : view === "disputes" && staff ? "disputes" : "buying";
  if (tab === "buying") request = request.eq("buyer_id", me ?? "");
  if (tab === "selling") request = request.eq("seller_id", me ?? "");
  if (tab === "disputes") request = request.eq("status", "DISPUTED");
  const { data: orders } = await request;

  const tabs = [
    { key: "buying", label: "ที่ฉันจ้าง" },
    { key: "selling", label: "ที่ฉันรับงาน" },
    ...(staff ? [{ key: "disputes", label: "ข้อพิพาท (ผู้ดูแล)" }] : []),
  ];

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl font-bold tracking-tight">คำสั่งซื้อ</h1>
      <nav aria-label="ประเภทคำสั่งซื้อ" className="flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/orders?view=${t.key}`}
            aria-current={t.key === tab ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm ${t.key === tab ? "border-primary bg-secondary text-primary" : "bg-card"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {orders?.length ? (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 hover:border-primary"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{order.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("th-TH", {
                      dateStyle: "medium",
                    })}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <StatusPill status={order.status as OrderStatus} />
                  <span className="font-heading font-bold">{formatBaht(order.amount_satang)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-16 text-center text-muted-foreground">ยังไม่มีคำสั่งซื้อ</p>
      )}
    </main>
  );
}

export function StatusPill({ status }: { status: OrderStatus }) {
  const tone =
    status === "RELEASED"
      ? "bg-success/12 text-success"
      : status === "DISPUTED" || status === "CANCELLED" || status === "REFUNDED"
        ? "bg-destructive/10 text-destructive"
        : "bg-secondary text-secondary-foreground";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
