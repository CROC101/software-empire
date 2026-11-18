import { subsystems } from "@empire/core/subsystems";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getApps } from "@/lib/site";

export const metadata: Metadata = { title: "ปิดชั่วคราว", robots: { index: false } };

/** Where the gate sends people when the admins put an app into maintenance or switch it off. */
export default async function ClosedPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const { app = "" } = await searchParams;
  const row = (await getApps()).find((a) => a.slug === app);
  const name =
    app === "hub" ? "crocwork.studio" : (subsystems.find((s) => s.slug === app)?.name ?? "แอปนี้");
  const maintenance = row?.status === "maintenance";
  return (
    <main className="flex min-h-dvh flex-col bg-[var(--em-ink-975)] px-5 py-6 text-[var(--em-ink-0)] sm:px-12 sm:py-10">
      <p className="flex items-center gap-2.5 font-heading font-bold">
        <Image src="/crocwork-logo.webp" alt="" width={28} height={32} className="h-8 w-auto" />
        crocwork.studio
      </p>
      <div className="my-auto flex max-w-2xl flex-col gap-5 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--em-sky-500)]">
          {maintenance ? "maintenance" : "closed"}
        </p>
        <h1 className="font-heading text-4xl font-black leading-[1.15] sm:text-6xl">
          {name}
          <br />
          <span className="text-[var(--em-sky-500)]">
            {maintenance ? "กำลังปรับปรุง" : "ปิดชั่วคราว"}
          </span>
        </h1>
        <p className="whitespace-pre-line text-lg text-[var(--em-ink-100)]">
          {row?.message || "ขอโทษที่ไม่สะดวก กลับมาใหม่อีกครั้งเร็ว ๆ นี้"}
        </p>
        {app !== "hub" && (
          <Link
            href="/"
            className="cw-btn-blue inline-flex min-h-11 w-fit items-center px-5 font-bold"
          >
            กลับหน้าหลัก →
          </Link>
        )}
      </div>
    </main>
  );
}
