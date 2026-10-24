"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentUserId, db } from "@/lib/db";
import { signInUrl } from "@/lib/env";
import { bahtInput, isCategory } from "@/lib/market";

export type FormState = { error?: string; ok?: string };

const uuid = z.uuid();

/** A text field from the form; a File or a missing field reads as "". */
const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
};

/** RPC errors carry Thai messages written in SQL; anything unexpected gets a generic one. */
function failure(error: { message: string; code?: string } | null): FormState {
  if (!error) return {};
  return {
    error: /[฀-๿]/.test(error.message) ? error.message : "ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง",
  };
}

async function requireUser(next: string) {
  const me = await currentUserId();
  if (!me) redirect(signInUrl(next));
  return me;
}

export async function placeOrder(_prev: FormState, form: FormData): Promise<FormState> {
  const service = uuid.safeParse(form.get("serviceId"));
  if (!service.success) return { error: "ไม่พบบริการนี้" };
  await requireUser(`/services/${service.data}`);
  const requirements = z
    .string()
    .trim()
    .min(10, "บอกรายละเอียดงานอย่างน้อย 10 ตัวอักษร")
    .max(4000)
    .safeParse(form.get("requirements"));
  if (!requirements.success) return { error: requirements.error.issues[0]?.message };
  const { data, error } = await (
    await db()
  ).rpc("place_order", {
    service: service.data,
    requirements: requirements.data,
  });
  if (error) return failure(error);
  redirect(`/orders/${data}`);
}

const ORDER_STEPS = {
  fund: "fund_order",
  release: "release_order",
} as const;

export async function orderStep(_prev: FormState, form: FormData): Promise<FormState> {
  const order = uuid.safeParse(form.get("orderId"));
  const action = z
    .enum(["fund", "release", "cancel", "deliver", "dispute", "resolve"])
    .safeParse(form.get("action"));
  if (!order.success || !action.success) return { error: "คำขอไม่ถูกต้อง" };
  await requireUser(`/orders/${order.data}`);
  const note = z
    .string()
    .trim()
    .max(2000)
    .safeParse(form.get("note") ?? "");
  if (!note.success) return { error: "ข้อความยาวเกินไป" };
  const client = await db();
  const id = order.data;
  const { error } =
    action.data === "fund" || action.data === "release"
      ? await client.rpc(ORDER_STEPS[action.data], { order_id: id })
      : action.data === "cancel"
        ? await client.rpc("cancel_order", { order_id: id, note: note.data || undefined })
        : action.data === "deliver"
          ? await client.rpc("deliver_order", { order_id: id, note: note.data })
          : action.data === "dispute"
            ? await client.rpc("dispute_order", { order_id: id, reason: note.data })
            : await client.rpc("resolve_dispute", {
                order_id: id,
                outcome: form.get("outcome") === "RELEASE" ? "RELEASE" : "REFUND",
                note: note.data || undefined,
              });
  if (error) return failure(error);
  revalidatePath(`/orders/${id}`);
  revalidatePath("/orders");
  revalidatePath("/wallet");
  return { ok: "บันทึกแล้ว" };
}

export async function sendOrderMessage(_prev: FormState, form: FormData): Promise<FormState> {
  const order = uuid.safeParse(form.get("orderId"));
  const body = z.string().trim().min(1).max(4000).safeParse(form.get("body"));
  if (!order.success || !body.success) return { error: "พิมพ์ข้อความก่อนส่ง" };
  await requireUser(`/orders/${order.data}`);
  const { error } = await (
    await db()
  )
    .from("order_messages")
    .insert({ order_id: order.data, body: body.data });
  if (error) return failure(error);
  revalidatePath(`/orders/${order.data}`);
  return {};
}

export async function leaveReview(_prev: FormState, form: FormData): Promise<FormState> {
  const order = uuid.safeParse(form.get("orderId"));
  const rating = z.coerce.number().int().min(1).max(5).safeParse(form.get("rating"));
  if (!order.success || !rating.success) return { error: "ให้คะแนน 1-5 ดาว" };
  await requireUser(`/orders/${order.data}`);
  const body = z
    .string()
    .trim()
    .max(2000)
    .parse(form.get("body") ?? "");
  const { error } = await (
    await db()
  ).rpc("leave_review", {
    order_id: order.data,
    rating: rating.data,
    body: body || undefined,
  });
  if (error) return failure(error);
  revalidatePath(`/orders/${order.data}`);
  return { ok: "ขอบคุณสำหรับรีวิว" };
}

export async function topUp(_prev: FormState, form: FormData): Promise<FormState> {
  await requireUser("/wallet");
  const amount = bahtInput.safeParse(text(form, "amount"));
  if (!amount.success) return { error: amount.error.issues[0]?.message };
  const { error } = await (await db()).rpc("topup_demo", { amount_satang: amount.data });
  if (error) return failure(error);
  revalidatePath("/wallet");
  return { ok: "เติมเงินจำลองแล้ว" };
}

const serviceForm = z.object({
  title: z.string().trim().min(5, "ชื่อบริการอย่างน้อย 5 ตัวอักษร").max(120),
  description: z.string().trim().min(20, "รายละเอียดอย่างน้อย 20 ตัวอักษร").max(5000),
  category: z.string().refine(isCategory, "เลือกหมวดหมู่"),
  price: bahtInput.pipe(
    z.number().min(10000, "ราคาขั้นต่ำ 100 บาท").max(10000000, "ราคาสูงสุด 100,000 บาท"),
  ),
  deliveryDays: z.coerce
    .number()
    .int()
    .min(1, "ส่งงานภายใน 1-90 วัน")
    .max(90, "ส่งงานภายใน 1-90 วัน"),
  tags: z.string().transform((s) =>
    s
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10),
  ),
  published: z.boolean(),
});

export async function saveService(_prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser("/sell");
  const parsed = serviceForm.safeParse({
    title: form.get("title"),
    description: form.get("description"),
    category: form.get("category"),
    price: text(form, "price"),
    deliveryDays: form.get("deliveryDays"),
    tags: text(form, "tags"),
    published: form.get("published") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const row = {
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    price_satang: parsed.data.price,
    delivery_days: parsed.data.deliveryDays,
    tags: parsed.data.tags,
    published: parsed.data.published,
  };
  const id = form.get("serviceId");
  const client = await db();
  const { error } =
    typeof id === "string" && id
      ? await client.from("services").update(row).eq("id", uuid.parse(id)).eq("seller_id", me)
      : await client.from("services").insert(row);
  if (error) return failure(error);
  revalidatePath("/sell");
  revalidatePath("/services");
  redirect("/sell");
}

export async function deleteService(form: FormData): Promise<void> {
  const me = await requireUser("/sell");
  const id = uuid.parse(form.get("serviceId"));
  await (await db()).from("services").delete().eq("id", id).eq("seller_id", me);
  revalidatePath("/sell");
  revalidatePath("/services");
}
