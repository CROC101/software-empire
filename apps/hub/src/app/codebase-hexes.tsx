"use client";

import { IsometricHexChart, spiral, useTokenColors } from "@empire/ui";
import codebase from "@/lib/codebase.json";

const EYEBROW = "font-mono text-xs uppercase tracking-[0.2em]";
const fmt = new Intl.NumberFormat("th-TH");

// biggest folder in the middle, one hex per folder; log scale so a 40-line folder still shows
const top = Math.log10(codebase.dirs[0]?.lines ?? 10);
const cells = spiral(codebase.dirs.length);
const data = codebase.dirs.map((d, i) => ({
  q: cells[i]?.q ?? 0,
  r: cells[i]?.r ?? 0,
  value: (Math.log10(Math.max(1, d.lines)) / top) * 100,
  label: `${d.path}\n${fmt.format(d.lines)} บรรทัด · ${fmt.format(d.files)} ไฟล์`,
}));

/**
 * The monorepo's own source as a hex map: one cell per folder, height = lines of code. Snapshot
 * in lib/codebase.json, refreshed with `pnpm --filter @empire/hub codebase`.
 */
export function CodebaseHexes() {
  const blues = useTokenColors(["--em-sky-500", "--em-blue-500", "--em-blue-600", "--em-blue-700"]);
  const [b1 = "", b2 = "", b3 = "", b4 = ""] = blues ?? [];
  return (
    <section id="codebase" className="mx-auto max-w-6xl scroll-mt-16 px-4 pb-24 sm:px-6">
      <div className="mb-8 grid gap-6 border-t pt-12 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className={`${EYEBROW} cw-blue`}>codebase</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            {fmt.format(codebase.lines)} บรรทัด
            <br />
            <span className="cw-blue">ใน repo เดียว</span>
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          หนึ่งช่องคือหนึ่งโฟลเดอร์ ยิ่งสูงยิ่งมีโค้ดเยอะ นับเฉพาะโค้ดที่ git เก็บไว้
          ไม่นับไฟล์ที่ระบบสร้างเอง โค้ดของ community และ canva ส่วนใหญ่ย้ายมาจากโปรเจกต์เดิมของผม
        </p>
      </div>
      {blues && (
        <IsometricHexChart
          data={data}
          palette={{ light: [b1, b2, b3, b4], dark: [b4, b3, b2, b1] }}
          title={
            <>
              <span className="font-semibold tabular-nums">{fmt.format(codebase.files)}</span> ไฟล์
              · <span className="font-semibold tabular-nums">{codebase.dirs.length}</span> โฟลเดอร์
            </>
          }
          hint="ชี้ช่องเพื่อดูชื่อโฟลเดอร์และจำนวนบรรทัด"
          labels={{
            view: "มุมมอง",
            flat: "แผนที่รังผึ้ง",
            columns: "แท่งสามมิติ",
            hint: "ลากเพื่อหมุน · ดับเบิลคลิกเพื่อกลับมุมเดิม",
            less: "น้อย",
            more: "มาก",
            levels: ["น้อยมาก", "น้อย", "ปานกลาง", "มาก", "มากที่สุด"],
          }}
          footer={`นับจาก git ls-files · อัปเดตล่าสุด ${codebase.generated}`}
        />
      )}
    </section>
  );
}
