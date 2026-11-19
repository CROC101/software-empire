import { Gauge, Globe2, Layers, Lock, MoonStar, Smartphone } from "lucide-react";

const feats = [
  { t: "เร็วตั้งแต่หน้าแรก", s: "หน้าเว็บเป็นไฟล์นิ่ง โหลดจาก edge ใกล้ผู้ใช้", i: Gauge },
  { t: "มือถือก่อน", s: "ทุกชิ้นลองที่จอ 390 พิกเซลก่อนจอใหญ่", i: Smartphone },
  { t: "ธีมมืดสว่าง", s: "สลับตามคุกกี้กลาง ทุกแอปเห็นค่าเดียวกัน", i: MoonStar },
  { t: "ปลอดภัย", s: "สิทธิ์ทุกตารางผูกกับผู้ใช้ มีเทสต์ยืนยัน", i: Lock },
  { t: "สองภาษา", s: "ไทยและอังกฤษ สลับได้ทั้งเว็บ", i: Globe2 },
  { t: "ต่อยอดง่าย", s: "ชิ้นส่วนแยกกัน หยิบไปใช้ทีละชิ้นได้", i: Layers },
];

/** Six features in a grid: icon tile, title, one line. Cards lift a little on hover. */
export default function FeaturesGrid({ title = "ครบในที่เดียว" }: { title?: string }) {
  return (
    <section className="bg-background text-foreground @container">
      <div className="mx-auto max-w-6xl px-6 py-16 @3xl:py-24">
        <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">features</p>
        <h2 className="mt-3 font-heading text-3xl font-black @3xl:text-5xl">{title}</h2>
        <ul className="mt-10 grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
          {feats.map(({ t, s, i: Icon }) => (
            <li
              key={t}
              className="rounded-xl border border-border bg-card p-6 text-card-foreground transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon aria-hidden className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
