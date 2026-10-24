import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { currentUserId, db } from "@/lib/db";
import { signInUrl } from "@/lib/env";
import { EMPTY_SERVICE, ServiceForm, type ServiceDraft } from "../service-form";

export const metadata: Metadata = { title: "แก้ไขบริการ" };

/** /sell/new creates; /sell/<uuid> edits one of my own services (RLS hides everyone else's drafts). */
export default async function EditServicePage({ params }: PageProps<"/sell/[id]">) {
  const { id } = await params;
  const me = await currentUserId();
  if (!me) redirect(signInUrl(`/sell/${id}`));

  let service: ServiceDraft = EMPTY_SERVICE;
  if (id !== "new") {
    if (!z.uuid().safeParse(id).success) notFound();
    const { data } = await (
      await db()
    )
      .from("services")
      .select("id,title,description,category,price_satang,delivery_days,tags,published")
      .eq("id", id)
      .eq("seller_id", me)
      .maybeSingle();
    if (!data) notFound();
    service = data;
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Link href="/sell" className="text-sm text-muted-foreground hover:text-foreground">
        ← บริการของฉัน
      </Link>
      <h1 className="font-heading text-3xl font-black tracking-tight">
        {service.id ? "แก้ไขบริการ" : "บริการใหม่"}
      </h1>
      <div className="rounded-xl border bg-card p-6">
        <ServiceForm service={service} />
      </div>
    </main>
  );
}
