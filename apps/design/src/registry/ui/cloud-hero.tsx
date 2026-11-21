"use client";

import { CloudHero } from "@empire/ui";

const WORDS = ["ออกแบบ", "เขียนโค้ด", "ทดสอบ", "ส่งงาน"];

/**
 * The crocwork hub hero: drifting clouds over a day sky (a moonlit night in the dark theme), a
 * heavy headline, a line under it whose last word comes out of a blur letter by letter, the
 * actions, and the numbers along the bottom.
 */
export default function CloudHeroPart({
  line1 = "ระบบที่ผมสร้าง",
  line2 = "ทำงานได้จริง",
  lead = "ผมทำเองทุกขั้น",
  seconds = 2.5,
}: {
  line1?: string;
  line2?: string;
  lead?: string;
  seconds?: number;
}) {
  return (
    <CloudHero
      className="min-h-[40rem] w-full"
      eyebrow="ซอฟต์แวร์ · AI · ระบบหลังบ้าน"
      title={
        <>
          <span className="block">{line1}</span>
          <span className="block">{line2}</span>
        </>
      }
      lead={lead}
      words={WORDS}
      seconds={seconds}
      stats={[
        { value: "7", label: "ระบบในพอร์ต" },
        { value: "1", label: "บัญชีเดียว ใช้ได้ทุกระบบ" },
        { value: "100%", label: "ตารางที่เปิด RLS" },
      ]}
    >
      <a
        href="#work"
        className="inline-flex items-center gap-2 rounded-xl bg-(--em-blue-600) px-5 py-3 text-sm font-bold text-(--em-ink-0) transition-transform hover:-translate-y-0.5"
      >
        ดูผลงาน <span aria-hidden>↓</span>
      </a>
      <a
        href="#try"
        className="inline-flex items-center rounded-xl border border-(--em-ink-0)/40 bg-(--em-ink-0)/10 px-5 py-3 text-sm font-bold backdrop-blur-sm transition-transform hover:-translate-y-0.5"
      >
        ลองเล่นดู
      </a>
    </CloudHero>
  );
}
