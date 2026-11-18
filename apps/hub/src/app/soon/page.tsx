import { DominoLettering, dominoCount } from "@empire/ui";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSettings, passed, thaiDate } from "@/lib/site";
import { Countdown } from "./countdown";

export const metadata: Metadata = {
  title: "เร็ว ๆ นี้",
  description: "crocwork.studio กำลังจะเปิดตัว",
  robots: { index: false },
};

const LINE_1 = "เปิดตัว";

export default async function SoonPage() {
  // the admins set the date and the message at /admin/system
  const { launch_at, soon_message } = await getSettings();
  const target = Date.parse(launch_at);
  if (passed(launch_at)) redirect("/");
  const LINE_2 = thaiDate(launch_at);
  return (
    <main className="flex min-h-dvh flex-col bg-[var(--em-ink-975)] px-5 py-6 text-[var(--em-ink-0)] sm:px-12 sm:py-10">
      <div className="flex items-center justify-between gap-4">
        <p className="flex items-center gap-2.5 font-heading font-bold">
          <Image src="/crocwork-logo.webp" alt="" width={28} height={32} className="h-8 w-auto" />
          crocwork.studio
        </p>
        {/* admins whose session ended land here too: one tap back in */}
        <a
          href="/login"
          className="inline-flex min-h-11 items-center px-2 text-[var(--em-ink-100)] underline-offset-4 hover:text-[var(--em-ink-0)] hover:underline"
        >
          เข้าสู่ระบบแอดมิน
        </a>
      </div>
      <div className="my-auto flex flex-col gap-8 py-12">
        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-4xl font-black leading-[1.15] sm:text-6xl lg:text-7xl">
            <DominoLettering text={LINE_1} />
            <br />
            <DominoLettering
              text={LINE_2}
              offset={dominoCount(LINE_1)}
              className="text-[var(--em-sky-500)]"
            />
          </h1>
          <p className="max-w-xl whitespace-pre-line text-lg text-[var(--em-ink-100)]">
            {soon_message ||
              "Portfolio และระบบย่อยทั้งหมดของ crocwork กำลังเตรียมพร้อม กลับมาเจอกันวันเปิดตัว"}
          </p>
        </div>
        <Countdown target={target} />
      </div>
    </main>
  );
}
