"use client";

import { ContributionSkyline, useTokenColors, ScrollFloat } from "@empire/ui";
import contributions from "@/lib/contributions.json";

const EYEBROW = "font-mono text-xs uppercase tracking-[0.2em]";

/**
 * The real GitHub calendar (snapshot in lib/contributions.json, refreshed with
 * `pnpm --filter @empire/hub contributions`) as a heat map that folds up into a skyline.
 */
export function ActivitySkyline() {
  const blues = useTokenColors(["--em-sky-500", "--em-blue-500", "--em-blue-600", "--em-blue-700"]);
  const [b1 = "", b2 = "", b3 = "", b4 = ""] = blues ?? [];
  const total = contributions.days.reduce((s, d) => s + d.count, 0);
  return (
    <section data-tide id="activity" className="mx-auto max-w-6xl scroll-mt-16 px-4 pb-24 sm:px-6">
      <div className="mb-8 grid gap-6 border-t pt-12 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className={`${EYEBROW} cw-blue`}>activity</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            <ScrollFloat>
              ทุกแท่งคือวันที่ส่งงานจริง
              <br />
              <span className="cw-blue">ไม่ได้แต่งขึ้น</span>
            </ScrollFloat>
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          ปฏิทินสาธารณะของ GitHub ย้อนหลัง 1 ปี ลากเพื่อหมุนมุมมอง ชี้แท่งเพื่อดูจำนวนวันนั้น
          ยังไม่นับ commit ของพอร์ตนี้ที่ยังไม่ได้ push
        </p>
      </div>
      {blues && (
        <ContributionSkyline
          data={contributions.days}
          endDate={contributions.end}
          locale="th-TH"
          palette={{ light: [b1, b2, b3, b4], dark: [b4, b3, b2, b1] }}
          title={
            <>
              <span className="font-semibold tabular-nums">{total}</span> contributions บน GitHub ใน
              1 ปี
            </>
          }
          labels={{
            total: "รวม 1 ปี",
            busiest: "วันที่หนักสุด",
            longest: "ต่อเนื่องนานสุด",
            current: "ต่อเนื่องตอนนี้",
            day: "วัน",
            days: "วัน",
            none: "ไม่มี",
            on: "·",
            flat: "แผนที่ความร้อน",
            skyline: "เมืองสามมิติ",
            view: "มุมมอง",
            hintFlat: "ชี้วันเพื่อดูรายละเอียด · ใช้ลูกศรเดินดูได้",
            hintOrbit: "ลากเพื่อหมุน · ดับเบิลคลิกเพื่อกลับมุมเดิม",
            less: "น้อย",
            more: "มาก",
            levels: ["ไม่มี", "น้อย", "ปานกลาง", "มาก", "มากที่สุด"],
            highlight: "ดูเฉพาะวันระดับ{level}",
          }}
          footer={`ข้อมูลจาก github.com/${contributions.user} · ดึงล่าสุด ${contributions.fetched}`}
        />
      )}
    </section>
  );
}
