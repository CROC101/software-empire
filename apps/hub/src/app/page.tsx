import {
  AmbienceButton,
  AppLauncher,
  BuildTour,
  GridPulse,
  CrocReveal,
  TideReveal,
  LiquidThemeToggle,
  MarqueeHero,
  CountUp,
  SubsystemLogo,
} from "@empire/ui";
import {
  ArrowUp,
  Blocks,
  BriefcaseBusiness,
  Clock3,
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
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { appUrl } from "@/lib/apps";
import { subsystems } from "@/lib/subsystems";
import { getContent, HUB_HOME, HUB_SUBSYSTEMS } from "@/lib/cms";
import { MobileMenu } from "./mobile-menu";
import { BackToTop } from "./nav-spy";
import { DepthSection } from "./depth-section";
import { TourButton } from "./tour-button";
import { Stage } from "./stage";
import { ActivitySkyline } from "./activity-skyline";
import { RhythmRing } from "./rhythm-ring";
import { WhereSection } from "./where-section";
import { CodebaseHexes } from "./codebase-hexes";
import { PocketSection } from "./pocket-section";
import { SignOff } from "./sign-off";
import { SiteNav } from "./site-nav";
import { Wardrobe } from "./wardrobe";
import { HiddenWork } from "./hidden-work";
import { LensSection } from "./lens-section";
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
} from "./sections";
import { StackCard } from "./stack-card";
import { HeroTitle } from "./hero-title";
import { EdgeNav } from "./edge-nav";

// desktop screenshots are 2880 × 1800, so the 16:10 cards stay sharp on 2x screens
const HERO_SHOTS = ["hub", "community", "tarot", "canva", "design", "toolboxes"].map((slug) => ({
  src: `/previews/${slug}.webp`,
  alt: slug,
}));

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
    return {
      slug: s.slug,
      name: s.name,
      href: `/go/${s.slug}`,
      icon: <SubsystemLogo base={`/logos/${s.slug}`} />,
      accent: s.accent,
      soon: !appUrl(s.slug),
    };
  }),
};

export default async function HomePage() {
  // No cookies or session here: the page is built once at deploy and served as a file, because
  // rendering it per visit costs more CPU than the Workers Free plan allows (error 1102).
  // The theme switch settles after hydration; /login sends people already signed in to /dashboard.
  const cta = { href: "/login?next=/dashboard", label: "เข้าสู่ระบบ" };
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
    lens: <LensSection />,
    depth: <DepthSection />,
    croc: (
      <CrocReveal
        word="CROCWORK"
        tagline="สตูดิโอนี้มีจระเข้ตัวเดียว"
        hint="เลื่อนลง"
        stickyTop="4rem"
        height="calc(100svh - 4rem)"
        scrollDistance="70svh"
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
    contact: <ContactSection cta={cta} />,
    "sign-off": <SignOff />,
  };

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-background">
      <BuildTour skipLabel="ข้ามการสร้าง" />
      <span id="top" aria-hidden className="absolute top-0 h-px w-px" />
      <header data-tour-root className="vt-top sticky top-0 z-40 border-b bg-background/95">
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
              <SiteNav launcher={LAUNCHER} />
            </span>
            <span className="hidden items-center gap-2 lg:flex">
              <AmbienceButton cookieDomain={process.env.NEXT_PUBLIC_COOKIE_DOMAIN} />
              <LiquidThemeToggle cookieDomain={process.env.NEXT_PUBLIC_COOKIE_DOMAIN} />
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
            <MobileMenu items={NAV} cta={cta} />
          </div>
        </div>
      </header>

      <main data-tour-root>
        {/* no WebGL here (StormHero lagged on phones): words rise, real screens slide along the
            bottom; StormHero and CloudHero stay in the design registry */}
        <MarqueeHero
          className="-mt-16"
          eyebrow={
            <>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-widest">
                crocwork studio
              </span>
              {/* Thai is never letter-spaced or set in mono */}
              <span>{home.text("hero.chip")}</span>
            </>
          }
          lines={[home.text("hero.line1"), home.text("hero.line2")]}
          title={<HeroTitle lines={[home.text("hero.line1"), home.text("hero.line2")]} />}
          background={<GridPulse className="vt-live" />}
          lead={home.text("hero.promise")}
          shots={HERO_SHOTS}
        >
          <a
            href="#subsystems"
            className="cw-btn-blue cw-btn-water inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5"
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
            className="cw-glass inline-flex items-center rounded-xl border px-5 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5"
          >
            ลองเล่นดู
          </Link>
          <TourButton />
          <dl className="mt-4 flex basis-full justify-center gap-8 text-sm text-muted-foreground">
            {(
              [
                [subsystems.filter((x) => appUrl(x.slug)).length, "ระบบเปิดใช้แล้ว"],
                [subsystems.length, "ระบบในพอร์ตนี้"],
                [PGTAP_TESTS, "เทสต์ฐานข้อมูล"],
              ] as const
            ).map(([n, label]) => (
              <div key={label} className="flex flex-col-reverse items-center">
                <dt>{label}</dt>
                <dd className="font-heading text-2xl font-black text-foreground tabular-nums">
                  <CountUp to={n} />
                </dd>
              </div>
            ))}
          </dl>
        </MarqueeHero>

        {home
          .sections()
          .filter((x) => x.visible)
          .map((x) => (
            <Stage key={x.key}>{SECTIONS[x.key]}</Stage>
          ))}
      </main>
      <TideReveal />
      <EdgeNav
        items={LAUNCHER.sections
          .filter((x) => x.href.startsWith("#") && x.href !== "#top")
          .map((x) => ({ label: x.label, href: x.href }))}
      />
      <BackToTop />
      <div data-tour-root>
        <SiteFooter />
      </div>
    </div>
  );
}
