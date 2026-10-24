import { MeshGhost, Meteors, PhoneFrame } from "@empire/ui";
import { Cat, Code2, MessageCircle, Plane, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { appUrl } from "@/lib/apps";
import { CopyButton } from "./copy-button";
import { subsystems } from "@/lib/subsystems";

/*
 * Portfolio page sections, top to bottom. Layout rhythm: light → dark → light → dark,
 * each change cut with a torn-paper edge. Every number and status here is real: app status
 * comes from APP_URL_<SLUG>, counts from the repo.
 */

export const PGTAP_TESTS = 239;
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

/** Paper-cut landscape (layered hills under a moon) torn out as a backdrop for the phones. */
function PaperArt({ hue, seed }: { hue: number; seed: number }) {
  const layer = (n: number) =>
    `oklch(${String(0.86 - n * 0.09)} ${String(0.07 + n * 0.02)} ${String(hue + n * 8)})`;
  return (
    <div
      aria-hidden
      className="absolute inset-x-0 bottom-4 top-14 overflow-hidden"
      style={{ clipPath: tornPolygon(seed) }}
    >
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="size-full">
        <rect width="400" height="300" fill={layer(0)} />
        <circle cx="300" cy="90" r="44" fill="oklch(0.95 0.04 90)" opacity="0.85" />
        {[0, 1, 2, 3].map((n) => (
          <path
            key={n}
            d={`M0 ${String(150 + n * 38)} C 80 ${String(120 + n * 40)}, 150 ${String(190 + n * 30)}, 230 ${String(160 + n * 36)} S 360 ${String(130 + n * 40)}, 400 ${String(165 + n * 34)} V300 H0 Z`}
            fill={layer(n + 1)}
            style={{ filter: "drop-shadow(0 -2px 2px oklch(0 0 0 / 0.18))" }}
          />
        ))}
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
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
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
    hue: 300,
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
    hue: 245,
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
    hue: 30,
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

export function WorkSection() {
  const others = subsystems.filter((s) => !WORK.some((w) => w.slug === s.slug));
  const live = subsystems.filter((s) => appUrl(s.slug)).length;
  return (
    <section id="subsystems" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-24 sm:px-6">
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
    <section id="about" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-24 sm:px-6">
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
        <ul className="grid grid-cols-2 self-end border-l border-t">
          {FOCUS.map((f, n) => (
            <li key={f} className="border-b border-r p-5">
              <p className="font-mono text-xs cw-blue">0{n + 1}</p>
              <p className="mt-3 font-black">{f}</p>
            </li>
          ))}
        </ul>
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
    <section id="skills" className="mx-auto max-w-6xl scroll-mt-16 px-4 pb-24 sm:px-6">
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
  ],
  [
    "02",
    "AI ที่รันในเครื่อง",
    "ให้โมเดลทำงานในเบราว์เซอร์ผู้ใช้เลย ไม่ต้องจ่ายค่า GPU รายเดือน",
    ["ราคาเหมา"],
  ],
  [
    "03",
    "ระบบหลังบ้านและสิทธิ์",
    "ฐานข้อมูล ล็อกอินครั้งเดียวหลายระบบ กฎว่าใครเห็นอะไรพร้อมเทสต์",
    ["ราคาเหมา"],
  ],
  ["04", "ดูแลต่อหลังเปิดใช้", "แก้บั๊ก อัปเดตความปลอดภัย เพิ่มของเล็ก ๆ ทุกเดือน", ["รายเดือน"]],
] as const;

export function ServicesSection({ aside }: { aside: ReactNode }) {
  return (
    <section id="services" className="mx-auto max-w-6xl scroll-mt-16 px-4 pb-24 sm:px-6">
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

      <div className="mt-12 grid border-l border-t sm:grid-cols-2">
        {SERVICES.map(([n, title, body, tags]) => (
          <div key={n} className="flex flex-col gap-3 border-b border-r p-7">
            <p className="font-mono text-xs cw-blue">{n}</p>
            <h3 className="text-2xl font-black">{title}</h3>
            <p className="text-sm text-muted-foreground">{body}</p>
            <p className="mt-auto flex gap-2 pt-4 text-xs">
              {tags.map((t) => (
                <span key={t} className="border px-2 py-1">
                  {t}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

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
        <Plane
          aria-hidden
          className="vt-live cw-float absolute right-[12%] top-20 size-20 -rotate-12 text-[var(--em-blue-500)] opacity-80"
        />
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
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
          <ol className="mt-16 flex flex-col">
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
      <TornEdge color="var(--em-ink-975)" flip />
    </>
  );
}

/* ── team: one person and the robots ────────────────────────── */

const TEAM: { icon: typeof Code2; role: string; name: string; body: string }[] = [
  {
    icon: Code2,
    role: "founder · ทุกตำแหน่ง",
    name: "ผม",
    body: "PM, ออกแบบหน้าจอ, เขียนโค้ด, ฐานข้อมูล, ทดสอบ, ขึ้นระบบ คุยงานกับผม คือคุยกับคนที่ลงมือทำ",
  },
  {
    icon: Sparkles,
    role: "ผู้ช่วย",
    name: "AI ในทีม",
    body: "ช่วยร่างโค้ดกับเทสต์ ผมอ่านและตัดสินใจทุกบรรทัดเอง งานไหนใช้ AI ผมบอกตรง ๆ",
  },
  {
    icon: ShieldCheck,
    role: "ยาม",
    name: `${String(PGTAP_TESTS)} เทสต์`,
    body: "ยามหน้าประตูฐานข้อมูล ถ้ากฎสิทธิ์ข้อไหนพัง ระบบไม่ยอมให้ขึ้นจริง",
  },
  {
    icon: Cat,
    role: "มาสคอต",
    name: "แมว Community",
    body: "ไม่ได้ช่วยอะไรเลย แต่หน้าตาน่ารักเลยได้เป็นโลโก้",
  },
];

export function TeamSection() {
  return (
    <section id="team" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-24 sm:px-6">
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
        {TEAM.map(({ icon: Icon, role, name, body }) => (
          <li key={name} className="flex flex-col">
            <div className="grid aspect-[4/5] place-items-center bg-muted">
              <Icon aria-hidden className="size-16 cw-blue" strokeWidth={1.3} />
            </div>
            <p className="mt-4 font-mono text-[0.7rem] uppercase text-muted-foreground">{role}</p>
            <p className="text-lg font-black">{name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
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
      id="faq"
      className="mx-auto grid max-w-6xl scroll-mt-16 gap-12 px-4 pb-24 sm:px-6 lg:grid-cols-[1fr_2fr]"
    >
      <div>
        <p className={`${EYEBROW} cw-blue`}>faq</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">ถามกันบ่อย</h2>
        <MessageCircle aria-hidden className="mt-10 size-24 cw-blue opacity-70" strokeWidth={1.2} />
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
  const github = "https://github.com/CROC101/software-empire";
  return (
    <>
      <TornEdge color="var(--em-blue-600)" />
      <section
        id="contact"
        className={`${BLUE} relative scroll-mt-16 overflow-hidden`}
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(1 0 0 / 0.07) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.07) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      >
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:items-end">
          <div className="flex flex-col gap-6">
            <p className={`${EYEBROW} opacity-80`}>start a project</p>
            <h2 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-7xl">
              ยังไม่มีสเปก ก็ทักมาได้
            </h2>
            <p className="max-w-lg text-lg opacity-90">
              แค่อยากรู้ว่าไอเดียนี้ทำได้ไหม ทักมาได้ ไม่ต้องเตรียมสไลด์ เล่าคร่าว ๆ ว่าอยากได้อะไร
              ใช้เมื่อไร ผมจะตอบว่าควรเริ่มตรงไหนให้พอกับงบ
            </p>
            {email ? (
              <div className="flex flex-wrap items-end gap-4">
                <a
                  href={`mailto:${email}`}
                  className="break-all text-3xl font-black underline decoration-2 underline-offset-[10px] sm:text-5xl"
                >
                  {email}
                </a>
                <CopyButton text={email} />
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Link
                  href={cta.href}
                  className="bg-[var(--em-ink-0)] px-6 py-3.5 font-bold text-[var(--em-blue-700)]"
                >
                  {cta.label} →
                </Link>
                <a
                  href={github}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-current px-6 py-3.5 font-bold"
                >
                  GitHub ↗
                </a>
              </div>
            )}
          </div>
          <div className="relative">
            <Sticker className="absolute -top-56 right-6 w-44 rotate-6 sm:-top-64 sm:w-52" />
            <div className="relative border border-[var(--em-ink-0)]/20 bg-[oklch(0.25_0.12_265/0.85)] font-mono text-sm shadow-2xl">
              <p className="flex items-center gap-2 border-b border-[var(--em-ink-0)]/15 px-5 py-3 text-xs opacity-70">
                <span className="size-2.5 bg-[var(--em-ink-0)]/25" />
                <span className="size-2.5 bg-[var(--em-ink-0)]/25" />
                <span className="size-2.5 bg-[var(--em-ink-0)]/25" />
                <span className="ml-2">crocwork@studio ~</span>
              </p>
              <div className="flex flex-col gap-1.5 p-6">
                <p>
                  <span className="opacity-60">$</span> crocwork contact
                </p>
                {email && <p>อีเมล&nbsp; {email}</p>}
                <p>GitHub&nbsp; CROC101/software-empire</p>
                <p>ตอบ&nbsp;&nbsp;&nbsp; ภายใน 1 วันทำการ</p>
                <p>ภาษา&nbsp;&nbsp; ไทย / English</p>
                <p aria-hidden className="em-cursor mt-2 h-4 w-2.5 bg-[var(--em-ink-0)]" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className={`${DARK} relative overflow-hidden`}>
      <Meteors count={3} />
      <TornEdge color="var(--em-blue-600)" flip />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-48 pt-16 text-sm sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className={`${EYEBROW} text-[var(--em-blue-500)]`}>crocwork.studio</p>
          <p className="mt-3 text-[var(--em-ink-300)]">
            สตูดิโอซอฟต์แวร์คนเดียว ทำเว็บแอป AI และระบบหลังบ้าน แล้วดูแลต่อเป็นรายเดือน
          </p>
        </div>
        <FooterCol title="รับทำ" items={SERVICES.map(([, t]) => [t, "#services"])} />
        <FooterCol title="ผลงาน" items={subsystems.map((s) => [s.name, `/go/${s.slug}`])} />
        <FooterCol
          title="ไปต่อ"
          items={[
            ["สถานะระบบ", "#status"],
            ["ทำงานยังไง", "#how"],
            ["ถามกันบ่อย", "#faq"],
            ["เข้าสู่ระบบ", "/login"],
          ]}
        />
      </div>
      <p
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-6 select-none text-center text-[17vw] font-black leading-none tracking-tighter text-[var(--em-ink-0)]/[0.05]"
      >
        CROCWORK
      </p>
      <div className="relative mx-auto flex max-w-6xl justify-between border-t border-[var(--em-ink-800)] px-4 py-5 font-mono text-xs text-[var(--em-ink-400)] sm:px-6">
        <span>© {year} crocwork.studio</span>
        <span>ทำคนเดียว · ทดสอบ {PGTAP_TESTS} ข้อ</span>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: readonly (readonly [string, string])[];
}) {
  return (
    <div>
      <p className={`${EYEBROW} text-[var(--em-blue-500)]`}>{title}</p>
      <ul className="mt-3 flex flex-col gap-2 text-[var(--em-ink-300)]">
        {items.map(([label, href]) => (
          <li key={label}>
            <a href={href} className="hover:text-[var(--em-ink-0)]">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The studio mascot (MeshGhost from @empire/ui): shader-filled ghost whose eyes follow the pointer. */
export function Sticker({ className = "" }: { className?: string }) {
  return <MeshGhost className={className} />;
}
