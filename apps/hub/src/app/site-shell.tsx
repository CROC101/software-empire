import { AmbienceButton, AppLauncher, LiquidThemeToggle } from "@empire/ui";
import {
  ArrowUp,
  Blocks,
  BriefcaseBusiness,
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
  Terminal,
  User,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { parseChoice, THEME_COOKIE } from "@empire/core/theme";
import { getClaims } from "@/lib/supabase/server";
import { appUrl } from "@/lib/apps";
import { subsystems } from "@/lib/subsystems";
import { MobileMenu } from "./mobile-menu";
import { BackToTop } from "./nav-spy";
import { PAGES } from "@/lib/pages";
import { SiteNav } from "./site-nav";
import { SiteFooter, APP_ICON } from "./sections";

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
    { href: "/#status", label: "สถานะระบบ", icon: <Terminal />, keywords: "status live" },
    { href: "/about#about", label: "เกี่ยวกับผม", icon: <User />, keywords: "about" },
    {
      href: "/work#subsystems",
      label: "ผลงาน 8 ระบบ",
      icon: <Blocks />,
      keywords: "work portfolio",
    },
    {
      href: "/work#screens",
      label: "หน้าจอจริง",
      icon: <MonitorSmartphone />,
      keywords: "screens",
    },
    { href: "/work#laptop", label: "บนโน้ตบุ๊ก", icon: <Laptop />, keywords: "notebook desktop" },
    { href: "/work#pocket", label: "บนมือถือ", icon: <Smartphone />, keywords: "mobile phone" },
    { href: "/about#skills", label: "ของที่ใช้ทุกวัน", icon: <Cpu />, keywords: "skills stack" },
    {
      href: "/about#activity",
      label: "กิจกรรม GitHub",
      icon: <GitBranch />,
      keywords: "activity commit",
    },
    { href: "/work#codebase", label: "โค้ดใน repo", icon: <Hexagon />, keywords: "codebase lines" },
    {
      href: "/services",
      label: "รับทำอะไร",
      icon: <BriefcaseBusiness />,
      keywords: "services ราคา price",
    },
    {
      href: "/services#how",
      label: "ทำงานยังไง",
      icon: <ListChecks />,
      keywords: "process ขั้นตอน",
    },
    { href: "/about#team", label: "ทีม", icon: <Users />, keywords: "team" },
    { href: "/about#wardrobe", label: "7 บทบาท", icon: <Shirt />, keywords: "roles wardrobe" },
    {
      href: "/services#faq",
      label: "คำถามที่พบบ่อย",
      icon: <MessageCircleQuestion />,
      keywords: "faq ถาม",
    },
    {
      href: "/about#where",
      label: "ทำงานจากที่ไหน",
      icon: <Globe2 />,
      keywords: "where bangkok time เวลา",
    },
    { href: "/services#contact", label: "ติดต่อ", icon: <Mail />, keywords: "contact email อีเมล" },
  ],
  links: [
    { href: "/services#contact", label: "คุยงานกับผม", icon: <Mail />, keywords: "hire จ้าง" },
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

/** Signed-in visitors get the dashboard, everyone else the sign-in. */
export async function headerCta() {
  return (await getClaims())
    ? { href: "/dashboard", label: "แดชบอร์ด" }
    : { href: "/login", label: "เข้าสู่ระบบ" };
}

/** Header, footer and back-to-top shared by the four pages. */
export async function SiteShell({ children }: { children: ReactNode }) {
  // the theme from the cookie, so the water menu and switch render in it from the first paint
  // ("system" can't be known on the server: those start light and settle after hydration)
  const choice = parseChoice((await cookies()).get(THEME_COOKIE)?.value);
  const theme = choice === "system" ? undefined : choice;
  const cta = await headerCta();
  const items = PAGES.map(({ href, label }) => ({ href, label }));

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-background">
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
            <MobileMenu items={items} cta={cta} initialTheme={theme} />
          </div>
        </div>
      </header>

      <main>{children}</main>
      <BackToTop />
      <SiteFooter />
    </div>
  );
}
