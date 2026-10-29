import {
  BlueprintReveal,
  GlowCard,
  IconFolder,
  LanyardBadge,
  LaptopPreview,
  MeshGhost,
  MeshMascot,
  Meteors,
  PerspectiveTunnel,
  PhoneFrame,
  PolaroidLineCarousel,
  WaterRippleCarousel,
  ScrollAssemble,
  TearFooter,
  TextLoop,
  TidelineCta,
} from "@empire/ui";
import {
  Bug,
  Cat,
  Code2,
  Cpu,
  Database,
  FlaskConical,
  KeyRound,
  LayoutDashboard,
  Link2,
  MonitorSmartphone,
  PiggyBank,
  RefreshCw,
  LayoutGrid,
  MessagesSquare,
  Music,
  Palette,
  ShieldCheck,
  Sparkles,
  Store,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { appUrl } from "@/lib/apps";
import { subsystems } from "@/lib/subsystems";
import { SoloFlock } from "./solo-flock";

/*
 * Portfolio page sections, top to bottom. Layout rhythm: light → dark → light → dark,
 * each change cut with a torn-paper edge. Every number and status here is real: app status
 * comes from APP_URL_<SLUG>, counts from the repo.
 */

export { PGTAP_TESTS } from "@/lib/facts";
import { PGTAP_TESTS } from "@/lib/facts";
const COMMUNITY_ROUNDS = 7;

// last commits, as I would say them out loud (update when shipping)
const WORK_LOG = [
  ["24 ต.ค.", "ปิดช่องโหว่ Next.js"],
  ["24 ต.ค.", "เมนู Community แบบ Instagram"],
  ["15 ต.ค.", "Community รอบ 7/7 เสร็จ"],
  ["15 ต.ค.", "แก้บั๊กหน้าขาว"],
] as const;

const DARK = "bg-[var(--em-ink-975)] text-[var(--em-ink-0)]";
const BLUE = "bg-[var(--em-blue-600)] text-[var(--em-ink-0)]";
const EYEBROW = "font-mono text-xs uppercase tracking-[0.2em]";

/* ── torn paper ─────────────────────────────────────────────── */

// deterministic jagged line, so server and client draw the same tear
const TEAR = (() => {
  const points: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const y = 6 + (((i * 37) % 11) - 5) * 0.9 + (i % 3 === 0 ? 2.5 : 0);
    points.push(`${String((i / 60) * 1200)},${y.toFixed(1)}`);
  }
  return points.join(" ");
})();

/** Edge where one band meets the next; `color` is the band it belongs to. */
function TornEdge({ color, flip = false }: { color: string; flip?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 16"
      preserveAspectRatio="none"
      className={`relative z-[1] block h-4 w-full ${flip ? "-mt-px rotate-180" : "-mb-px"}`}
      style={{ color }}
    >
      <polygon points={`0,16 ${TEAR} 1200,16`} fill="currentColor" />
    </svg>
  );
}

/* ── torn panel: a sheet of paper ripped on all four sides, a grey sheet showing behind ── */

/** Rough rectangle as a clip-path; deterministic so server and client agree. */
function tornPolygon(seed: number) {
  const pts: string[] = [];
  const j = (i: number, k: number) => ((((i + seed) * k) % 17) / 17) * 1.6; // 0–1.6 %
  for (let i = 0; i <= 40; i++) pts.push(`${String(i * 2.5)}% ${j(i, 7).toFixed(2)}%`);
  for (let i = 1; i <= 14; i++)
    pts.push(`${(100 - j(i, 11)).toFixed(2)}% ${String((i * 100) / 14)}%`);
  for (let i = 39; i >= 0; i--) pts.push(`${String(i * 2.5)}% ${(100 - j(i, 13)).toFixed(2)}%`);
  for (let i = 13; i >= 1; i--) pts.push(`${j(i, 5).toFixed(2)}% ${String((i * 100) / 14)}%`);
  return `polygon(${pts.join(", ")})`;
}

export function TornPanel({
  tone,
  seed = 1,
  grid = false,
  className = "",
  children,
}: {
  tone: "blue" | "dark";
  seed?: number;
  grid?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const clipPath = tornPolygon(seed);
  return (
    <div className={`relative ${className}`}>
      {/* the sheet underneath: same tear, nudged down-right, slate grey */}
      <div
        aria-hidden
        className="absolute inset-0 translate-x-2.5 translate-y-3 bg-[oklch(0.52_0.02_260/0.45)]"
        style={{ clipPath: tornPolygon(seed + 5) }}
      />
      <div
        className={`relative ${tone === "blue" ? BLUE : DARK}`}
        style={{
          clipPath,
          backgroundImage: grid
            ? "linear-gradient(to right, oklch(1 0 0 / 0.07) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.07) 1px, transparent 1px)"
            : undefined,
          backgroundSize: grid ? "72px 72px" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Paper-cut night landscape torn out as a backdrop for the phones: a deep sky with a moon cut
 * from stacked rings, a few stars and paper clouds, then five ridges stepping from haze to ink.
 * Every sheet has a lit top edge and a shadow, with a faint paper grain over all. Pure vector,
 * so it stays sharp at any size; the hue picks each app's colour, the seed varies the hills.
 */
function PaperArt({ hue, seed }: { hue: number; seed: number }) {
  const c = (l: number, ch: number, dh = 0) =>
    `oklch(${String(l)} ${String(ch)} ${String(hue + dh)})`;
  const rnd = (k: number) => (((seed * 9301 + k * 49297) % 233280) / 233280) * 2 - 1; // -1…1
  // out by the left edge: the back phone stands lower there, so the moon peeks past it
  const moon = { x: 44, y: 70 };
  // back to front: a ridge line, its sheet colour
  const ridges = [0, 1, 2, 3, 4].map((n) => {
    const base = 150 + n * 30;
    const a = base - 26 + rnd(n) * 14;
    const b = base + 8 + rnd(n + 5) * 12;
    const m = base - 18 + rnd(n + 9) * 16;
    const line = `M-10 ${String(a + 10)} C 60 ${String(a - 24)}, 120 ${String(b + 18)}, 200 ${String(m)} S 330 ${String(b - 28)}, 410 ${String(a)}`;
    return { line, fill: c(0.74 - n * 0.1, 0.1 + n * 0.012, n * 6) };
  });
  const id = `pa${String(seed)}`;
  return (
    <div
      aria-hidden
      // wider than the phones (inside the page gutter) so the scene shows around them
      className="absolute -inset-x-3 bottom-2 top-8 overflow-hidden sm:-inset-x-12"
      style={{ clipPath: tornPolygon(seed) }}
    >
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="size-full">
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c(0.3, 0.13, -10)} />
            <stop offset="0.65" stopColor={c(0.55, 0.15)} />
            <stop offset="1" stopColor={c(0.78, 0.09, 12)} />
          </linearGradient>
          <filter id={`${id}-sheet`} x="-5%" y="-20%" width="110%" height="140%">
            <feDropShadow dx="0" dy="-3" stdDeviation="3" floodColor="#000" floodOpacity="0.28" />
          </filter>
          <filter id={`${id}-grain`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>

        <rect width="400" height="300" fill={`url(#${id}-sky)`} />
        {[...Array<number>(14).keys()].map((i) => (
          <circle
            key={i}
            cx={(i * 67 + seed * 31) % 400}
            cy={(i * 29 + seed * 13) % 120}
            r={i % 4 === 0 ? 1.4 : 0.8}
            fill="oklch(0.98 0.02 90)"
            opacity={0.55 + (i % 3) * 0.15}
          />
        ))}
        {/* moon: rings of paper, largest and faintest first */}
        {[46, 35, 26].map((r, i) => (
          <circle
            key={r}
            cx={moon.x}
            cy={moon.y}
            r={r}
            fill={i === 2 ? "oklch(0.97 0.035 92)" : c(0.86 - i * 0.04, 0.05, 20)}
            opacity={i === 2 ? 1 : 0.28 + i * 0.18}
            filter={i === 2 ? `url(#${id}-sheet)` : undefined}
          />
        ))}
        {/* two paper clouds drifting across the moon */}
        {[
          [moon.x - 46, moon.y + 22, 1],
          [moon.x + 30, moon.y + 44, 0.8],
        ].map(([x = 0, y = 0, k = 1], i) => (
          <path
            key={i}
            d={`M${String(x)} ${String(y)} q ${String(10 * k)} ${String(-14 * k)} ${String(24 * k)} ${String(-6 * k)} q ${String(12 * k)} ${String(-12 * k)} ${String(26 * k)} 0 q ${String(14 * k)} 0 ${String(14 * k)} ${String(8 * k)} z`}
            fill="oklch(0.96 0.02 250)"
            opacity="0.92"
            filter={`url(#${id}-sheet)`}
          />
        ))}
        {ridges.map((r, n) => (
          <g key={n} filter={`url(#${id}-sheet)`}>
            <path d={`${r.line} V310 H-10 Z`} fill={r.fill} />
            {/* the cut edge catches the light */}
            <path
              d={r.line}
              fill="none"
              stroke="oklch(1 0 0 / 0.45)"
              strokeWidth={n < 2 ? 1 : 1.4}
            />
          </g>
        ))}
        <rect
          width="400"
          height="300"
          filter={`url(#${id}-grain)`}
          opacity="0.07"
          style={{ mixBlendMode: "overlay" }}
        />
      </svg>
    </div>
  );
}

/* ── status: the terminal ───────────────────────────────────── */

export function StatusSection() {
  const live = subsystems.filter((s) => appUrl(s.slug));
  const building = subsystems.filter((s) => !appUrl(s.slug));
  return (
    <>
      <TornEdge color="var(--em-ink-975)" />
      <section id="status" className={`${DARK} relative scroll-mt-16 overflow-hidden`}>
        <Meteors />
        <div
          data-tide
          className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center"
        >
          <div className="flex flex-col gap-6">
            <p className={`${EYEBROW} text-[var(--em-ink-400)]`}>status · live</p>
            <h2 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              ระบบที่ผมทำ
              <br />
              <span className="text-[var(--em-blue-500)]">ยังรันอยู่ตอนนี้</span>
            </h2>
            <p className="max-w-md text-[var(--em-ink-300)]">
              คนที่คุยงานกับคุณ คือคนที่เขียนโค้ดเอง ตัวเลขข้าง ๆ ไม่ได้แต่ง ดึงจากระบบกับ repo จริง
            </p>
            <dl className="mt-4 grid grid-cols-3 gap-6">
              {[
                [String(live.length), "ระบบที่เปิดให้ใช้แล้ว"],
                [String(PGTAP_TESTS), "เทสต์ความปลอดภัยที่ผ่าน"],
                [`${String(COMMUNITY_ROUNDS)} รอบ`, "ที่ใช้ทำ Community จนจบ"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dd className="text-4xl font-black">{value}</dd>
                  <dt className="mt-1 text-xs text-[var(--em-ink-400)]">{label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="border border-[var(--em-ink-800)] bg-[var(--em-ink-950)] font-mono text-[0.8rem] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-[var(--em-ink-800)] px-4 py-2.5 text-xs text-[var(--em-ink-400)]">
              <span className="size-2.5 rounded-full bg-[var(--em-ink-700)]" />
              <span className="size-2.5 rounded-full bg-[var(--em-ink-700)]" />
              <span className="size-2.5 rounded-full bg-[var(--em-ink-700)]" />
              <span className="ml-2">crocwork@studio ~</span>
            </div>
            <div className="flex flex-col gap-1 p-5">
              <p>$ crocwork status</p>
              <p className="text-[var(--em-ink-400)]">กำลังเช็กระบบที่ผมดูแล…</p>
              {subsystems.map((s) => {
                const on = Boolean(appUrl(s.slug));
                return (
                  <p key={s.slug} className="grid grid-cols-[9rem_1fr] gap-2">
                    <span>{s.slug}</span>
                    <span className={on ? "text-success" : "text-warning"}>
                      {on ? "● เปิดใช้แล้ว" : "◐ กำลังทำ"}
                    </span>
                  </p>
                );
              })}
              <p className="mt-4">$ crocwork quote --mvp</p>
              <p>→ ส่วนใหญ่ 4–8 สัปดาห์ ส่งให้ลองทุกรอบ</p>
              <p>→ ราคาเหมาตามขอบเขต ไม่คิดรายชั่วโมง</p>
              <p>→ โค้ดอยู่ใน repo ของคุณตั้งแต่วันแรก</p>
              <p className="mt-4">$ git log --short</p>
              {WORK_LOG.map(([date, note]) => (
                <p key={note} className="grid grid-cols-[4.5rem_1fr] gap-2">
                  <span className="text-[var(--em-ink-400)]">{date}</span>
                  <span>{note}</span>
                </p>
              ))}
              <p className="mt-4 text-[var(--em-ink-400)]">
                # {building.length} ระบบยังไม่เสร็จ บอกตรง ๆ ไม่ซ่อน
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ── work: one row per app ──────────────────────────────────── */

const WORK: {
  slug: string;
  tag: string;
  title: string;
  pitch: string;
  detail: string;
  /** one shot = one centred phone; two = a fanned pair */
  shots: readonly string[];
  label: string;
  /** paper-art hue behind the phones */
  hue: number;
}[] = [
  {
    slug: "community",
    tag: "Social",
    title: "Community",
    pitch: "โซเชียลแบบ Instagram ครบชุด ฟีด รีลส์ สตอรี่ แชต และโทรหากันได้",
    detail:
      "ทำเป็น 7 รอบ รอบละเรื่อง ทุกรอบมีเทสต์ฝั่งฐานข้อมูลก่อนค่อยทำหน้าจอ ใครบล็อกใคร ใครเห็นโพสต์ไหน ตัดสินที่ฐานข้อมูลทั้งหมด",
    shots: ["/previews/m-community.webp", "/previews/m-messages.webp"],
    label: "แชตเรียลไทม์ · โทร P2P",
    hue: 292,
  },
  {
    slug: "toolboxes",
    tag: "Tools",
    title: "Toolboxes",
    pitch: "เครื่องมือ 121 ชิ้นสำหรับนักพัฒนาและคนทั่วไป ใช้ในเบราว์เซอร์ได้เลย",
    detail:
      "JSON, QR, รหัสผ่าน, ภาษี, เกรดเฉลี่ย งานหนักย้ายไปทำใน Web Worker หน้าจอเลยไม่ค้าง และข้อมูลไม่ออกจากเครื่องคุณ",
    shots: ["/previews/m-toolboxes.webp", "/previews/m-tools.webp"],
    label: "ทำงานในเครื่อง · ไม่ส่งข้อมูลออก",
    hue: 262,
  },
  {
    slug: "canva",
    tag: "Design",
    title: "Empire Canvas",
    pitch: "โปรแกรมกราฟิกหลายเลเยอร์บนเว็บ ทำโพสต์ งานพิมพ์ สไลด์",
    detail:
      "ย้ายมาจากโปรเจกต์เดิมที่เคยทำ แล้วเปลี่ยนหลังบ้านมาใช้ Supabase ทั้งก้อน ไฟล์งานอยู่ในที่เก็บส่วนตัวของแต่ละคน",
    shots: ["/previews/m-canva.webp"],
    label: "หลายเลเยอร์ · บันทึกอัตโนมัติ",
    hue: 215,
  },
];

/**
 * Two (or one) phones over torn paper-cut art. Hovering the row fans them apart: the back
 * phone leans further out, the front one lifts. Transform-only transitions.
 */
function Phones({
  shots,
  flip,
  hue,
  seed,
}: {
  shots: readonly string[];
  flip: boolean;
  hue: number;
  seed: number;
}) {
  const [first, second] = shots;
  const ease =
    "transition-transform duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]";
  return (
    <div
      aria-hidden
      className={`vt-live relative mx-auto h-[28rem] w-full max-w-md sm:h-[32rem] ${flip ? "lg:order-2" : ""}`}
    >
      <PaperArt hue={hue} seed={seed} />
      {second ? (
        <>
          <PhoneFrame
            className={`absolute left-[6%] top-10 w-[44%] -rotate-[7deg] sm:w-[44%] md:w-[44%] ${ease} group-hover:-translate-x-4 group-hover:-rotate-[11deg]`}
          >
            <Image
              src={first ?? ""}
              alt=""
              fill
              sizes="220px"
              className="object-cover object-top"
            />
          </PhoneFrame>
          <PhoneFrame
            className={`absolute right-[6%] top-2 w-[47%] rotate-[4deg] sm:w-[47%] md:w-[47%] ${ease} group-hover:-translate-y-3 group-hover:translate-x-3 group-hover:rotate-[6deg]`}
          >
            <Image src={second} alt="" fill sizes="240px" className="object-cover object-top" />
          </PhoneFrame>
        </>
      ) : (
        <PhoneFrame
          className={`absolute left-1/2 top-2 w-[52%] -translate-x-1/2 rotate-[3deg] sm:w-[52%] md:w-[52%] ${ease} group-hover:-translate-y-3 group-hover:rotate-0`}
        >
          <Image src={first ?? ""} alt="" fill sizes="260px" className="object-cover object-top" />
        </PhoneFrame>
      )}
    </div>
  );
}

/* ── work reel: a pinned scroll interlude before the case studies ── */

export const APP_ICON: Record<string, typeof Code2> = {
  community: MessagesSquare,
  commerce: Store,
  toolboxes: Wrench,
  tarot: Sparkles,
  design: LayoutGrid,
  canva: Palette,
  crocbyte: Code2,
  stream: Music,
};

export function WorkReel() {
  const live = subsystems.filter((s) => appUrl(s.slug)).length;
  return (
    <ScrollAssemble
      title="selected work"
      titleClassName="pk-depth"
      eyebrow={
        <p className={`${EYEBROW} cw-blue`}>
          portfolio · {subsystems.length} ระบบ · เปิดแล้ว {live}
        </p>
      }
      backdrop={
        <>
          {/* horizon glow, then a grid floor running away from us */}
          <div className="sw-horizon" />
          <div className="sw-floor" />
        </>
      }
      items={subsystems.map((s) => {
        const Icon = APP_ICON[s.slug] ?? Code2;
        const open = Boolean(appUrl(s.slug));
        const tile = (
          <>
            <span className="sw-tile" style={{ ["--a" as string]: s.accent }}>
              <Icon className="size-7" aria-hidden />
              <span
                aria-hidden
                className={`sw-dot ${open ? "bg-success" : "bg-[var(--em-gold-300)]"}`}
              />
            </span>
            <span className="text-xs font-semibold">{s.name}</span>
          </>
        );
        return open ? (
          <a key={s.slug} href={`/go/${s.slug}`} className="sw-app" aria-label={`เปิด ${s.name}`}>
            {tile}
          </a>
        ) : (
          <span key={s.slug} className="sw-app" title="กำลังทำ">
            {tile}
          </span>
        );
      })}
      caption={
        <p className="max-w-md text-muted-foreground">
          ล็อกอินครั้งเดียว ใช้ได้ทุกระบบ กดไอคอนเพื่อเปิด หรือเลื่อนลงไปดูทีละตัว
        </p>
      }
    />
  );
}

export function WorkSection() {
  const others = subsystems.filter((s) => !WORK.some((w) => w.slug === s.slug));
  const live = subsystems.filter((s) => appUrl(s.slug)).length;
  return (
    <section
      data-tide
      id="subsystems"
      className="mx-auto max-w-6xl scroll-mt-16 px-4 py-24 sm:px-6"
    >
      <div className="grid gap-6 border-b pb-12 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className={`${EYEBROW} cw-blue`}>work</p>
          <h2 className="mt-3 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            ระบบของผมเอง {subsystems.length} ตัว
            <br />
            <span className="cw-blue">เปิดให้ลองแล้ว {live} ตัว</span>
          </h2>
        </div>
        <p className="text-muted-foreground">
          สามตัวข้างล่างคือตัวที่ผมภูมิใจที่สุด ภาพในมือถือคือหน้าจอจริง ไม่ใช่ภาพตัวอย่าง
          ที่เหลืออยู่ท้ายส่วนนี้ สถานะตรงกับที่ระบบรายงาน
        </p>
      </div>

      <div className="flex flex-col gap-24 pt-16">
        {WORK.map((w, i) => {
          const url = appUrl(w.slug);
          return (
            <article key={w.slug} className="group grid items-center gap-10 lg:grid-cols-2">
              <Phones shots={w.shots} flip={i % 2 === 1} hue={w.hue} seed={i * 4 + 2} />
              <div className="flex flex-col gap-4">
                <div className="flex gap-2 text-xs">
                  <span
                    className={`border px-2 py-1 font-medium ${url ? "text-success" : "text-warning"}`}
                  >
                    {url ? "● เปิดใช้แล้ว" : "◐ กำลังทำ"}
                  </span>
                  <span className="border px-2 py-1 font-mono">{w.tag}</span>
                </div>
                <h3 className="text-4xl font-black tracking-tight sm:text-5xl">{w.title}</h3>
                <p className="text-lg">{w.pitch}</p>
                <p className="text-muted-foreground">{w.detail}</p>
                <p className="flex gap-3 text-sm">
                  <span className="font-mono text-xs cw-blue">จุดเด่น</span>
                  {w.label}
                </p>
                {url && (
                  <a
                    href={`/go/${w.slug}`}
                    className="w-fit text-sm font-bold cw-blue hover:underline"
                  >
                    เปิด {w.title} ↗
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <ul className="mt-24 grid gap-4 border-t pt-10 sm:grid-cols-2 lg:grid-cols-4">
        {others.map((s) => (
          <li key={s.slug} className="border border-dashed p-4">
            {appUrl(s.slug) ? (
              <a href={`/go/${s.slug}`} className="text-xs text-success hover:underline">
                ● เปิดใช้แล้ว ↗
              </a>
            ) : (
              <p className="text-xs text-warning">◐ กำลังทำ</p>
            )}
            <p className="mt-1 font-bold">{s.name}</p>
            <p className="text-sm text-muted-foreground">{s.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── screens: real screenshots pegged to a string ─────────── */

// desktop screens ripple in large; phone screens hang on the string below
const DESKTOP_SHOTS = [
  ["/previews/community.webp", "community"],
  ["/previews/canva.webp", "canva"],
  ["/previews/toolboxes.webp", "toolboxes"],
] as const;

const SHOTS = [
  ["/previews/m-community.webp", "Community", "ฟีด · มือถือ"],
  ["/previews/m-messages.webp", "Community", "แชตเรียลไทม์ · มือถือ"],
  ["/previews/m-canva.webp", "Empire Canvas", "มือถือ"],
  ["/previews/m-toolboxes.webp", "Toolboxes", "มือถือ"],
  ["/previews/m-tools.webp", "Toolboxes", "เครื่องมือ · มือถือ"],
] as const;

// every real screen, desktop and phone, interleaved so the flight alternates shapes
const TUNNEL = [
  ["/previews/community.webp", "Community", "เดสก์ท็อป", "community"],
  ["/previews/m-messages.webp", "Community", "แชตเรียลไทม์", "community"],
  ["/previews/canva.webp", "Empire Canvas", "เดสก์ท็อป", "canva"],
  ["/previews/m-toolboxes.webp", "Toolboxes", "มือถือ", "toolboxes"],
  ["/previews/toolboxes.webp", "Toolboxes", "เดสก์ท็อป", "toolboxes"],
  ["/previews/m-community.webp", "Community", "ฟีด", "community"],
  ["/previews/m-canva.webp", "Empire Canvas", "มือถือ", "canva"],
  ["/previews/m-tools.webp", "Toolboxes", "เครื่องมือ", "toolboxes"],
] as const;

export function WorkTunnel() {
  return (
    <PerspectiveTunnel
      id="fly"
      eyebrow={<p className={`${EYEBROW} cw-blue mb-4`}>fly-through · {TUNNEL.length} หน้าจอ</p>}
      title={
        <>
          บินเข้าไป
          <br />
          <span className="cw-blue">ในงานจริง</span>
        </>
      }
      body="ทุกใบคือหน้าจอจริงจากระบบที่เปิดใช้อยู่ กดใบไหนก็เข้าไปลองได้เลย"
      prompt="เลื่อนลงเพื่อบินเข้าไป"
      items={TUNNEL.map(([src, title, caption, slug]) => ({
        src,
        title,
        caption,
        href: `/go/${slug}`,
      }))}
    />
  );
}

// the same four screens as they look on a notebook, lid opening as you scroll in
const LAPTOP = [
  {
    src: "/previews/hub.webp",
    title: "Hub",
    description: "หน้าแรกของทุกระบบ ล็อกอินที่นี่ครั้งเดียว ใช้ได้ทุกแอป",
    label: "crocwork.studio",
    icon: <LayoutGrid aria-hidden />,
    color: "var(--em-blue-500)",
  },
  {
    src: "/previews/community.webp",
    title: "Community",
    description: "โซเชียลเต็มรูปแบบ ฟีด รีลส์ สตอรี่ และแชตเรียลไทม์",
    label: "Community",
    icon: <MessagesSquare aria-hidden />,
    color: "var(--em-violet-500)",
    href: "/go/community",
    cta: "เปิดดู",
  },
  {
    src: "/previews/canva.webp",
    title: "Empire Canvas",
    description: "โปรแกรมกราฟิกหลายเลเยอร์บนเว็บ",
    label: "Canvas",
    icon: <Palette aria-hidden />,
    color: "var(--em-sky-500)",
    href: "/go/canva",
    cta: "เปิดดู",
  },
  {
    src: "/previews/toolboxes.webp",
    title: "Toolboxes",
    description: "เครื่องมือนักพัฒนาและ MCP Inspector ในเบราว์เซอร์",
    label: "Toolboxes",
    icon: <Wrench aria-hidden />,
    color: "var(--em-blue-700)",
    href: "/go/toolboxes",
    cta: "เปิดดู",
  },
];

export function LaptopSection() {
  return (
    <LaptopPreview
      id="laptop"
      eyebrow={<p className={`${EYEBROW} cw-blue mb-3`}>on a notebook</p>}
      title={
        <>
          เปิดบนโน้ตบุ๊ก <span className="cw-blue">หน้าตาแบบนี้</span>
        </>
      }
      subtitle="เลื่อนลงเพื่อเปิดฝา แล้วกดเลือกระบบที่อยากดู"
      logo={<Image src="/crocwork-logo.webp" alt="" width={42} height={48} />}
      steps={LAPTOP}
      pickLabel="เลือกหน้าจอ"
    />
  );
}

export function ShotsSection() {
  return (
    <section data-tide id="screens" className="mx-auto max-w-6xl scroll-mt-16 px-4 pb-24 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-t pt-12">
        <div>
          <p className={`${EYEBROW} cw-blue`}>screens</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            หน้าจอจริง <span className="cw-blue">ไม่ใช่ภาพตัวอย่าง</span>
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          แตะภาพเพื่อเปลี่ยน · ลากรูปมือถือเพื่อเลื่อน
        </p>
      </div>
      <WaterRippleCarousel
        className="mb-16"
        height="min(68svh, 640px)"
        autoplay={7000}
        ariaLabel="ภาพหน้าจอเดสก์ท็อปของระบบ"
        labels={{
          prev: "ภาพก่อนหน้า",
          next: "ภาพถัดไป",
          slide: "ภาพที่ {n} จาก {total}",
        }}
        style={{
          ["--wr-title-font" as string]: "900 clamp(32px, 5vw, 68px)/1 var(--font-heading)",
        }}
        slides={DESKTOP_SHOTS.map(([image, slug]) => {
          const app = subsystems.find((x) => x.slug === slug);
          return {
            image,
            title: app?.name ?? slug,
            caption: app?.summary,
            alt: `ภาพหน้าจอ ${app?.name ?? slug} บนเดสก์ท็อป`,
          };
        })}
      />
      <PolaroidLineCarousel
        height="560px"
        cardWidth={240}
        autoplay={5000}
        string="var(--em-ink-400)"
        ariaLabel="ภาพหน้าจอมือถือจริงของระบบ"
        labels={{ prev: "รูปก่อนหน้า", next: "รูปถัดไป", print: "รูปที่ {n} จาก {total}" }}
        style={{
          ["--pl-focus" as string]: "50% 0%",
          ["--pl-note-font" as string]: "500 22px/1 Caveat, cursive",
          ["--pl-title-font" as string]: "900 clamp(18px, 2.2vw, 26px)/1.15 var(--font-heading)",
        }}
        slides={SHOTS.map(([image, title, caption]) => ({
          image,
          title,
          caption,
          alt: `ภาพหน้าจอ ${title} ${caption}`,
        }))}
      />
    </section>
  );
}

/* ── about: who, what, and the road so far ─────────────────── */

const FOCUS = ["Product & UX", "Frontend", "Backend & Security", "AI ในเบราว์เซอร์"] as const;

const ROAD = [
  ["15 ต.ค. 2569", "วางฐาน Hub + SSO", "ล็อกอินครั้งเดียว ใช้ได้ทุกระบบ"],
  ["15 ต.ค. 2569", "Community ครบ 7 รอบ", "ฟีด แชต รีลส์ โทร หน้าผู้ดูแล"],
  ["24 ต.ค. 2569", "ธีมกลาง + พอร์ตนี้", "สลับธีมที่ไหน ทุกระบบเปลี่ยนตาม"],
  ["ต่อไป", "Commerce · AI Tarot", "กำลังทำ"],
] as const;

export function AboutSection() {
  const live = subsystems.filter((s) => appUrl(s.slug)).length;
  return (
    <section data-tide id="about" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-24 sm:px-6">
      <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className={`${EYEBROW} cw-blue`}>about</p>
          <h2 className="mt-3 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            ออกแบบเป็น เขียนโค้ดได้
            <br />
            <span className="cw-blue">แล้วส่งงานจนมีคนใช้</span>
          </h2>
          <div className="mt-8 flex max-w-xl flex-col gap-4 text-muted-foreground">
            <p>
              ผมทำ crocwork.studio คนเดียวทุกตำแหน่ง ตั้งแต่คุยโจทย์ วาดหน้าจอ เขียนโค้ด
              ออกแบบฐานข้อมูล ไปจนถึงขึ้นระบบจริงและดูแลต่อ ไม่มีคนกลาง ไม่มีส่งต่อทีม
            </p>
            <p>
              ชอบงานที่ต้องคิดเรื่องสิทธิ์ให้ถูกตั้งแต่ฐานข้อมูล และหน้าจอที่ใช้ง่ายจนไม่ต้องอธิบาย
            </p>
          </div>
        </div>
        <LanyardBadge
          className="lg:-mt-24"
          strapText="crocwork.studio"
          flipLabel="ดูด้านหลัง"
          frontLabel="ดูด้านหน้า"
          cardLabel="บัตรของ crocwork.studio กดเพื่อพลิก ลากเพื่อเหวี่ยง"
          front={
            <div className="flex h-full flex-col p-6 pt-10">
              <Image
                src="/crocwork-logo.webp"
                alt=""
                width={48}
                height={56}
                className="h-14 w-auto"
              />
              <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] cw-blue">
                solo studio · since 2569
              </p>
              <p className="mt-2 text-2xl font-black leading-none tracking-tight">
                crocwork<span className="cw-blue">.studio</span>
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                ทำคนเดียวทุกตำแหน่ง ตั้งแต่คุยโจทย์จนดูแลระบบ
              </p>
              <p className="mt-auto flex justify-between border-t pt-4 font-mono text-[10px] text-muted-foreground">
                <span>PM · PL · AIE</span>
                <span>
                  {live}/{subsystems.length} live
                </span>
              </p>
            </div>
          }
          back={
            <div className="flex h-full flex-col p-6 pt-10">
              <p className={`${EYEBROW} cw-blue`}>focus</p>
              <ol className="mt-4 flex flex-col gap-3">
                {FOCUS.map((f, n) => (
                  <li key={f} className="flex gap-3 border-b pb-3">
                    <span className="font-mono text-xs cw-blue">0{n + 1}</span>
                    <span className="font-black">{f}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-auto font-mono text-[10px] text-muted-foreground">
                github.com/CROC101
              </p>
            </div>
          }
        />
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.1fr_1fr]">
        <TornPanel tone="dark" seed={3}>
          <dl className="px-8 py-6">
            {[
              ["สตูดิโอ", "crocwork.studio"],
              ["ทำงานแบบ", "คนเดียว ทุกตำแหน่ง"],
              ["ระบบในพอร์ต", `${String(subsystems.length)} ระบบ · เปิดแล้ว ${String(live)}`],
              ["เทสต์ความปลอดภัย", `${String(PGTAP_TESTS)} ข้อ ผ่านทุกข้อ`],
              ["สแตกหลัก", "Next.js · Vite · Supabase"],
              ["สถานะ", "เปิดรับงาน"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between gap-4 border-b border-[var(--em-ink-800)] py-3.5 last:border-0"
              >
                <dt className="font-mono text-xs text-[var(--em-ink-400)]">{k}</dt>
                <dd className="text-right font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        </TornPanel>
        <div>
          <p className={`${EYEBROW} text-muted-foreground`}>เส้นทาง</p>
          <ol className="mt-6 border-l-2 border-[var(--em-blue-500)]/30 pl-7">
            {ROAD.map(([when, what, note]) => (
              <li key={what} className="relative pb-8 last:pb-0">
                <span className="absolute -left-[2.2rem] top-1 size-3 bg-[var(--em-blue-600)] ring-4 ring-background" />
                <p className="font-mono text-xs text-muted-foreground">{when}</p>
                <p className="mt-1 text-lg font-black">{what}</p>
                <p className="text-sm text-muted-foreground">{note}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ── skills: chips by area ──────────────────────────────────── */

const SKILLS = [
  ["design", ["UX/UI", "Design Tokens", "Motion", "Accessibility"]],
  ["frontend", ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vite"]],
  ["backend / database", ["Supabase", "PostgreSQL", "Row Level Security", "pgTAP", "Realtime"]],
  ["tools", ["Git / GitHub", "Turborepo", "pnpm", "Vitest", "Web Workers"]],
] as const;

const WAYS = [
  "คุยตรง ไม่อ้อม",
  "แก้ที่ต้นเหตุ",
  "เขียนเทสต์ก่อนส่ง",
  "อธิบายเรื่องเทคนิคให้ง่าย",
  "ใส่ใจรายละเอียด",
  "รับ feedback",
] as const;

export function SkillsSection() {
  return (
    <section data-tide id="skills" className="mx-auto max-w-6xl scroll-mt-16 px-4 pb-24 sm:px-6">
      <p className={`${EYEBROW} cw-blue`}>skills</p>
      <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
        ของที่ใช้ <span className="cw-blue">ทุกวัน</span>
      </h2>
      <ul className="mt-10 grid border-l border-t sm:grid-cols-2 lg:grid-cols-4">
        {SKILLS.map(([area, chips]) => (
          <li key={area} className="border-b border-r p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {area}
            </p>
            <p className="mt-5 flex flex-wrap gap-2">
              {chips.map((c) => (
                <span key={c} className="border px-2.5 py-1 text-sm">
                  {c}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap items-center gap-2.5">
        <span className={`${EYEBROW} mr-2 text-muted-foreground`}>ways of working</span>
        {WAYS.map((w) => (
          <span key={w} className="cw-btn-blue px-3.5 py-1.5 text-sm font-bold">
            {w}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ── services ───────────────────────────────────────────────── */

const SERVICES = [
  [
    "01",
    "เว็บแอปและ MVP",
    "ตัวแรกของโปรดักต์ที่เอาไปให้ลูกค้าลองได้ พร้อมหน้าผู้ดูแลไว้ดูข้อมูล",
    ["4–8 สัปดาห์", "ราคาเหมา"],
    ["หน้าจอที่ใช้งานได้จริง", "หน้าผู้ดูแลดูข้อมูล", "ลิงก์ให้ลองทุกรอบ"],
  ],
  [
    "02",
    "AI ที่รันในเครื่อง",
    "ให้โมเดลทำงานในเบราว์เซอร์ผู้ใช้เลย ไม่ต้องจ่ายค่า GPU รายเดือน",
    ["ราคาเหมา"],
    ["โมเดลรันในเบราว์เซอร์", "ไม่ส่งข้อมูลออกนอกเครื่อง", "ไม่มีค่า GPU รายเดือน"],
  ],
  [
    "03",
    "ระบบหลังบ้านและสิทธิ์",
    "ฐานข้อมูล ล็อกอินครั้งเดียวหลายระบบ กฎว่าใครเห็นอะไรพร้อมเทสต์",
    ["ราคาเหมา"],
    ["ฐานข้อมูลพร้อมกฎสิทธิ์", "ล็อกอินครั้งเดียวทุกระบบ", "เทสต์สิทธิ์ทุกตาราง"],
  ],
  [
    "04",
    "ดูแลต่อหลังเปิดใช้",
    "แก้บั๊ก อัปเดตความปลอดภัย เพิ่มของเล็ก ๆ ทุกเดือน",
    ["รายเดือน"],
    ["แก้บั๊ก", "อัปเดตความปลอดภัย", "ของเล็ก ๆ ทุกเดือน"],
  ],
] as const;

// one tile per deliverable, in SERVICES order; tile colour per service
const SERVICE_ICONS = [
  [MonitorSmartphone, LayoutDashboard, Link2],
  [Cpu, ShieldCheck, PiggyBank],
  [Database, KeyRound, FlaskConical],
  [Bug, RefreshCw, Sparkles],
] as const;
const SERVICE_TILES = [
  "linear-gradient(135deg, var(--em-blue-500), var(--em-blue-700))",
  "linear-gradient(135deg, var(--em-violet-500), var(--em-violet-700))",
  "linear-gradient(135deg, var(--em-sky-500), var(--em-blue-600))",
  "linear-gradient(135deg, var(--em-ink-700), var(--em-ink-950))",
];

export function ServicesSection({ aside }: { aside: ReactNode }) {
  return (
    <section data-tide id="services" className="mx-auto max-w-6xl scroll-mt-16 px-4 pb-24 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className={`${EYEBROW} cw-blue`}>services</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
            รับทำ <span className="cw-blue">{SERVICES.length} อย่าง</span>
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            งานส่วนใหญ่คิดเป็นก้อนตามขอบเขตที่ตกลงกัน ไม่คิดรายชั่วโมง
            ส่วนงานดูแลหลังเปิดใช้จ่ายรายเดือน
          </p>
        </div>
        <div className="w-full max-w-md">{aside}</div>
      </div>

      <div className="mt-12 grid justify-items-center gap-x-8 gap-y-12 md:grid-cols-2">
        {SERVICES.map(([n, title, body, terms, files], i) => (
          <div key={n} className="flex w-full max-w-[420px] flex-col gap-3">
            <p className="flex items-baseline gap-2 text-sm text-muted-foreground">
              <span className={`${EYEBROW} cw-blue`}>{n}</span>
              {terms.join(" · ")}
            </p>
            <IconFolder
              title={title}
              tags={files}
              body={body}
              icons={files.map((label, k) => {
                const Icon = SERVICE_ICONS[i]?.[k] ?? Sparkles;
                return {
                  label,
                  node: <Icon aria-hidden strokeWidth={2.2} />,
                  background: SERVICE_TILES[i] ?? SERVICE_TILES[0] ?? "",
                };
              })}
            />
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        ชี้หรือแตะแฟ้มเพื่อกางไอคอน · ชี้ไอคอนเพื่อดูว่าได้อะไร
      </p>

      <TornPanel tone="dark" seed={7} className="mt-10 max-w-2xl">
        <div className="px-9 py-9">
          <p className={`${EYEBROW} text-[var(--em-ink-400)]`}>good fit</p>
          <ul className="mt-4 flex flex-col gap-3 font-semibold">
            {[
              "มีไอเดียแล้ว อยากได้ตัวแรกไปลองกับลูกค้าก่อนลงเงินก้อนใหญ่",
              "ระบบเดิมช้า คนเขียนไว้ลาออกไปแล้ว ไม่มีใครกล้าแตะ",
              "อยากได้ AI ช่วยงานแต่ไม่อยากส่งข้อมูลลูกค้าออกไปข้างนอก",
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <span aria-hidden className="text-[var(--em-blue-500)]">
                  →
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </TornPanel>
    </section>
  );
}

/* ── how: dark band with the steps, then the promise ───────── */

const STEPS = [
  [
    "step 01 · สัปดาห์ 1",
    "ถามจนชัด",
    "ใครจะใช้ ใช้ตอนไหน วัดยังไงว่าสำเร็จ ได้คำตอบก่อนแล้วค่อยตีราคา",
  ],
  ["step 02", "วาดให้เห็นภาพ", "หน้าจอหลัก ข้อมูลที่ต้องเก็บ อะไรทำก่อนทำหลัง คุณดูแผนเดียวกับผม"],
  ["step 03 · ทุกสัปดาห์", "ทำทีละรอบ", "จบแต่ละรอบ ส่งลิงก์ให้กดลองเอง ไม่ชอบตรงไหนก็บอก"],
  ["step 04", "เปิดใช้", "ขึ้นเซิร์ฟเวอร์จริง ตั้งระบบแจ้งเตือน ไม่เช็กลิสต์วันเปิดทีละข้อ"],
  [
    "step 05 · รายเดือน",
    "ดูแลต่อ",
    "อ่านคอมเมนต์คนใช้ แก้บั๊ก ทำให้เร็วขึ้น ของใหม่ค่อยเพิ่มทีหลัง",
  ],
] as const;

export function HowSection() {
  return (
    <>
      <TornEdge color="var(--em-ink-975)" />
      <section id="how" className={`${DARK} relative scroll-mt-16 overflow-hidden`}>
        <Meteors count={5} />
        {/* the night owl keeps watch over the plan; it dresses up for festivals like the ghost */}
        <MeshMascot
          kind="owl"
          className="absolute right-[8%] top-14 hidden w-24 sm:block lg:right-[12%] lg:w-28"
        />
        <div data-tide className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
            <h2 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              ผมถือว่างานจบ
              <br />
              <span className="text-[var(--em-blue-500)]">ตอนที่มีคนเปิดใช้</span>
            </h2>
            <p className="text-[var(--em-ink-300)]">
              ทำเป็นรอบสั้น ๆ ถ้าเดินผิดทาง จะรู้ตั้งแต่รอบแรก ๆ ตอนที่เลี้ยวกลับยังง่าย
            </p>
          </div>
          <BlueprintReveal word="BLUEPRINT" className="mt-12" />
          <ol className="mt-12 flex flex-col">
            {STEPS.map(([label, title, body]) => (
              <li
                key={title}
                className="grid gap-2 border-t border-[var(--em-ink-800)] py-6 sm:grid-cols-[12rem_14rem_1fr] sm:items-baseline"
              >
                <span className="font-mono text-xs text-[var(--em-ink-400)]">{label}</span>
                <span className="text-2xl font-black">{title}</span>
                <span className="text-sm text-[var(--em-ink-300)]">{body}</span>
              </li>
            ))}
          </ol>

          <TornPanel tone="blue" seed={11} grid className="mt-20">
            <div className="relative grid gap-8 px-8 py-12 sm:px-12 lg:grid-cols-[1.3fr_1fr] lg:items-center">
              <div>
                <p className={`${EYEBROW} opacity-80`}>my promise</p>
                <p className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
                  ถ้าราคาที่ตกลงไว้ไม่พอกับงาน ผมบอกตั้งแต่วันที่รู้
                </p>
                <p className="mt-8 border-t border-[var(--em-ink-0)]/25 pt-5 opacity-90">
                  งานงอกกลางทาง ผมบอกก่อนว่าเพิ่มเงินหรือเวลาเท่าไร
                  แล้วให้คุณเลือกว่าจะเอาหรือเก็บไว้รอบหน้า
                </p>
                <p className="mt-5 border-t border-[var(--em-ink-0)]/25 pt-5 opacity-90">
                  โค้ด ฐานข้อมูล และเอกสาร เป็นของคุณตั้งแต่วันแรก ทีมคุณดูแลต่อเองได้
                </p>
              </div>
              <Sticker className="mx-auto w-56 rotate-6 lg:w-64" />
            </div>
          </TornPanel>
        </div>
      </section>
      <SoloFlock />
      <TornEdge color="var(--em-ink-975)" flip />
    </>
  );
}

/* ── team: one person and the robots ────────────────────────── */

// hue: each card glows in its own shade of the cool family (blue, violet, sky, indigo)
const TEAM: {
  icon: typeof Code2;
  role: string;
  name: string;
  body: string;
  hue: number;
  tone: string;
}[] = [
  {
    icon: Code2,
    role: "founder · ทุกตำแหน่ง",
    name: "ผม",
    hue: 250,
    tone: "var(--em-blue-500)",
    body: "PM, ออกแบบหน้าจอ, เขียนโค้ด, ฐานข้อมูล, ทดสอบ, ขึ้นระบบ คุยงานกับผม คือคุยกับคนที่ลงมือทำ",
  },
  {
    icon: Sparkles,
    role: "ผู้ช่วย",
    name: "AI ในทีม",
    hue: 290,
    tone: "var(--em-violet-500)",
    body: "ช่วยร่างโค้ดกับเทสต์ ผมอ่านและตัดสินใจทุกบรรทัดเอง งานไหนใช้ AI ผมบอกตรง ๆ",
  },
  {
    icon: ShieldCheck,
    role: "ยาม",
    name: `${String(PGTAP_TESTS)} เทสต์`,
    hue: 225,
    tone: "var(--em-sky-500)",
    body: "ยามหน้าประตูฐานข้อมูล ถ้ากฎสิทธิ์ข้อไหนพัง ระบบไม่ยอมให้ขึ้นจริง",
  },
  {
    icon: Cat,
    role: "มาสคอต",
    name: "แมว Community",
    hue: 265,
    tone: "var(--em-blue-700)",
    body: "ไม่ได้ช่วยอะไรเลย แต่หน้าตาน่ารักเลยได้เป็นโลโก้",
  },
];

export function TeamSection() {
  return (
    <section data-tide id="team" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-24 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className={`${EYEBROW} cw-blue`}>team</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
            คนเดียว <span className="cw-blue">กับแมวหนึ่งตัว</span>
          </h2>
        </div>
        <p className="text-muted-foreground">
          ไม่มีเซลส์คั่นกลาง ไม่มีส่งต่อทีม ตัดสินใจได้ในวันเดียว
          และคุยเรื่องเทคนิคกับคนที่พิมพ์โค้ดเองได้เลย
        </p>
      </div>
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEAM.map(({ icon: Icon, role, name, body, hue, tone }) => (
          <li key={name} className="flex">
            <GlowCard hue={hue} className="flex w-full flex-col p-5">
              <div className="grid aspect-[5/4] place-items-center">
                <Icon aria-hidden className="size-16" strokeWidth={1.3} style={{ color: tone }} />
              </div>
              <p className="mt-4 font-mono text-[0.7rem] uppercase text-muted-foreground">{role}</p>
              <p className="text-lg font-black">{name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </GlowCard>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── faq ────────────────────────────────────────────────────── */

const FAQ = [
  [
    "คิดราคายังไง",
    "งาน MVP, AI และระบบหลังบ้าน คิดเป็นก้อนตามขอบเขตที่ตกลงกันก่อนเริ่ม ไม่คิดรายชั่วโมง งานดูแลคิดรายเดือน เดือนไหนงานน้อยกว่าที่ตกลง ยกยอดไปเดือนหน้า",
  ],
  [
    "ใช้เวลานานแค่ไหน",
    "MVP ส่วนใหญ่ 4–8 สัปดาห์ แต่ส่งให้ลองตั้งแต่สัปดาห์แรก ๆ ไม่ต้องรอจนเสร็จทั้งก้อน",
  ],
  [
    "โค้ดเป็นของใคร",
    "ของคุณ อยู่ใน repo ของคุณตั้งแต่วันแรก วันไหนอยากเปลี่ยนคนทำก็เอาไปต่อได้ทันที",
  ],
  [
    "รับระบบที่คนอื่นทำไว้ไหม",
    "รับ ขอเวลาอ่านโค้ดก่อนหนึ่งสัปดาห์ แล้วบอกตรง ๆ ว่าแก้ต่อคุ้มกว่า หรือเขียนใหม่คุ้มกว่า",
  ],
  [
    "ทำไมเชื่อได้ว่าคนเดียวทำทันจริง",
    "เลื่อนขึ้นไปดูได้ ระบบที่เปิดอยู่ตอนนี้ทำคนเดียวทั้งหมด และทุกตัวกดเข้าไปลองได้จริง",
  ],
] as const;

export function FaqSection() {
  return (
    <section
      data-tide
      id="faq"
      className="mx-auto grid max-w-6xl scroll-mt-16 gap-12 px-4 pb-24 sm:px-6 lg:grid-cols-[1fr_2fr]"
    >
      <div>
        <p className={`${EYEBROW} cw-blue`}>faq</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">ถามกันบ่อย</h2>
        {/* the topics people actually ask about, one at a time */}
        <TextLoop
          staticText="ถามเรื่อง"
          rotatingTexts={["ราคา", "เวลา", "โค้ด", "ระบบเดิม", "ทำทันไหม"]}
          className="mt-10 text-3xl font-black tracking-tight sm:text-4xl"
          staticTextClassName="text-muted-foreground"
        />
      </div>
      <div className="flex flex-col">
        {FAQ.map(([q, a], i) => (
          <details key={q} open={i === 0} className="group border-b py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-black [&::-webkit-details-marker]:hidden">
              {q}
              <span
                aria-hidden
                className="text-2xl font-normal cw-blue transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ── contact + footer ───────────────────────────────────────── */

export function ContactSection({ cta }: { cta: { href: string; label: string } }) {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const live = subsystems.filter((s) => appUrl(s.slug)).length;
  const share = live / subsystems.length;
  return (
    <div id="contact" className="scroll-mt-16">
      <TidelineCta
        eyebrow="start a project"
        headline={
          <>
            ยังไม่มีสเปก
            <br />
            <span className="cw-blue">ก็ทักมาได้</span>
          </>
        }
        sub="แค่อยากรู้ว่าไอเดียนี้ทำได้ไหม ทักมาได้ ไม่ต้องเตรียมสไลด์ เล่าคร่าว ๆ ว่าอยากได้อะไร ใช้เมื่อไร ผมจะตอบว่าควรเริ่มตรงไหนให้พอกับงบ"
        level={share}
        levelLabel={`ระดับน้ำ = ระบบที่เปิดใช้แล้ว ${String(live)} จาก ${String(subsystems.length)} (${String(Math.round(share * 100))}%)`}
        details={[
          ...(email ? [`อีเมล ${email}`] : []),
          "GitHub CROC101/software-empire",
          "ตอบภายใน 1 วันทำการ",
          "ไทย / English",
        ]}
        action={email ? "ส่งอีเมลหาผม" : cta.label}
        href={email ? `mailto:${email}` : cta.href}
        floating={<MeshGhost className="w-20 sm:w-28" />}
      />
    </div>
  );
}

const GITHUB = "https://github.com/CROC101/software-empire";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <TearFooter
      brand="crocwork."
      ink
      name="crocwork.studio"
      logo={<Image src="/crocwork-logo.webp" alt="" width={38} height={44} />}
      logoHref="/"
      socials={[{ icon: "github", label: "GitHub", href: GITHUB }]}
      email={process.env.NEXT_PUBLIC_CONTACT_EMAIL}
      corner={{ label: "CROC101/software-empire", href: GITHUB }}
      invite={{ label: "มีไอเดียแล้ว? เล่าให้ผมฟัง", text: "เริ่มโปรเจกต์", href: "#contact" }}
      status={{ label: "เปิดรับงาน · ตอบภายใน 1 วันทำการ", href: "#contact" }}
      mark="since 2569"
      timeZone="Asia/Bangkok"
      timeLabel="BKK"
      columns={[
        {
          title: "ผลงาน",
          links: subsystems.slice(0, 3).map((s) => ({ label: s.name, href: `/go/${s.slug}` })),
          cta: { label: "work.", href: "#subsystems" },
        },
        {
          title: "ไปต่อ",
          links: [
            { label: "สถานะระบบ", href: "#status" },
            { label: "ทำงานยังไง", href: "#how" },
            { label: "ถามกันบ่อย", href: "#faq" },
            { label: "เล่น intro อีกครั้ง", href: "/?intro" },
          ],
          cta: { label: "talk.", href: "#contact" },
        },
      ]}
      chat={{ label: "ทักผม", href: "#contact" }}
      sideLinks={[
        { icon: "globe", label: "สถานะ", href: "#status" },
        { icon: "link", label: "GitHub", href: GITHUB },
      ]}
      copyright={`© ${String(year)} crocwork.studio`}
      credit={`ทำคนเดียว · ทดสอบ ${String(PGTAP_TESTS)} ข้อ`}
      handle={{ label: "@CROC101", href: "https://github.com/CROC101" }}
      labels={{
        top: "กลับขึ้นบนสุด",
        pin: "ดึงหมุด ฉีกขอบใหม่",
        copied: "คัดลอกแล้ว",
        copy: "คัดลอก",
      }}
    />
  );
}

/** The studio mascot (MeshGhost from @empire/ui): shader-filled ghost whose eyes follow the pointer. */
export function Sticker({ className = "" }: { className?: string }) {
  return <MeshGhost className={className} />;
}
