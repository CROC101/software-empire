import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LAUNCH_AT, launched } from "@/lib/launch";
import { Countdown } from "./countdown";

export const metadata: Metadata = {
  title: "เร็ว ๆ นี้",
  description: "crocwork.studio เปิดตัว 1 มกราคม 2570",
  robots: { index: false },
};

export default function SoonPage() {
  if (launched()) redirect("/");
  return (
    <main className="flex min-h-dvh flex-col bg-[var(--em-ink-975)] px-5 py-6 text-[var(--em-ink-0)] sm:px-12 sm:py-10">
      <p className="flex items-center gap-2.5 font-heading font-bold">
        <Image src="/crocwork-logo.webp" alt="" width={28} height={32} className="h-8 w-auto" />
        crocwork.studio
      </p>
      <div className="my-auto flex flex-col gap-8 py-12">
        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-4xl font-black leading-[1.1] sm:text-6xl">
            เปิดตัว
            <br />
            <span className="text-[var(--em-sky-500)]">1 มกราคม 2570</span>
          </h1>
          <p className="max-w-xl text-lg text-[var(--em-ink-100)]">
            Portfolio และระบบย่อยทั้งหมดของ crocwork กำลังเตรียมพร้อม กลับมาเจอกันวันเปิดตัว
          </p>
        </div>
        <Countdown target={LAUNCH_AT} />
      </div>
    </main>
  );
}
