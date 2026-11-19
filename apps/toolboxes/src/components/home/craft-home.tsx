import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Download,
  GitBranch,
  Globe,
  HardDrive,
  Heart,
  LayoutGrid,
  MessagesSquare,
  Scale,
  Wrench,
} from "lucide-react";
import { Link } from "react-router";
import type { Lang } from "@empire/core/lang";
import { contacts } from "@empire/core/subsystems";
import { OrbitGallery, TideReveal } from "@empire/ui";
import { CraftLineup } from "@/components/apps/craft-lineup";
import { BlurText } from "@/components/home/blur-text";
import { CraftTile } from "@/components/apps/craft-tile";
import { CopyButton } from "@/components/tools/tool-output";
import apps from "@/lib/apps.json";
import { CRAFT_APPS, LAUNCHER } from "@/lib/craft-apps";
import { TOOLS } from "@/lib/tools/registry";

const GITHUB = "https://github.com/CROC101";
const DISCORD = contacts.find((c) => c.label === "Discord")?.href ?? GITHUB;

const COPY = {
  launcher: { th: "ดาวน์โหลด Launcher", en: "Download launcher" },
  explore: { th: "ดูแอปทั้งหมด", en: "Explore the apps" },
  launcherNote: {
    th: "ตัวเดียวติดตั้งและอัปเดตแอปของ crocwork ได้ทุกตัว",
    en: "One app installs and updates every crocwork app.",
  },
  github: { th: "ซอร์สอยู่บน GitHub", en: "Source on GitHub" },
  appsTitle: { th: "แอปของ crocwork", en: "crocwork apps," },
  appsCount: { th: `${CRAFT_APPS.length} ตัว`, en: `${CRAFT_APPS.length} of them` },
  appsLead: {
    th: "แต่งรูป เขียนเอกสาร ทำสไลด์ วาดเวกเตอร์ ออกแบบ 3D ตัดต่อวิดีโอ ทำเพลง ทุกตัวเปิดในเว็บได้ทันที หรือติดตั้งลง Windows ก็ได้",
    en: "Photos, documents, slides, vectors, 3D, video and music. Open each one on the web right now, or install it on Windows.",
  },
  discord: { th: "เข้า Discord", en: "Join the Discord" },
  share: { th: "คัดลอกลิงก์หน้านี้", en: "Copy this page's link" },
  lineupTitle: { th: "เลือกแอปที่ใช่", en: "Pick the app" },
  lineupBlue: { th: "แล้วเริ่มได้เลย", en: "and start now" },
  principlesTitle: { th: "ทำแบบที่เราอยากใช้เอง", en: "Built the way we'd want it" },
  principlesLead: {
    th: "ไม่มีโฆษณา ไม่ขายข้อมูล ไม่ต้องสมัครก่อนใช้ หกข้อนี้คือสิ่งที่เรายึดทุกครั้งที่ปล่อยแอป",
    en: "No ads, no data sold, no sign-up first. These six hold for every app we ship.",
  },
  toolsTitle: { th: "งานเล็ก ๆ ก็มีให้", en: "Small jobs too" },
  toolsLead: {
    th: `เครื่องมือ ${TOOLS.length} ชิ้น กับแอปเบา ๆ อีก ${apps.length} ตัว ทำงานในเบราว์เซอร์ ไม่ต้องติดตั้งอะไร`,
    en: `${TOOLS.length} tools and ${apps.length} light apps that run in the browser, nothing to install.`,
  },
  tools: { th: "เปิดเครื่องมือ", en: "Open the tools" },
  lightApps: { th: "ดูแอปเบา", en: "See the light apps" },
  withUs: { th: "สร้างไปด้วยกัน", en: "Build it with us" },
  withUsLead: {
    th: "อยากได้แอปไหน เจอบั๊กตรงไหน หรือแค่อยากคุย ทักมาได้ทุกช่องทาง",
    en: "Want an app, found a bug, or just want to talk? Reach us anywhere below.",
  },
} satisfies Record<string, Record<Lang, string>>;

const PRINCIPLES: {
  icon: typeof Heart;
  title: Record<Lang, string>;
  body: Record<Lang, string>;
}[] = [
  {
    icon: Heart,
    title: { th: "ฟรี ไม่มีโฆษณา", en: "Free, no ads" },
    body: {
      th: "ใช้ได้ครบทุกฟีเจอร์ ไม่มีแผนรายเดือน ไม่มีป้ายโฆษณามาบังงาน",
      en: "Every feature, no monthly plan, no banner over your work.",
    },
  },
  {
    icon: HardDrive,
    title: { th: "ไฟล์อยู่ในเครื่องคุณ", en: "Your files stay with you" },
    body: {
      th: "แอปเปิดไฟล์ในเบราว์เซอร์หรือในเครื่อง ซิงก์ขึ้นคลาวด์เฉพาะตอนคุณล็อกอิน",
      en: "Apps open files in the browser or on your PC. Cloud sync only when you sign in.",
    },
  },
  {
    icon: Globe,
    title: { th: "เปิดในเว็บได้ทันที", en: "Open on the web" },
    body: {
      th: "ไม่ต้องติดตั้ง กดติดตั้งแอปจากเมนูเบราว์เซอร์แล้วใช้ออฟไลน์ได้",
      en: "Nothing to install. Choose Install app in the browser menu to use it offline.",
    },
  },
  {
    icon: Download,
    title: { th: "ติดตั้งลง Windows", en: "Install on Windows" },
    body: {
      th: "มีตัวติดตั้ง MSI และแบบพกพา ZIP หรือใช้ Launcher ตัวเดียวจัดการทั้งหมด",
      en: "MSI installers and portable ZIPs, or let the launcher handle them all.",
    },
  },
  {
    icon: Scale,
    title: { th: "สัญญาอนุญาตชัดเจน", en: "Clear licences" },
    body: {
      th: "ทุกแอปบอกที่มาของโค้ด ส่วนที่เป็นโอเพนซอร์สมีลิงก์ซอร์สให้ในหน้าสัญญาอนุญาต",
      en: "Every app names where its code comes from; open source parts link their source.",
    },
  },
  {
    icon: Wrench,
    title: { th: "แก้ไขต่อได้", en: "Yours to change" },
    body: {
      th: "ซอร์สอยู่บน GitHub ของ crocwork ทุกตัว อยากได้อะไรเพิ่มบอกเราใน Discord",
      en: "All source is on crocwork's GitHub. Ask for changes on the Discord.",
    },
  },
];

const rise = (i: number) => ({ "--i": i }) as CSSProperties;

const btnDark =
  "inline-flex min-h-11 items-center gap-2 rounded-lg bg-on-surface px-5 text-sm font-medium text-surface transition-transform hover:-translate-y-0.5";
const btnLine =
  "inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-5 text-sm font-medium transition-transform hover:-translate-y-0.5";

/** A section in a ruled column: a header bar "01 / TITLE", crop marks on its top corners. */
function Sec({
  n,
  title,
  right,
  id,
  children,
}: {
  n: string;
  title: string;
  right: string;
  id: string;
  children: ReactNode;
}) {
  const mark = "absolute -top-[5px] size-[9px] border border-outline-variant bg-surface";
  return (
    <section id={id} data-spy={title} className="scroll-mt-20 border-t border-outline-variant">
      <div className="relative mx-auto max-w-7xl border-outline-variant xl:border-x">
        <span aria-hidden className={`${mark} -left-[5px] hidden xl:block`} />
        <span aria-hidden className={`${mark} -right-[5px] hidden xl:block`} />
        <p className="flex items-center justify-between gap-4 border-b border-outline-variant px-4 py-3 font-mono text-xs tracking-[0.2em] text-on-surface-variant uppercase sm:px-8">
          <span>
            {n} / {title}
          </span>
          <span>{right}</span>
        </p>
        <div data-tide className="px-4 py-12 sm:px-8 sm:py-16">
          {children}
        </div>
      </div>
    </section>
  );
}

/** App screens on the hero's orbit ring. */
const ORBIT = [
  "texture",
  "sound",
  "material",
  "cad",
  "vector",
  "darkroom",
  "slides",
  "pdf-editor",
  "layout",
  "icons",
].map((slug) => `/craft-shots/${slug}.webp`);

function Hero({ lang, title, intro, perks }: HeroProps) {
  return (
    <OrbitGallery images={ORBIT} data-spy="crocwork">
      <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl flex-col items-center justify-center px-4 py-20 text-center sm:px-8 md:min-h-[852px]">
        <p
          className="tb-rise font-display text-[clamp(3.5rem,15vw,11rem)] leading-[0.85] font-black tracking-tight"
          style={rise(0)}
        >
          <BlurText parts={[{ text: "croc" }, { text: "work", className: "text-primary" }]} />
        </p>
        <h1
          className="tb-rise mt-8 font-display text-3xl leading-tight font-black sm:text-5xl"
          style={rise(1)}
        >
          {title}
        </h1>
        <p className="tb-rise mt-4 max-w-md text-on-surface-variant" style={rise(2)}>
          {intro}
        </p>
        <div className="tb-rise mt-7 flex flex-wrap justify-center gap-3" style={rise(3)}>
          <a href={LAUNCHER} rel="noreferrer" className={btnDark}>
            <Download aria-hidden className="size-4" />
            {COPY.launcher[lang]}
          </a>
          <a href="#craft-apps" className={btnLine}>
            <LayoutGrid aria-hidden className="size-4" />
            {COPY.explore[lang]}
          </a>
        </div>
        <p
          className="tb-rise mt-4 font-mono text-xs tracking-[0.2em] text-on-surface-variant uppercase"
          style={rise(4)}
        >
          Windows · MSI (64-bit)
        </p>
        <p className="tb-rise mt-1 text-sm text-on-surface-variant" style={rise(4)}>
          {COPY.launcherNote[lang]}
        </p>
        <div
          className="tb-rise mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-on-surface-variant"
          style={rise(5)}
        >
          <a
            href={GITHUB}
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-primary"
          >
            <GitBranch aria-hidden className="size-3.5" />
            {COPY.github[lang]}
          </a>
          {perks.map((p) => (
            <span key={p}>{p}</span>
          ))}
        </div>
        <a
          href="#craft-apps"
          aria-label={COPY.explore[lang]}
          className="float-tile vt-live mt-10 grid size-10 place-items-center rounded-full border border-outline-variant text-on-surface-variant"
        >
          <ArrowDown aria-hidden className="size-4" />
        </a>
      </div>
    </OrbitGallery>
  );
}

const SPY = ["crocwork", "Craft apps", "Lineup", "Principles", "Toolboxes", "Community"];

/** Section labels down the left edge and a scroll readout on the right (wide screens only). */
function ScrollMarks() {
  const [current, setCurrent] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>("[data-spy]")];
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      setPct(max > 0 ? Math.round((scrollY / max) * 100) : 0);
      const mid = innerHeight / 2;
      let at = 0;
      sections.forEach((s, i) => {
        if (s.getBoundingClientRect().top < mid) at = i;
      });
      setCurrent(at);
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-y-0 z-10 hidden w-full 2xl:block">
      <ol className="absolute top-1/2 left-6 -translate-y-1/2 space-y-2 font-mono text-[11px] tracking-[0.2em] uppercase">
        {SPY.map((l, i) => (
          <li
            key={l}
            className={`transition-[opacity,transform] duration-300 ${i === current ? "translate-x-1 text-primary opacity-100" : "opacity-40"}`}
          >
            {String(i).padStart(2, "0")} {l}
          </li>
        ))}
      </ol>
      <div className="absolute top-1/2 right-6 flex -translate-y-1/2 items-center gap-3">
        <span className="w-9 text-right font-mono text-[11px] text-on-surface-variant tabular-nums">
          {pct}%
        </span>
        <span className="flex h-64 flex-col justify-between">
          {Array.from({ length: 21 }, (_, i) => (
            <span
              key={i}
              className={`block h-px bg-on-surface-variant ${i % 5 ? "w-2 opacity-30" : "w-4 opacity-60"}`}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

type HeroProps = { lang: Lang; title: string; intro: string; perks: readonly string[] };

/** Toolboxes home: hero, the app grid, the lineup cards, what we hold to, the tools, then the community. */
export function CraftHome(props: HeroProps) {
  const { lang } = props;
  return (
    <main className="overflow-x-clip">
      <TideReveal />
      <ScrollMarks />
      <Hero {...props} />

      <Sec n="01" title="Craft apps" right={`${CRAFT_APPS.length} apps`} id="craft-apps">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="font-display text-4xl leading-tight font-black sm:text-5xl">
              {COPY.appsTitle[lang]} <span className="text-primary">{COPY.appsCount[lang]}</span>
            </h2>
            <p className="mt-4 max-w-md text-on-surface-variant">{COPY.appsLead[lang]}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={LAUNCHER} rel="noreferrer" className={btnDark}>
                <Download aria-hidden className="size-4" />
                {COPY.launcher[lang]}
              </a>
              <a href={DISCORD} rel="noreferrer" className={btnLine}>
                <MessagesSquare aria-hidden className="size-4" />
                {COPY.discord[lang]}
              </a>
            </div>
            <div className="mt-4">
              <CopyButton value={location.origin} label={COPY.share[lang]} />
            </div>
          </div>
          <ul className="grid grid-cols-3 gap-x-2 gap-y-6 sm:grid-cols-4 lg:col-span-7 lg:grid-cols-6">
            {CRAFT_APPS.map((app) => (
              <li key={app.slug}>
                <a
                  href={`#app-${app.slug}`}
                  className="ch-pick flex flex-col items-center gap-2 text-center"
                >
                  <CraftTile app={app} size={56} />
                  <span className="text-xs leading-tight">
                    crocwork <span className="font-semibold">{app.word}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Sec>

      <Sec n="02" title="Lineup" right="Web · Windows" id="lineup">
        <h2 className="mb-8 font-display text-4xl leading-tight font-black sm:text-5xl">
          {COPY.lineupTitle[lang]} <span className="text-primary">{COPY.lineupBlue[lang]}</span>
        </h2>
        <CraftLineup lang={lang} more={DISCORD} />
      </Sec>

      <Sec n="03" title="Principles" right="6 rules" id="principles">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl leading-tight font-black sm:text-5xl">
            {COPY.principlesTitle[lang]}
          </h2>
          <p className="mt-4 text-on-surface-variant">{COPY.principlesLead[lang]}</p>
        </div>
        <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border border-outline-variant bg-outline-variant sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <li key={p.title.en} className="flex flex-col gap-3 bg-surface-container-lowest p-6">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-lg border border-outline-variant text-primary">
                  <p.icon aria-hidden className="size-5" />
                </span>
                <span className="font-mono text-xs text-on-surface-variant">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-display text-lg font-black">{p.title[lang]}</h3>
              <p className="text-sm leading-relaxed text-on-surface-variant">{p.body[lang]}</p>
            </li>
          ))}
        </ul>
      </Sec>

      <Sec n="04" title="Toolboxes" right={`${TOOLS.length} tools`} id="tools">
        <div className="flex flex-col items-center text-center">
          <h2 className="font-display text-4xl leading-tight font-black sm:text-5xl">
            {COPY.toolsTitle[lang]}
          </h2>
          <p className="mt-4 max-w-xl text-on-surface-variant">{COPY.toolsLead[lang]}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/tools" className={btnDark}>
              <Wrench aria-hidden className="size-4" />
              {COPY.tools[lang]}
            </Link>
            <Link to="/apps" className={btnLine}>
              <LayoutGrid aria-hidden className="size-4" />
              {COPY.lightApps[lang]}
            </Link>
          </div>
        </div>
      </Sec>

      <section
        data-spy="Community"
        className="border-t border-outline-variant bg-[var(--em-ink-975)] text-[var(--em-ink-0)]"
      >
        <div
          data-tide
          className="mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-8"
        >
          <h2 className="font-display text-4xl font-black sm:text-6xl">{COPY.withUs[lang]}</h2>
          <p className="mt-4 max-w-md opacity-75">{COPY.withUsLead[lang]}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {contacts.map((c) => (
              <a
                key={c.label}
                href={c.href}
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--em-ink-0)]/25 px-5 text-sm transition-transform hover:-translate-y-0.5"
              >
                {c.label}
                <ArrowUpRight aria-hidden className="size-3.5" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
