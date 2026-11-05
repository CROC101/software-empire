import { LinkPreview, SeasonTree, ShinyText } from "@empire/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { getClaims } from "@/lib/supabase/server";
import { appUrl } from "@/lib/apps";
import { subsystems } from "@/lib/subsystems";
import { getContent, HUB_HOME } from "@/lib/cms";
import { CountUp } from "./count-up";
import { IntroGate } from "./intro-gate";
import { PageSections } from "./page-sections";
import { PGTAP_TESTS } from "./sections";
import { SiteShell } from "./site-shell";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// the hero tree's fruit: the systems themselves, each a link that opens it
const TREE_FRUITS = subsystems.map((x) => ({ id: x.slug, label: x.name, href: `/go/${x.slug}` }));

/** Home: the hero (its one effect is the seasonal tree), status, featured work, contact. */
export default async function HomePage() {
  const [claims, home] = await Promise.all([getClaims(), getContent(HUB_HOME)]);
  const cta = claims
    ? { href: "/dashboard", label: "แดชบอร์ด" }
    : { href: "/login", label: "เข้าสู่ระบบ" };

  return (
    <SiteShell>
      <IntroGate />
      {/* phone: chip, headline, the scene, the buttons first; the rest below the fold (the text
            column dissolves into the grid below lg so its children can interleave with the tree) */}
      <section className="relative isolate mx-auto grid max-w-6xl items-center gap-6 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:pt-16">
        <div className="max-lg:contents lg:flex lg:flex-col lg:items-start lg:gap-6">
          {/* glass chip, the same material as the water menu */}
          <p className="cw-glass order-1 inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-xs lg:order-none">
            <span className="st-live" aria-hidden />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-widest">
              {/* a glint runs along the name now and then, like light on water */}
              <ShinyText
                color="var(--em-blue-500)"
                shineColor="var(--em-ink-0)"
                speed={2.4}
                delay={3}
              >
                crocwork studio
              </ShinyText>
            </span>
            {/* Thai is never letter-spaced or set in mono: the letters come apart */}
            <span className="text-muted-foreground">{home.text("hero.chip")}</span>
          </p>
          <h1 className="pk-depth order-2 font-sans text-5xl lg:order-none font-black leading-[1.05] sm:text-7xl">
            {home.text("hero.line1")}
            <br />
            {home.text("hero.line2")}
            <br />
            <span className="relative inline-block">
              <span
                className="pk-depth-blue cw-water-text"
                data-text={`ครบ ${String(subsystems.length)} ระบบ`}
              >
                ครบ <CountUp to={subsystems.length} /> ระบบ
              </span>
              <Scribble className="absolute -bottom-3 left-0 w-full cw-blue" />
            </span>
          </h1>
          <p className="order-6 max-w-lg text-muted-foreground lg:order-none">
            ผมทำเองคนเดียวทุกขั้น ตั้งแต่วาดหน้าจอยันเขียนฐานข้อมูล มีโซเชียลแบบ{" "}
            <LinkPreview
              href="/go/community"
              imageSrc="/previews/community.webp"
              className="cw-blue"
            >
              Community
            </LinkPreview>
            , เครื่องมือ 121 ชิ้นใน{" "}
            <LinkPreview
              href="/go/toolboxes"
              imageSrc="/previews/toolboxes.webp"
              className="cw-blue"
            >
              Toolboxes
            </LinkPreview>{" "}
            และโปรแกรมกราฟิก{" "}
            <LinkPreview href="/go/canva" imageSrc="/previews/canva.webp" className="cw-blue">
              Empire Canvas
            </LinkPreview>{" "}
            ทั้งหมดใช้บัญชีเดียวกัน สิทธิ์ใครเห็นอะไรเขียนไว้ในฐานข้อมูล แล้วเขียนเทสต์ดักไว้{" "}
            <CountUp to={PGTAP_TESTS} /> ข้อ เพราะเคยพลาดมาแล้ว
          </p>
          <div className="order-4 flex flex-wrap gap-3 lg:order-none">
            <a
              href="/work"
              className="cw-btn-blue cw-btn-water inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-[0_14px_30px_-12px_color-mix(in_oklab,var(--em-blue-600)_70%,transparent)] transition-transform hover:-translate-y-0.5"
            >
              {/* water rises inside on hover */}
              <span className="cw-water" aria-hidden>
                <span />
                <span />
              </span>
              {home.text("hero.cta")} <span aria-hidden>↓</span>
            </a>
            <Link
              href={cta.href}
              className="cw-glass inline-flex items-center rounded-xl px-5 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5"
            >
              {claims ? "เปิดแดชบอร์ด" : "ลองเล่นดู"}
            </Link>
          </div>
          {/* true numbers only */}
          <ul className="order-7 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground lg:order-none">
            {[
              `${String(subsystems.filter((x) => appUrl(x.slug)).length)} ระบบเปิดใช้แล้ว`,
              `${String(PGTAP_TESTS)} เทสต์ฐานข้อมูล`,
              home.text("hero.promise"),
            ].map((t) => (
              <li key={t} className="cw-glass rounded-full px-3 py-1">
                {t}
              </li>
            ))}
          </ul>
        </div>

        <SeasonTree
          fruits={TREE_FRUITS}
          className="order-3 max-lg:-mx-4 max-lg:w-[calc(100%+2rem)] lg:order-none lg:-mr-16 lg:w-[calc(100%+4rem)]"
          sceneClassName="h-[46svh] min-h-[19rem] lg:h-[min(42rem,calc(100svh-9rem))]"
        />
      </section>

      <PageSections page="home" />
    </SiteShell>
  );
}

/** Pen underline: one uneven stroke so it reads as drawn by hand, not a CSS border. */
function Scribble({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 300 14" preserveAspectRatio="none" className={className}>
      <path
        d="M3 8 Q 40.5 2, 78 8 T 153 8 T 228 8 T 297 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        className="cw-draw"
      />
    </svg>
  );
}
