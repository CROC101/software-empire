import { Button, Label } from "@empire/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { currentUserId, db } from "@/lib/db";
import { signInUrl } from "@/lib/env";
import { CATEGORIES, formatBaht, isCategory } from "@/lib/market";
import { ActionForm } from "../../action-form";
import { placeOrder } from "../../actions";

async function load(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const { data } = await (await db()).from("service_cards").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: PageProps<"/services/[id]">): Promise<Metadata> {
  const service = await load((await params).id);
  return service
    ? { title: service.title ?? "บริการ", description: (service.description ?? "").slice(0, 160) }
    : { title: "ไม่พบบริการ" };
}

export default async function ServicePage({ params }: PageProps<"/services/[id]">) {
  const { id } = await params;
  const service = await load(id);
  if (!service?.id) notFound();
  const me = await currentUserId();
  const { data: reviews } = await (
    await db()
  )
    .from("reviews")
    .select("rating,body,created_at")
    .eq("service_id", service.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const own = me === service.seller_id;

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_22rem]">
      <article className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-primary">
            {isCategory(service.category) ? CATEGORIES[service.category] : "อื่น ๆ"}
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight">{service.title}</h1>
          <p className="mt-2 text-muted-foreground">
            โดย <span className="font-medium text-foreground">{service.seller_name}</span>
            {service.seller_headline ? ` · ${service.seller_headline}` : ""}
          </p>
        </div>
        <div className="whitespace-pre-line rounded-2xl border bg-card p-6 leading-relaxed">
          {service.description}
        </div>
        {service.tags?.length ? (
          <ul className="flex flex-wrap gap-2">
            {service.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
              >
                #{tag}
              </li>
            ))}
          </ul>
        ) : null}
        <section aria-labelledby="reviews" className="flex flex-col gap-3">
          <h2 id="reviews" className="font-heading text-xl font-semibold">
            รีวิว{" "}
            {service.review_count
              ? `· ★ ${String(service.rating)} (${String(service.review_count)})`
              : ""}
          </h2>
          {reviews?.length ? (
            <ul className="flex flex-col gap-3">
              {reviews.map((review) => (
                <li key={review.created_at} className="rounded-xl border bg-card p-4">
                  <p aria-label={`${String(review.rating)} ดาว`} className="text-warning">
                    {"★".repeat(review.rating)}
                    <span className="text-muted-foreground">{"★".repeat(5 - review.rating)}</span>
                  </p>
                  {review.body && <p className="mt-1 text-sm">{review.body}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">ยังไม่มีรีวิว</p>
          )}
        </section>
      </article>

      <aside className="h-fit rounded-2xl border bg-card p-6 shadow-sm lg:sticky lg:top-20">
        <p className="font-heading text-3xl font-extrabold">
          {formatBaht(service.price_satang ?? 0)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          ส่งงานภายใน {service.delivery_days} วันหลังชำระเงิน
        </p>
        <div className="mt-6">
          {own ? (
            <p className="text-sm text-muted-foreground">นี่คือบริการของคุณ</p>
          ) : me ? (
            <ActionForm
              action={placeOrder}
              hidden={{ serviceId: service.id }}
              submit="สั่งงาน"
              variant="aurora"
            >
              <Label htmlFor="requirements">รายละเอียดงานที่ต้องการ</Label>
              <textarea
                id="requirements"
                name="requirements"
                required
                minLength={10}
                maxLength={4000}
                rows={5}
                className="rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="เช่น ขอบเขตงาน ไฟล์ที่มี กำหนดส่ง"
              />
            </ActionForm>
          ) : (
            <Button asChild variant="aurora" className="w-full">
              <a href={signInUrl(`/services/${service.id}`)}>เข้าสู่ระบบเพื่อสั่งงาน</a>
            </Button>
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          เงินจะถูกพักไว้ในเอสโครว์ ผู้ขายได้รับเมื่อคุณกดรับงาน หรืออัตโนมัติ 3 วันหลังส่งมอบ
        </p>
      </aside>
    </main>
  );
}
