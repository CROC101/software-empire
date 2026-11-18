import { HubSwitcher, cn } from "@empire/ui";
import { subsystems } from "@empire/core/subsystems";
import { ArrowDown, ArrowRight, Users } from "lucide-react";
import { Link } from "react-router";
import { env } from "@/lib/env";
import { usePlayer } from "./player";
import { TOOLS } from "./shell";

const line = "border-[color-mix(in_oklab,var(--foreground)_12%,transparent)]";
const tile =
  "place-items-center rounded-xl border bg-[color-mix(in_oklab,var(--background)_80%,var(--em-blue-500))] text-[var(--primary)] shadow-lg";

/** Concentric rings behind the hero, drawn once (decor). */
function Rings() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 1200"
      className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[1200px] -translate-x-1/2 -translate-y-1/2 text-[var(--foreground)]"
    >
      <g fill="none" stroke="currentColor">
        {[90, 160, 240, 330, 430, 540].map((r, i) => (
          <circle key={r} cx="600" cy="600" r={r} strokeOpacity={0.07 + (i % 2) * 0.04} />
        ))}
        {[240, 430].map((r) => (
          <circle
            key={`d${r}`}
            cx="600"
            cy="600"
            r={r}
            strokeOpacity=".16"
            strokeWidth="8"
            strokeDasharray="1 52"
          />
        ))}
      </g>
    </svg>
  );
}

/** Tool tiles bobbing at the hero's edges: left %, top px, size px (wide screens only). */
const FLOATS: [number, number, number][] = [
  [4, 56, 72],
  [88, 40, 80],
  [9, 300, 64],
  [84, 290, 68],
  [94, 170, 56],
];

/** The launcher: a toolboxes-style home that opens each stream tool full screen. */
export function HomePage() {
  const { current } = usePlayer();
  return (
    <div
      className={cn(
        "min-h-dvh overflow-x-clip text-[var(--foreground)]",
        current && "pb-[calc(min(22.25rem,100vw-1rem)*0.5625+4.5rem)]",
      )}
    >
      <header
        className={cn(
          "vt-top sticky top-0 z-30 border-b bg-[color-mix(in_oklab,var(--background)_88%,transparent)]",
          line,
        )}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-2">
          <HubSwitcher
            hubUrl={env.hubUrl}
            apps={subsystems}
            current="stream"
            cookieDomain={import.meta.env.VITE_COOKIE_DOMAIN}
            iconOnly
            className="size-11 justify-center rounded-md text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]"
          />
          <p className="font-heading text-lg font-black">
            crocwork <span className="text-[var(--primary)]">stream</span>
          </p>
        </div>
      </header>

      <main id="content">
        <section className="relative isolate overflow-hidden">
          <Rings />
          {TOOLS.map(({ to, icon: Icon }, i) => {
            const [x, y, size] = FLOATS[i] ?? [0, 0, 0];
            return (
              <Link
                key={to}
                to={to}
                tabIndex={-1}
                aria-hidden
                className={cn("st-float vt-live absolute hidden md:grid", tile, line)}
                style={{
                  left: `${x}%`,
                  top: y,
                  width: size,
                  height: size,
                  animationDuration: `${6 + (i % 3) * 2}s`,
                  animationDelay: `-${i}s`,
                }}
              >
                <Icon className="size-1/2" />
              </Link>
            );
          })}
          <div className="st-rise relative mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center sm:py-24">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Stream tools · {TOOLS.length + 1}
            </p>
            <p className="mt-4 font-heading text-[clamp(2.25rem,9.5vw,7rem)] font-black leading-[0.9]">
              crocwork <span className="text-[var(--primary)]">stream</span>
            </p>
            <h1 className="mt-6 font-heading text-2xl font-black leading-tight sm:text-4xl">
              เลือกเครื่องมือตามวิธีที่อยากดู
            </h1>
            <p className="mt-3 max-w-md text-[var(--muted-foreground)]">
              แต่ละอันใช้ไม่เหมือนกัน หนังเป็นแถวแบบโรงหนัง เพลงมีแถบเล่นด้านล่าง Shorts
              เต็มจอแนวตั้ง ส่วนที่ดูค้างไว้กับเครื่องเล่นใช้ร่วมกันทุกอัน
            </p>
            <a
              href="#tools"
              aria-label="ไปที่เครื่องมือ"
              className={cn(
                "mt-8 grid size-11 place-items-center rounded-full border text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                line,
              )}
            >
              <ArrowDown className="size-4" aria-hidden />
            </a>
          </div>
        </section>

        <section id="tools" aria-label="เครื่องมือ" className={cn("scroll-mt-16 border-t", line)}>
          <div className={cn("mx-auto max-w-6xl xl:border-x", line)}>
            <p
              className={cn(
                "flex items-center justify-between gap-4 border-b px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)] sm:px-8",
                line,
              )}
            >
              <span>01 / Tools</span>
              <span>Web · one login</span>
            </p>
            <div className="px-4 py-10 sm:px-8 sm:py-14">
              <ul
                className={cn(
                  "grid gap-px overflow-hidden rounded-xl border bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)] sm:grid-cols-2 lg:grid-cols-3",
                  line,
                )}
              >
                {TOOLS.map(({ to, label, icon: Icon, blurb }, i) => (
                  <li key={to} className="bg-[var(--background)]">
                    <Link
                      to={to}
                      className="group flex h-full flex-col gap-3 p-6 hover:bg-[color-mix(in_oklab,var(--primary)_6%,transparent)]"
                    >
                      <span className="flex items-center justify-between">
                        <span className={cn("grid size-12", tile, line)}>
                          <Icon className="size-6" aria-hidden />
                        </span>
                        <span className="font-mono text-xs text-[var(--muted-foreground)]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </span>
                      <span className="font-heading text-xl font-black">{label}</span>
                      <span className="flex-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
                        {blurb}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-[var(--primary)]">
                        เปิด
                        <ArrowRight
                          className="size-4 transition-transform group-hover:translate-x-1"
                          aria-hidden
                        />
                      </span>
                    </Link>
                  </li>
                ))}
                <li className="flex flex-col gap-3 bg-[var(--background)] p-6">
                  <span className="flex items-center justify-between">
                    <span className={cn("grid size-12", tile, line)}>
                      <Users className="size-6" aria-hidden />
                    </span>
                    <span className="font-mono text-xs text-[var(--muted-foreground)]">
                      {String(TOOLS.length + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <span className="font-heading text-xl font-black">ดูพร้อมเพื่อน</span>
                  <span className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                    เปิดคลิปในเครื่องมือไหนก็ได้ กดปุ่ม “ดูพร้อมเพื่อน” ในเครื่องเล่น
                    แล้วส่งลิงก์ห้องให้เพื่อน ทุกคนเล่น หยุด และเลื่อนไปพร้อมกัน
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
