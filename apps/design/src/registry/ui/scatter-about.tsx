import type { CSSProperties } from "react";

const pics = [
  {
    slot: "top-[6%] left-[4%] w-[18%] aspect-[4/5]",
    sky: "from-(--em-blue-800) to-(--em-sky-400)",
    d: 9,
  },
  {
    slot: "top-[4%] right-[8%] w-[15%] aspect-square",
    sky: "from-(--em-ink-900) to-(--em-blue-600)",
    d: 11,
  },
  {
    slot: "top-[42%] left-[0%] w-[13%] aspect-[3/4]",
    sky: "from-(--em-blue-900) to-(--em-blue-500)",
    d: 13,
  },
  {
    slot: "top-[46%] right-[2%] w-[17%] aspect-[4/3]",
    sky: "from-(--em-ink-950) to-(--em-ink-600)",
    d: 10,
  },
  {
    slot: "bottom-[4%] left-[18%] w-[14%] aspect-square",
    sky: "from-(--em-blue-700) to-(--em-sky-500)",
    d: 12,
  },
  {
    slot: "bottom-[6%] right-[22%] w-[16%] aspect-[5/4]",
    sky: "from-(--em-ink-850) to-(--em-blue-700)",
    d: 14,
  },
];

function Pic({ sky, i }: { sky: string; i: number }) {
  return (
    <span className={`relative block size-full overflow-clip rounded-lg bg-linear-to-b ${sky}`}>
      <span
        className="absolute size-[22%] rounded-full bg-(--em-ink-50)"
        style={{ top: `${String(10 + (i % 3) * 6)}%`, right: `${String(12 + (i % 2) * 40)}%` }}
      />
      <span className="absolute inset-x-0 bottom-0 h-1/3 bg-(--em-ink-975)/60 [clip-path:polygon(0_100%,0_45%,25%_10%,50%_55%,75%_15%,100%_50%,100%_100%)]" />
    </span>
  );
}

/**
 * An about section: the story in the middle, six small pictures scattered round it, each drifting on
 * its own slow loop (time-driven, never tied to scroll). On a phone the pictures become a swipe strip
 * under the copy.
 */
export default function ScatterAbout({
  title = "เราเป็นสตูดิโอเล็ก ๆ ริมน้ำ",
}: {
  title?: string;
}) {
  return (
    <section className="@container relative overflow-clip bg-background text-foreground">
      <style>{`@keyframes sa-drift{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}.sa-pic{animation:sa-drift var(--d) ease-in-out infinite}@media (prefers-reduced-motion:reduce){.sa-pic{animation:none}}`}</style>
      <div aria-hidden className="absolute inset-0 hidden @3xl:block">
        {pics.map((p, i) => (
          <span
            key={p.slot}
            className={`sa-pic vt-live absolute ${p.slot}`}
            style={
              { "--d": `${String(p.d)}s`, animationDelay: `-${String(i * 1.7)}s` } as CSSProperties
            }
          >
            <Pic sky={p.sky} i={i} />
          </span>
        ))}
      </div>

      <div className="relative mx-auto flex max-w-xl flex-col items-center px-6 py-20 text-center @3xl:min-h-[40rem] @3xl:justify-center">
        <p className="text-sm text-muted-foreground">เกี่ยวกับเรา</p>
        <h2 className="mt-3 font-heading text-4xl font-black @lg:text-5xl">{title}</h2>
        <p className="mt-5 text-muted-foreground">
          สี่คน สามเมือง หนึ่งห้องแชต เราทำเว็บและแอปให้ร้านเล็กที่อยากดูดีเท่าแบรนด์ใหญ่
          ทุกงานเริ่มจากนั่งฟังลูกค้าหนึ่งชั่วโมงก่อนเปิดโปรแกรมใด ๆ
        </p>
        <dl className="mt-8 grid grid-cols-3 gap-6 text-left">
          {[
            ["ปีที่ทำ", "6"],
            ["งานที่ส่ง", "48"],
            ["ลูกค้ากลับมา", "70%"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="font-heading text-2xl font-black tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <ul
        aria-hidden
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-12 @3xl:hidden"
      >
        {pics.map((p, i) => (
          <li key={p.slot} className="aspect-[4/5] w-40 shrink-0 snap-start">
            <Pic sky={p.sky} i={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}
