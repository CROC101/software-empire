import {
  AmbienceButton,
  AppLauncher,
  CrocReveal,
  TideReveal,
  LinkPreview,
  RotatingText,
  ShinyText,
  LiquidThemeToggle,
  SeasonTree,
} from "@empire/ui";
import {
  ArrowUp,
  Blocks,
  BriefcaseBusiness,
  Clock3,
  Code2,
  Cpu,
  GitBranch,
  Globe2,
  Hexagon,
  Laptop,
  ListChecks,
  LogIn,
  Mail,
  MessageCircleQuestion,
  MonitorSmartphone,
  Shirt,
  Smartphone,
  Sparkles,
  Terminal,
  User,
  Users,
} from "lucide-react";
import { Fragment, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { parseChoice, THEME_COOKIE } from "@empire/core/theme";
import { getClaims } from "@/lib/supabase/server";
import { appUrl } from "@/lib/apps";
import { subsystems } from "@/lib/subsystems";
import { getContent, HUB_HOME, HUB_SUBSYSTEMS } from "@/lib/cms";
import { CountUp } from "./count-up";
import { MobileMenu } from "./mobile-menu";
import { BackToTop } from "./nav-spy";
import { DepthSection } from "./depth-section";
import { IntroGate } from "./intro-gate";
import { ActivitySkyline } from "./activity-skyline";
import { RhythmRing } from "./rhythm-ring";
import { WhereSection } from "./where-section";
import { CodebaseHexes } from "./codebase-hexes";
import { PocketSection } from "./pocket-section";
import { SignOff } from "./sign-off";
import { SiteNav } from "./site-nav";
import { Wardrobe } from "./wardrobe";
import { HiddenWork } from "./hidden-work";
import { CrocPoster } from "./croc-poster";
import {
  AboutSection,
  ContactSection,
  FaqSection,
  HowSection,
  LaptopSection,
  PGTAP_TESTS,
  ServicesSection,
  ShotsSection,
  SiteFooter,
  SkillsSection,
  StatusSection,
  TeamSection,
  WorkReel,
  WorkSection,
  WorkTunnel,
  APP_ICON,
} from "./sections";
import { StackCard } from "./stack-card";
import { EdgeNav } from "./edge-nav";
import { NightRays } from "./night-rays";

// the hero tree's fruit: the systems themselves, each a link that opens it
const TREE_FRUITS = subsystems.map((x) => ({ id: x.slug, label: x.name, href: `/go/${x.slug}` }));

const ROLES = [
  "Product Manager",
  "Tech Lead",
  "AI Engineer",
  "UX Designer",
  "DBA",
  "DevOps",
  "QA",
  "คนเดียวทั้งหมด",
];

const NAV = [
  { href: "#about", label: "เกี่ยวกับ" },
  { href: "#subsystems", label: "ผลงาน" },
  { href: "#services", label: "รับทำอะไร" },
  { href: "#how", label: "ทำงานยังไง" },
  { href: "#faq", label: "คำถาม" },
];

// the nine-dot grid: every subsystem, open ones link through /go, the rest show as coming soon
const LAUNCHER = {
  label: "ทางลัด",
  soonLabel: "เร็ว ๆ นี้",
  labels: {
    search: "ค้นหาส่วน ระบบ หรือลิงก์…",
    sections: "ไปที่ส่วน",
    apps: "ระบบทั้งหมด",
    links: "ลิงก์",
    empty: "ไม่เจอที่ค้นหา",
    now: "ตอนนี้อยู่ที่",
  },
  // every part of the portfolio, in page order; keywords catch the words people type
  sections: [
    { href: "#status", label: "สถานะระบบ", icon: <Terminal />, keywords: "status live" },
    { href: "#about", label: "เกี่ยวกับผม", icon: <User />, keywords: "about" },
    { href: "#subsystems", label: "ผลงาน 8 ระบบ", icon: <Blocks />, keywords: "work portfolio" },
    { href: "#fly", label: "บินเข้าไปในงาน", icon: <Sparkles />, keywords: "tunnel" },
    { href: "#screens", label: "หน้าจอจริง", icon: <MonitorSmartphone />, keywords: "screens" },
    { href: "#laptop", label: "บนโน้ตบุ๊ก", icon: <Laptop />, keywords: "notebook desktop" },
    { href: "#pocket", label: "บนมือถือ", icon: <Smartphone />, keywords: "mobile phone" },
    { href: "#skills", label: "ของที่ใช้ทุกวัน", icon: <Cpu />, keywords: "skills stack" },
    {
      href: "#activity",
      label: "กิจกรรม GitHub",
      icon: <GitBranch />,
      keywords: "activity commit",
    },
    {
      href: "#rhythm",
      label: "ช่วงเวลาที่ทำงาน",
      icon: <Clock3 />,
      keywords: "rhythm time commit",
    },
    { href: "#codebase", label: "โค้ดใน repo", icon: <Hexagon />, keywords: "codebase lines" },
    {
      href: "#services",
      label: "รับทำอะไร",
      icon: <BriefcaseBusiness />,
      keywords: "services ราคา price",
    },
    { href: "#how", label: "ทำงานยังไง", icon: <ListChecks />, keywords: "process ขั้นตอน" },
    { href: "#team", label: "ทีม", icon: <Users />, keywords: "team" },
    { href: "#wardrobe", label: "7 บทบาท", icon: <Shirt />, keywords: "roles wardrobe" },
    { href: "#faq", label: "คำถามที่พบบ่อย", icon: <MessageCircleQuestion />, keywords: "faq ถาม" },
    {
      href: "#where",
      label: "ทำงานจากที่ไหน",
      icon: <Globe2 />,
      keywords: "where bangkok time เวลา",
    },
    { href: "#contact", label: "ติดต่อ", icon: <Mail />, keywords: "contact email อีเมล" },
  ],
  links: [
    { href: "#contact", label: "คุยงานกับผม", icon: <Mail />, keywords: "hire จ้าง" },
    {
      href: "https://github.com/CROC101/software-empire",
      label: "ซอร์สโค้ดบน GitHub",
      icon: <GitBranch />,
      keywords: "source code repo",
    },
    { href: "/login", label: "เข้าสู่ระบบ", icon: <LogIn />, keywords: "login sign in" },
    { href: "#top", label: "กลับขึ้นบนสุด", icon: <ArrowUp />, keywords: "top" },
  ],
  apps: subsystems.map((s) => {
    const Icon = APP_ICON[s.slug] ?? Code2;
    return {
      slug: s.slug,
      name: s.name,
      href: `/go/${s.slug}`,
      icon: <Icon aria-hidden />,
      accent: s.accent,
      soon: !appUrl(s.slug),
    };
  }),
};

export default async function HomePage() {
  const claims = await getClaims();
  // the theme from the cookie, so the water menu and switch render in it from the first paint
  // ("system" can't be known on the server: those start light and settle after hydration)
  const choice = parseChoice((await cookies()).get(THEME_COOKIE)?.value);
  const theme = choice === "system" ? undefined : choice;
  const cta = claims
    ? { href: "/dashboard", label: "แดชบอร์ด" }
    : { href: "/login", label: "เข้าสู่ระบบ" };
  // text, numbers and section order the owner edits at /admin (defaults when the DB is down)
  const [home, cards] = await Promise.all([getContent(HUB_HOME), getContent(HUB_SUBSYSTEMS)]);
  const summaries = Object.fromEntries(
    subsystems.map((x) => [x.slug, cards.text(`${x.slug}.summary`)]),
  );
  const SECTIONS: Record<string, ReactNode> = {
    status: (
      <StatusSection
        title1={home.text("status.title1")}
        title2={home.text("status.title2")}
        intro={home.text("status.intro")}
        rounds={home.number("status.rounds")}
      />
    ),
    depth: <DepthSection />,
    croc: (
      <CrocReveal
        word="CROCWORK"
        tagline="สตูดิโอนี้มีจระเข้ตัวเดียว"
        hint="เลื่อนลง"
        stickyTop="4rem"
        height="calc(100svh - 4rem)"
        label="โปสเตอร์ CROCWORK ถูกฉีกออก จระเข้โผล่ขึ้นจากน้ำแล้วลืมตามอง"
      />
    ),
    about: <AboutSection />,
    "work-reel": <WorkReel />,
    work: <WorkSection summaries={summaries} />,
    "work-tunnel": <WorkTunnel />,
    shots: <ShotsSection summaries={summaries} />,
    laptop: <LaptopSection />,
    pocket: <PocketSection />,
    "hidden-work": <HiddenWork />,
    skills: <SkillsSection />,
    activity: <ActivitySkyline />,
    rhythm: <RhythmRing />,
    codebase: <CodebaseHexes />,
    services: <ServicesSection aside={<StackCard href="#subsystems" />} />,
    how: <HowSection />,
    team: <TeamSection />,
    wardrobe: <Wardrobe />,
    faq: <FaqSection />,
    where: <WhereSection />,
    "croc-poster": <CrocPoster />,
    contact: <ContactSection cta={cta} />,
    "sign-off": <SignOff />,
  };

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-background">
      <IntroGate />
      <span id="top" aria-hidden className="absolute top-0 h-px w-px" />
      <header className="vt-top sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-heading text-lg font-extrabold">
            <Image
              src="/crocwork-logo.webp"
              alt=""
              width={28}
              height={32}
              priority
              style={{ width: "auto" }}
              className="h-8 w-auto drop-shadow-[0_2px_6px_color-mix(in_oklab,var(--em-blue-500)_35%,transparent)]"
            />
            crocwork.studio
          </Link>
          <div className="flex items-center gap-1 sm:gap-4">
            {/* the water pill; its own CSS sets display, so the breakpoint lives on a wrapper */}
            <span className="site-nav hidden lg:block">
              <SiteNav launcher={LAUNCHER} initialTheme={theme} />
            </span>
            <span className="hidden items-center gap-2 lg:flex">
              <AmbienceButton cookieDomain={process.env.NEXT_PUBLIC_COOKIE_DOMAIN} />
              <LiquidThemeToggle
                cookieDomain={process.env.NEXT_PUBLIC_COOKIE_DOMAIN}
                initial={theme}
              />
            </span>
            <Link
              href={cta.href}
              className="cw-btn-blue hidden items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-bold sm:inline-flex"
            >
              {cta.label} <span aria-hidden>→</span>
            </Link>
            {/* the launcher lives in the capsule on desktop; here it stands alone */}
            <span className="lg:hidden">
              <AppLauncher {...LAUNCHER} />
            </span>
            <MobileMenu items={NAV} cta={cta} initialTheme={theme} />
          </div>
        </div>
      </header>

      <main>
        {/* phone: chip, headline, the scene, the buttons first; the rest below the fold (the text
            column dissolves into the grid below lg so its children can interleave with the tree) */}
        <section className="relative isolate mx-auto grid max-w-6xl items-center gap-6 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:pt-16">
          <NightRays />
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
            {/* Enterprise ของคนเดียว: ทุกตำแหน่งในทีม คือคนคนเดียวกัน */}
            <div className="cw-glass relative order-5 flex w-full max-w-lg items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-2xl font-black leading-none sm:text-3xl lg:order-none">
              {/* a small tank: water laps at its foot */}
              <span className="cw-water" aria-hidden style={{ height: "1.1rem" }}>
                <span />
                <span />
              </span>
              <span className="relative shrink-0">ทีมของผม =</span>
              {/* each role rises out of the water line, letter by letter; never blank between */}
              <RotatingText
                texts={ROLES}
                effect="slide"
                staggerDuration={0.018}
                staggerFrom="first"
                rotationInterval={2400}
                splitLevelClassName="overflow-hidden pb-1"
                className="vt-live relative min-w-0 flex-nowrap whitespace-nowrap cw-blue"
              />
            </div>
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
                href="#subsystems"
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

        {home
          .sections()
          .filter((x) => x.visible)
          .map((x) => (
            <Fragment key={x.key}>{SECTIONS[x.key]}</Fragment>
          ))}
      </main>
      <TideReveal />
      <EdgeNav
        items={LAUNCHER.sections
          .filter((x) => x.href.startsWith("#") && x.href !== "#top")
          .map((x) => ({ label: x.label, href: x.href }))}
      />
      <BackToTop />
      <SiteFooter />
    </div>
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
