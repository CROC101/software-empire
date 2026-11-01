"use client";

import { CirculariumRing, useTokenColors, ScrollFloat } from "@empire/ui";
import rhythm from "@/lib/rhythm.json";

const EYEBROW = "font-mono text-xs uppercase tracking-[0.2em]";
const DAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์", "อาทิตย์"] as const;
const date = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });

/**
 * When the studio works: every commit in this repo by weekday and hour, Bangkok time (snapshot
 * in lib/rhythm.json, refreshed with `pnpm --filter @empire/hub rhythm`), as a 24-hour ring.
 */
export function RhythmRing() {
  const c = useTokenColors(["--em-sky-500", "--em-blue-500", "--em-blue-600", "--em-violet-600"]);
  const [b1 = "", b2 = "", b3 = "", b4 = ""] = c ?? [];
  return (
    <section data-tide id="rhythm" className="mx-auto max-w-6xl scroll-mt-16 px-4 pb-24 sm:px-6">
      <div className="mb-8 grid gap-6 border-t pt-12 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className={`${EYEBROW} cw-blue`}>rhythm</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            <ScrollFloat>
              ผมเขียนโค้ด
              <br />
              <span className="cw-blue">ช่วงไหนของวัน</span>
            </ScrollFloat>
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          ทุก commit ใน repo นี้ {rhythm.commits} ครั้ง ตั้งแต่ {date(rhythm.from)} ถึง{" "}
          {date(rhythm.to)} นับตามเวลาไทย วงในคือวันจันทร์ ด้านบนคือเที่ยงคืน
        </p>
      </div>
      {c && (
        <CirculariumRing
          className="mx-auto max-w-3xl"
          data={rhythm.grid}
          days={DAYS}
          formatValue={(v) => `${String(v)} commit`}
          title="จังหวะการทำงาน"
          subtitle="24 ชั่วโมง · 7 วง ตามวันในสัปดาห์"
          hint="ลากเพื่อหมุน · ดับเบิลคลิกเพื่อกลับมุมเดิม · ลูกศรเลื่อนทีละชั่วโมง"
          palette={{ light: [b1, b2, b3, b4], dark: [b4, b3, b2, b1] }}
          levelNames={["ไม่มี", "น้อย", "ปานกลาง", "มาก", "มากที่สุด"]}
          legendLabels={["น้อย", "มาก"]}
          labels={{
            filter: "เลือกวัน",
            all: "ทุกวัน",
            weekdays: "จ.–ศ.",
            weekend: "ส.–อา.",
            view: "มุมมอง",
            flat: "แบน",
            ring: "3 มิติ",
            canvas: "วงแหวนจำนวน commit แยกตามวันและชั่วโมง ใช้ลูกศรเพื่ออ่านทีละชั่วโมง",
            total: "commit ทั้งหมด",
            peak: "ชั่วโมงที่มากที่สุด",
            best: "วันที่มากที่สุด",
          }}
        />
      )}
    </section>
  );
}
