import { Label } from "@empire/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { currentUserId, db, isStaff } from "@/lib/db";
import { availableActions, formatBaht, sideOf, STATUS_LABEL, type OrderStatus } from "@/lib/market";
import { ActionForm } from "../../action-form";
import { leaveReview, orderStep, sendOrderMessage } from "../../actions";
import { StatusPill } from "../page";

export const metadata: Metadata = { title: "รายละเอียดคำสั่งซื้อ" };

const NOTE_FIELD: Record<string, { label: string; required: boolean }> = {
  deliver: { label: "สิ่งที่ส่งมอบ (ลิงก์งาน/คำอธิบาย)", required: true },
  dispute: { label: "อธิบายปัญหาให้ผู้ดูแล", required: true },
  cancel: { label: "เหตุผล (ไม่บังคับ)", required: false },
  resolve: { label: "หมายเหตุการตัดสิน", required: false },
};

const BUTTON: Record<
  string,
  { text: string; variant: "aurora" | "default" | "outline" | "destructive" }
> = {
  fund: { text: "ชำระเงินเข้าเอสโครว์", variant: "aurora" },
  deliver: { text: "ส่งมอบงาน", variant: "aurora" },
  release: { text: "รับงานและปล่อยเงิน", variant: "aurora" },
  cancel: { text: "ยกเลิกคำสั่งซื้อ", variant: "outline" },
  dispute: { text: "เปิดข้อพิพาท", variant: "destructive" },
};

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const client = await db();
  const [me, staff] = await Promise.all([currentUserId(), isStaff()]);
  const [{ data: order }, { data: events }, { data: messages }, { data: review }] =
    await Promise.all([
      client.from("orders").select("*").eq("id", id).maybeSingle(),
      client.from("order_events").select("*").eq("order_id", id).order("id"),
      client.from("order_messages").select("*").eq("order_id", id).order("created_at"),
      client.from("reviews").select("rating,body").eq("order_id", id).maybeSingle(),
    ]);
  if (!order) notFound();
  const { data: people } = await client
    .from("profiles")
    .select("user_id,display_name")
    .in("user_id", [order.buyer_id, order.seller_id]);
  const name = (uid: string | null) =>
    people?.find((p) => p.user_id === uid)?.display_name ?? (uid ? "ผู้ใช้" : "ระบบ");

  const status = order.status as OrderStatus;
  const side = sideOf(order, me, staff);
  const actions = availableActions(status, side, { reviewed: Boolean(review) });

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_22rem]">
      <section className="flex flex-col gap-6">
        <div>
          <StatusPill status={status} />
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight">{order.title}</h1>
          <p className="mt-1 text-muted-foreground">
            ผู้ซื้อ {name(order.buyer_id)} · ผู้ขาย {name(order.seller_id)}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">รายละเอียดงาน</h2>
          <p className="mt-2 whitespace-pre-line">{order.requirements}</p>
        </div>

        <section aria-labelledby="timeline" className="flex flex-col gap-3">
          <h2 id="timeline" className="font-heading text-xl font-semibold">
            ไทม์ไลน์
          </h2>
          <ol className="relative flex flex-col gap-4 border-l-2 border-primary/30 pl-5">
            {events?.map((event) => (
              <li key={event.id} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[27px] top-1 size-3 rounded-full bg-aurora"
                />
                <p className="font-medium">{STATUS_LABEL[event.to_status as OrderStatus]}</p>
                <p className="text-xs text-muted-foreground">
                  {name(event.actor_id)} ·{" "}
                  {new Date(event.created_at).toLocaleString("th-TH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                {event.note && <p className="mt-1 whitespace-pre-line text-sm">{event.note}</p>}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="chat" className="flex flex-col gap-3">
          <h2 id="chat" className="font-heading text-xl font-semibold">
            คุยกับอีกฝ่าย
          </h2>
          <ul className="flex flex-col gap-2">
            {messages?.map((m) => (
              <li
                key={m.id}
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.author_id === me ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted"}`}
              >
                <span className="block text-xs opacity-70">{name(m.author_id)}</span>
                {m.body}
              </li>
            ))}
          </ul>
          {(side === "buyer" || side === "seller") && (
            <ActionForm
              action={sendOrderMessage}
              hidden={{ orderId: order.id }}
              submit="ส่งข้อความ"
              variant="outline"
            >
              <Label htmlFor="body" className="sr-only">
                ข้อความ
              </Label>
              <textarea
                id="body"
                name="body"
                required
                maxLength={4000}
                rows={2}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              />
            </ActionForm>
          )}
        </section>
      </section>

      <aside className="flex h-fit flex-col gap-4 lg:sticky lg:top-20">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">ยอดคำสั่งซื้อ</p>
          <p className="font-heading text-3xl font-extrabold">{formatBaht(order.amount_satang)}</p>
          <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-muted-foreground">ค่าธรรมเนียม 5%</dt>
            <dd className="text-right">{formatBaht(order.fee_satang)}</dd>
            <dt className="text-muted-foreground">ผู้ขายได้รับ</dt>
            <dd className="text-right">{formatBaht(order.amount_satang - order.fee_satang)}</dd>
            {order.due_at && (
              <>
                <dt className="text-muted-foreground">กำหนดส่ง</dt>
                <dd className="text-right">
                  {new Date(order.due_at).toLocaleDateString("th-TH", { dateStyle: "medium" })}
                </dd>
              </>
            )}
          </dl>
        </div>

        {actions
          .filter((a) => a !== "review" && a !== "resolve")
          .map((action) => (
            <ActionForm
              key={action}
              action={orderStep}
              hidden={{ orderId: order.id, action }}
              submit={BUTTON[action]?.text ?? action}
              variant={BUTTON[action]?.variant}
              className="flex flex-col gap-2 rounded-2xl border bg-card p-4"
            >
              {NOTE_FIELD[action] && (
                <>
                  <Label htmlFor={`note-${action}`}>{NOTE_FIELD[action].label}</Label>
                  <textarea
                    id={`note-${action}`}
                    name="note"
                    rows={3}
                    maxLength={2000}
                    required={NOTE_FIELD[action].required}
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </>
              )}
            </ActionForm>
          ))}

        {actions.includes("resolve") && (
          <ActionForm
            action={orderStep}
            hidden={{ orderId: order.id, action: "resolve" }}
            submit="ตัดสินข้อพิพาท"
            variant="aurora"
            className="flex flex-col gap-2 rounded-2xl border bg-card p-4"
          >
            <fieldset className="flex gap-4 text-sm">
              <legend className="mb-1 font-medium">ผลการตัดสิน</legend>
              <label className="flex items-center gap-1">
                <input type="radio" name="outcome" value="RELEASE" required /> ปล่อยเงินให้ผู้ขาย
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="outcome" value="REFUND" /> คืนเงินผู้ซื้อ
              </label>
            </fieldset>
            <Label htmlFor="note-resolve">หมายเหตุ</Label>
            <textarea
              id="note-resolve"
              name="note"
              rows={2}
              maxLength={2000}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
          </ActionForm>
        )}

        {actions.includes("review") && (
          <ActionForm
            action={leaveReview}
            hidden={{ orderId: order.id }}
            submit="ส่งรีวิว"
            className="flex flex-col gap-2 rounded-2xl border bg-card p-4"
          >
            <Label htmlFor="rating">ให้คะแนน</Label>
            <select
              id="rating"
              name="rating"
              defaultValue="5"
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {"★".repeat(n)} ({n})
                </option>
              ))}
            </select>
            <Label htmlFor="review-body">ความเห็น (ไม่บังคับ)</Label>
            <textarea
              id="review-body"
              name="body"
              rows={3}
              maxLength={2000}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
          </ActionForm>
        )}
        {review && (
          <p className="rounded-2xl border bg-card p-4 text-sm">
            รีวิวของผู้ซื้อ: <span className="text-warning">{"★".repeat(review.rating)}</span>
            {review.body ? ` — ${review.body}` : ""}
          </p>
        )}
      </aside>
    </main>
  );
}
