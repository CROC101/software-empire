import { ArrowUpRight, Clock } from "lucide-react";

const posts = [
  {
    c: "ดีไซน์",
    t: "ทำไมเราเริ่มออกแบบที่จอ 390 พิกเซล",
    m: 4,
    d: "12 พ.ย. 2569",
    tone: "from-(--em-sky-400) to-(--em-blue-700)",
  },
  {
    c: "โค้ด",
    t: "ขยับแค่ transform กับ opacity แล้วเว็บลื่นขึ้นจริงไหม",
    m: 6,
    d: "5 พ.ย. 2569",
    tone: "from-(--em-violet-500) to-(--em-ink-950)",
  },
  {
    c: "ธุรกิจ",
    t: "ตั้งราคางานเว็บอย่างไรไม่ให้ขาดทุน",
    m: 8,
    d: "28 ต.ค. 2569",
    tone: "from-(--em-gold-500) to-(--em-coral-500)",
  },
];

/** Latest-post cards with category, read time and date; the picture zooms a touch on hover. */
export default function BlogCards() {
  return (
    <section className="bg-background text-foreground @container">
      <div className="mx-auto max-w-6xl px-6 py-16 @3xl:py-24">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-heading text-3xl font-black @3xl:text-5xl">บทความล่าสุด</h2>
          <a href="#blog" className="text-sm font-semibold text-primary">
            ดูทั้งหมด
          </a>
        </div>
        <ul className="mt-10 grid gap-6 @3xl:grid-cols-3">
          {posts.map((p) => (
            <li key={p.t}>
              <a
                href={`#${p.c}`}
                className="group block overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="overflow-hidden">
                  <div
                    className={`aspect-video bg-linear-to-br transition-opacity duration-75 group-hover:opacity-90 ${p.tone}`}
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                      {p.c}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock aria-hidden className="size-3" />
                      อ่าน {p.m} นาที
                    </span>
                  </div>
                  <h3 className="mt-3 flex gap-2 font-semibold">
                    {p.t}
                    <ArrowUpRight
                      aria-hidden
                      className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                    />
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
