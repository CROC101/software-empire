import {
  AmbienceButton,
  AppLauncher,
  CrocReveal,
  TideReveal,
  LinkPreview,
  MorphingText,
  PhoneFrame,
  LiquidThemeToggle,
} from "@empire/ui";
import {
  ArrowUp,
  Blocks,
  BriefcaseBusiness,
  Code2,
  Cpu,
  GitBranch,
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
import Image from "next/image";
import Link from "next/link";
import { getClaims } from "@/lib/supabase/server";
import { appUrl } from "@/lib/apps";
import { subsystems } from "@/lib/subsystems";
import { CountUp } from "./count-up";
import { MobileMenu } from "./mobile-menu";
import { BackToTop } from "./nav-spy";
import { DepthSection } from "./depth-section";
import { IntroGate } from "./intro-gate";
import { ActivitySkyline } from "./activity-skyline";
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
  const cta = claims
    ? { href: "/dashboard", label: "แดชบอร์ด" }
    : { href: "/login", label: "เข้าสู่ระบบ" };

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

      <main>
        <section className="relative isolate mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          {/* soft aurora behind the hero, in the menu's water colours */}
          <div aria-hidden className="hero-aurora pointer-events-none absolute inset-0 -z-10" />
          <div className="flex flex-col items-start gap-6">
            {/* glass chip, the same material as the water menu */}
            <p className="cw-glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest">
              <span className="st-live" aria-hidden />
              <span className="cw-blue font-semibold">crocwork studio</span>
              <span className="text-muted-foreground">ซอฟต์แวร์ · AI · ระบบหลังบ้าน</span>
            </p>
            <h1 className="pk-depth font-sans text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl">
              ระบบที่ผมสร้าง
              <br />
              ทำงานได้จริง
              <br />
              <span className="relative inline-block">
                <span className="pk-depth-blue">
                  ครบ <CountUp to={subsystems.length} /> ระบบ
                </span>
                <Scribble className="absolute -bottom-3 left-0 w-full cw-blue" />
              </span>
            </h1>
            {/* Enterprise ของคนเดียว: ทุกตำแหน่งในทีม คือคนคนเดียวกัน */}
            <div className="cw-glass flex w-full max-w-lg items-center gap-3 rounded-2xl px-4 py-3 text-2xl font-black leading-none sm:text-3xl">
              <span className="shrink-0">ทีมของผม =</span>
              <MorphingText
                texts={ROLES}
                className="vt-live mx-0 h-10 max-w-none text-left text-2xl cw-blue sm:h-12 md:h-12 sm:text-3xl lg:text-3xl"
              />
            </div>
            <p className="max-w-lg text-muted-foreground">
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
            <div className="flex flex-wrap gap-3">
              <a
                href="#subsystems"
                className="cw-btn-blue inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-[0_14px_30px_-12px_color-mix(in_oklab,var(--em-blue-600)_70%,transparent)] transition-transform hover:-translate-y-0.5"
              >
                ดูผลงาน <span aria-hidden>↓</span>
              </a>
              <Link
                href={cta.href}
                className="cw-glass inline-flex items-center rounded-xl px-5 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5"
              >
                {claims ? "เปิดแดชบอร์ด" : "ลองเล่นดู"}
              </Link>
            </div>
            {/* true numbers only */}
            <ul className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
              {[
                `${String(subsystems.filter((x) => appUrl(x.slug)).length)} ระบบเปิดใช้แล้ว`,
                `${String(PGTAP_TESTS)} เทสต์ฐานข้อมูล`,
                "ล็อกอินครั้งเดียว ใช้ได้ทุกระบบ",
              ].map((t) => (
                <li key={t} className="cw-glass rounded-full px-3 py-1">
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <HeroVisual />
        </section>

        <StatusSection />
        <DepthSection />
        <CrocReveal
          word="CROCWORK"
          tagline="สตูดิโอนี้มีจระเข้ตัวเดียว"
          hint="เลื่อนลง"
          stickyTop="4rem"
          height="calc(100svh - 4rem)"
          label="โปสเตอร์ CROCWORK ถูกฉีกออก จระเข้โผล่ขึ้นจากน้ำแล้วลืมตามอง"
        />
        <AboutSection />
        <WorkReel />
        <WorkSection />
        <WorkTunnel />
        <ShotsSection />
        <LaptopSection />
        <PocketSection />
        <HiddenWork />
        <SkillsSection />
        <ActivitySkyline />
        <CodebaseHexes />
        <ServicesSection aside={<StackCard href="#subsystems" />} />
        <HowSection />
        <TeamSection />
        <Wardrobe />
        <FaqSection />
        <CrocPoster />
        <ContactSection cta={cta} />
        <SignOff />
      </main>
      <TideReveal />
      <BackToTop />
      <SiteFooter />
    </div>
  );
}

/** Dark globe + three phones showing our own apps, drawn in CSS — no screenshots to go stale. */
function HeroVisual() {
  return (
    <div
      aria-hidden
      className="vt-live relative mx-auto aspect-square w-full max-w-[28rem] lg:max-w-[34rem]"
    >
      <div className="cw-globe cw-spin absolute inset-[6%] rounded-full" />

      <Phone
        className="left-[2%] top-[26%] -rotate-12"
        tone="var(--em-sky-500)"
        title="Empire Canvas"
      >
        <div className="grid grid-cols-2 gap-1.5">
          {[
            "var(--em-violet-300)",
            "var(--em-blue-500)",
            "var(--em-violet-500)",
            "var(--em-blue-700)",
          ].map((c) => (
            <div key={c} className="aspect-square rounded-md" style={{ background: c }} />
          ))}
        </div>
      </Phone>
      <Phone
        className="right-[2%] top-[24%] rotate-12"
        tone="var(--em-violet-600)"
        title="Community"
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="size-4 rounded-full" style={{ background: "var(--em-violet-300)" }} />
            <div className="h-1.5 flex-1 rounded bg-white/25" />
          </div>
        ))}
        <div
          className="mt-1 aspect-[4/3] rounded-md"
          style={{
            background: "linear-gradient(135deg, var(--em-violet-400), var(--em-fuchsia-400))",
          }}
        />
      </Phone>
      <Phone
        className="cw-float left-1/2 top-[12%] z-10 -translate-x-1/2 scale-105"
        tone="var(--em-blue-600)"
        title="AI Tarot"
      >
        <div
          className="mx-auto mt-1 grid aspect-[2/3] w-3/4 place-items-center rounded-lg border text-2xl"
          style={{ borderColor: "var(--em-gold-300)", color: "var(--em-gold-300)" }}
        >
          ☾
        </div>
        <div
          className="mx-auto mt-2 h-5 w-4/5 rounded-full"
          style={{ background: "var(--em-gold-300)" }}
        />
      </Phone>

      <div className="absolute right-0 top-[6%] z-20 border bg-card px-3 py-2 shadow-lg">
        <p className="flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-wider text-success">
          <span className="size-1.5 bg-success" /> live · {subsystems.length} ระบบ
        </p>
        <p className="text-lg font-black">1 บัญชี</p>
        <p className="text-xs text-muted-foreground">ใช้ได้ทุกระบบ</p>
      </div>
      <div className="absolute bottom-[10%] left-0 z-20 border bg-card px-3 py-2 shadow-lg">
        <p className="font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground">
          supabase · rls
        </p>
        <p className="text-lg font-black">{PGTAP_TESTS} เทสต์</p>
        <p className="text-xs text-muted-foreground">ผ่านทุกข้อ</p>
      </div>
    </div>
  );
}

function Phone({
  className,
  tone,
  title,
  children,
}: {
  className: string;
  tone: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`absolute w-[31%] ${className}`}>
      <PhoneFrame statusBar="overlay" className="w-full sm:w-full md:w-full">
        <div
          className="flex size-full flex-col gap-1.5 p-3 pt-[18%] text-[0.6rem] text-white"
          style={{ background: `linear-gradient(170deg, ${tone}, var(--em-ink-950))` }}
        >
          <p className="font-bold">{title}</p>
          {children}
        </div>
      </PhoneFrame>
    </div>
  );
}

/** Pen underline: one uneven stroke so it reads as drawn by hand, not a CSS border. */
function Scribble({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 300 14" preserveAspectRatio="none" className={className}>
      <path
        d="M3 9 C 40 4, 80 12, 120 7 S 200 3, 240 8 S 285 6, 297 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        className="cw-draw"
      />
    </svg>
  );
}
