import type { CSSProperties } from "react";
import { ArrowRight, Boxes, LayoutGrid, LockKeyhole, Wifi, Zap } from "lucide-react";
import { Link } from "react-router";
import { RollingCounter, RotatingText, ShinyText } from "@empire/ui";
import { ToolSearch } from "@/components/tools/tool-search";
import apps from "@/lib/apps.json";
import { CRAFT_APPS } from "@/lib/craft-apps";
import { TOOLS } from "@/lib/tools/registry";

const rise = (i: number) => ({ "--i": i }) as CSSProperties;

const WEB_CRAFT = CRAFT_APPS.filter((a) => a.web).length;
const KINDS = CRAFT_APPS.map((a) => a.kind.th);

/** Home hero after the glassmorphism trust hero: copy on the left, a glass card of true counts and
 *  a marquee of our own apps on the right, all resting on the water band. */
export function HomeHero({
  name,
  title,
  intro,
  perks,
}: {
  name?: string;
  title: string;
  intro: string;
  perks: readonly [string, string, string];
}) {
  const total = TOOLS.length + apps.length + CRAFT_APPS.length;
  const stats = [
    { value: TOOLS.length, label: "เครื่องมือ" },
    { value: apps.length, label: "แอป" },
    { value: CRAFT_APPS.length, label: "แอปหลัก" },
  ];

  return (
    <section className="tb-hero relative isolate overflow-hidden rounded-xl px-5 py-12 sm:px-10 sm:py-16">
      <div aria-hidden className="tb-hero-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <p
            className="tb-rise tb-glass inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs"
            style={rise(1)}
          >
            <span className="font-mono text-[11px] font-semibold tracking-widest uppercase">
              {/* a glint runs along the name now and then, like light on water */}
              <ShinyText
                color="var(--em-ink-0)"
                shineColor="var(--em-sky-500)"
                speed={2.4}
                delay={3}
              >
                crocwork toolboxes
              </ShinyText>
            </span>
            <span className="tb-muted">{name ? `สวัสดี ${name}` : "ยินดีต้อนรับ"}</span>
          </p>

          <h1
            className="tb-rise tb-depth font-display text-4xl leading-[1.05] font-black sm:text-6xl xl:text-7xl"
            style={rise(2)}
          >
            {title}
            <span className="block">
              <RollingCounter value={TOOLS.length} intro /> ชิ้นในที่เดียว
            </span>
          </h1>

          <div
            className="tb-rise tb-glass flex w-full max-w-md items-center gap-3 overflow-hidden rounded-xl px-4 py-2.5 text-lg font-bold"
            style={rise(3)}
          >
            <span className="shrink-0">ทำได้ทั้ง</span>
            <RotatingText
              texts={KINDS}
              effect="slide"
              staggerDuration={0.018}
              staggerFrom="first"
              rotationInterval={2400}
              splitLevelClassName="overflow-hidden pb-1"
              className="vt-live min-w-0 flex-nowrap whitespace-nowrap"
            />
          </div>

          <p className="tb-rise tb-muted max-w-xl text-lg" style={rise(4)}>
            {intro}
          </p>

          <div className="tb-rise max-w-xl text-left text-foreground" style={rise(5)}>
            <ToolSearch autoFocus />
          </div>

          <div className="tb-rise flex flex-col gap-3 sm:flex-row" style={rise(6)}>
            <Link
              to="/apps"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--em-ink-0)] px-6 font-semibold text-[var(--em-blue-700)] transition-transform hover:-translate-y-0.5"
            >
              <LayoutGrid aria-hidden className="size-4" />
              ดูแอปทั้งหมด
            </Link>
            <Link
              to="/tools"
              className="group tb-glass inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-6 font-semibold"
            >
              เครื่องมือทั้งหมด
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>

          <ul className="tb-rise tb-muted flex flex-wrap gap-x-6 gap-y-2 text-xs" style={rise(7)}>
            {[LockKeyhole, Zap, Wifi].map((Icon, i) => (
              <li key={perks[i]} className="flex items-center gap-2">
                <Icon aria-hidden className="size-4" />
                {perks[i]}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-5 lg:mt-10">
          <div
            className="tb-rise tb-glass relative overflow-hidden rounded-xl p-6 sm:p-8"
            style={rise(5)}
          >
            <div className="mb-7 flex items-center gap-4">
              <div className="tb-glass grid size-12 place-items-center rounded-lg">
                <Boxes aria-hidden className="size-6" />
              </div>
              <div>
                <div className="text-3xl font-black tracking-tight">
                  <RollingCounter value={total} intro />
                </div>
                <div className="tb-muted text-sm">ของในกล่องทั้งหมด</div>
              </div>
            </div>

            <div className="mb-7 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="tb-muted">แอปหลักที่เปิดในเว็บได้</span>
                <span className="font-semibold">
                  {WEB_CRAFT} / {CRAFT_APPS.length}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--em-ink-975)_25%,transparent)]">
                <div
                  className="tb-bar h-full rounded-full"
                  style={{ width: `${String(Math.round((WEB_CRAFT / CRAFT_APPS.length) * 100))}%` }}
                />
              </div>
            </div>

            <dl className="grid grid-cols-3 divide-x divide-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] border-t border-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] pt-5 text-center">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse items-center">
                  <dt className="tb-muted text-xs">{s.label}</dt>
                  <dd className="text-xl font-black sm:text-2xl">{s.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-medium">
              <span className="tb-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1">
                <span aria-hidden className="tb-live size-2 rounded-full" />
                ทำงานในเครื่อง
              </span>
              <span className="tb-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1">
                ซิงก์ข้ามเครื่องเมื่อล็อกอิน
              </span>
            </div>
          </div>

          <div className="tb-rise tb-glass overflow-hidden rounded-xl py-6" style={rise(6)}>
            <h2 className="tb-muted mb-4 px-6 text-sm font-medium">แอปหลักในกล่อง</h2>
            <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_15%,#000_85%,transparent)]">
              <ul className="tb-marquee vt-live flex shrink-0 gap-10 px-5 whitespace-nowrap motion-reduce:flex-wrap motion-reduce:gap-y-3">
                {[...CRAFT_APPS, ...CRAFT_APPS].map((app, i) => (
                  <li
                    key={`${app.slug}-${String(i)}`}
                    aria-hidden={i >= CRAFT_APPS.length || undefined}
                    className={`flex items-center gap-2 opacity-80 transition-opacity hover:opacity-100 ${i >= CRAFT_APPS.length ? "motion-reduce:hidden" : ""}`}
                  >
                    <app.icon aria-hidden className="size-5" />
                    <span className="text-base font-bold tracking-tight">crocwork {app.word}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
