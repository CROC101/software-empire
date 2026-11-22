"use client";

import { RollingCounter, SplitFlapText } from "@empire/ui";

// the hub's "status · live" band (apps/hub sections.tsx StatusSection), with its CSS inlined so the
// part stands alone (meteors left out: they need @empire/core/theme); the app list is sample data
const CSS = `
.st-grid {
  background-image:
    linear-gradient(rgb(255 255 255 / 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(70% 80% at 60% 50%, #000, transparent);
}
.st-card {
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgb(255 255 255 / 0.09);
  /* no backdrop blur: re-blurring every card on each scroll frame was the desktop lag */
  background: linear-gradient(160deg, rgb(255 255 255 / 0.09), rgb(255 255 255 / 0.04));
}
/* the gradient sits on each rolling numeral: text clipping across moving children is unreliable */
.st-num .rc-numeral,
.st-num .rc-row > :not(.rc-digit) {
  background: linear-gradient(
    180deg,
    var(--em-ink-0),
    color-mix(in oklab, var(--em-sky-500) 70%, var(--em-ink-0))
  );
  background-clip: text;
  color: transparent;
}
.st-term {
  position: relative;
  border-radius: 0.85rem;
  background: color-mix(in oklab, var(--em-ink-950) 94%, transparent);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.08),
    0 30px 80px -30px color-mix(in oklab, var(--em-blue-500) 55%, transparent);
}
/* a gradient hairline round the window */
.st-term::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    140deg,
    var(--em-blue-500),
    transparent 40%,
    transparent 60%,
    var(--em-violet-500)
  );
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
  pointer-events: none;
}
.st-pill {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 0.4rem;
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
}
.st-pill--on {
  color: var(--em-success-dark);
  background: color-mix(in oklab, var(--em-success) 16%, transparent);
}
.st-pill--wip {
  color: var(--em-gold-300);
  background: color-mix(in oklab, var(--em-gold-500) 14%, transparent);
}
.st-live {
  position: relative;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: var(--em-success-dark);
}
@media (prefers-reduced-motion: no-preference) {
  .st-live::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: inherit;
    animation: st-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
}
@keyframes st-ping {
  75%,
  100% {
    transform: scale(2.6);
    opacity: 0;
  }
}
`;

const APPS: [slug: string, live: boolean][] = [
  ["hub", true],
  ["community", true],
  ["commerce", true],
  ["tarot", true],
  ["design", true],
  ["canva", false],
  ["stream", false],
];

export default function StatusLive({
  title1 = "ระบบที่ผมสร้าง",
  title2 = "ยังเปิดอยู่ทุกตัว",
  intro = "คนที่คุยงานกับคุณ คือคนที่เขียนโค้ดเอง ตัวเลขข้าง ๆ ไม่ได้แต่ง",
  tests = 268,
  rounds = 7,
}: {
  title1?: string;
  title2?: string;
  intro?: string;
  tests?: number;
  rounds?: number;
}) {
  const live = APPS.filter(([, on]) => on);
  return (
    <section className="relative overflow-hidden bg-(--em-ink-975) text-(--em-ink-0)">
      <style>{CSS}</style>
      <div aria-hidden className="st-grid pointer-events-none absolute inset-0" />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-6">
          <p className="flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-(--em-ink-400) uppercase">
            <span className="st-live" aria-hidden />
            status · live
          </p>
          <h2 className="text-4xl leading-[1.05] font-black sm:text-6xl">
            {title1}
            <br />
            <span className="text-(--em-blue-500)">{title2}</span>
          </h2>
          <p className="max-w-md text-(--em-ink-300)">{intro}</p>
          <dl className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
            {(
              [
                [live.length, "", "ระบบที่เปิดให้ใช้แล้ว"],
                [tests, "", "เทสต์ความปลอดภัยที่ผ่าน"],
                [rounds, " รอบ", "ที่ใช้ทำ Community จนจบ"],
              ] as const
            ).map(([value, unit, label]) => (
              <div key={label} className="st-card flex flex-col-reverse">
                <dt className="mt-1 text-xs leading-snug text-(--em-ink-400)">{label}</dt>
                <dd className="st-num text-3xl font-black sm:text-4xl">
                  <RollingCounter value={value} suffix={unit || undefined} />
                </dd>
              </div>
            ))}
          </dl>
          <SplitFlapText
            words={live.map(([slug]) => `${slug.toUpperCase()} ONLINE`)}
            padTo={16}
            fontSize={18}
            gap={3}
            cycleDelay={2600}
            className="max-w-full overflow-hidden"
          />
        </div>
        <div className="st-term font-mono text-[0.8rem]">
          <div className="flex items-center gap-2 border-b border-(--em-ink-0)/10 px-4 py-2.5 text-xs text-(--em-ink-400)">
            <span className="size-3 rounded-full bg-(--em-coral-500)" />
            <span className="size-3 rounded-full bg-(--em-gold-300)" />
            <span className="size-3 rounded-full bg-(--em-success)" />
            <span className="mx-auto pr-12">crocwork@studio · zsh</span>
          </div>
          <div className="flex flex-col gap-1 p-5">
            <p>$ crocwork status</p>
            {APPS.map(([slug, on]) => (
              <p key={slug} className="grid grid-cols-[9rem_1fr] items-center gap-2">
                <span>{slug}</span>
                <span className={`st-pill ${on ? "st-pill--on" : "st-pill--wip"}`}>
                  <span
                    aria-hidden
                    className={on ? "st-live" : "size-1.5 rounded-full bg-current"}
                  />
                  {on ? "เปิดใช้แล้ว" : "กำลังทำ"}
                </span>
              </p>
            ))}
            <p className="mt-4">$ crocwork quote --mvp</p>
            <p>→ ส่วนใหญ่ 4–8 สัปดาห์ ส่งให้ลองทุกรอบ</p>
            <p>→ โค้ดอยู่ใน repo ของคุณตั้งแต่วันแรก</p>
          </div>
        </div>
      </div>
    </section>
  );
}
