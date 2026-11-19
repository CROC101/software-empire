"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bookmark, Check, Globe2, Plus, Search, Clock, Cloud, Wallet, Heart, Rocket, Camera, Music, Bell, Globe, Zap, Gift, Coffee, Sun, Moon, Lock, Mail, Map, Flag, Leaf, Banknote, CreditCard, Coins, Timer, AlarmClock, CloudRain, CloudSun, Umbrella, Home, User, Users, Settings, Trash, Send, Phone, Calendar, Book, Cpu, Database, Shield, Key, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BRAND } from "@/components/site/logo";
import { ProductArt } from "@/components/site/header";
import { MiniPreview } from "@/components/playground/mini-preview";
import { getComponent, getSource } from "@/data/components-registry";
import { cn } from "@/lib/utils";

const LIB = "/community/components/";
const spring = { type: "spring", stiffness: 400, damping: 30 } as const;

const LOGOS = ["Northwind", "Lumen", "Arcadia", "Helix", "Quanta", "Vertex", "Orbital", "Cobalt"];
const STARTUPS = ["Pinecraft", "Moonbase", "Driftly", "Kiteworks", "Saltbox", "Fernhill", "Tidewater"];

export function UsedBy() {
  return (
    <div className="site-col pt-[72px] md:pt-[128px]">
      <h2 className="max-w-[1000px] text-[28px] font-medium leading-[1.12] tracking-[-0.035em] lg:text-[44px]">
        Used by <span className="underline decoration-brand decoration-[3px] underline-offset-[6px]">4,736,063</span> builders.{" "}
        <span className="text-dim">From indie makers to the world's largest product teams</span>
      </h2>
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="grid grid-cols-3 content-start gap-y-[26px] text-[17px] leading-[22px] font-semibold tracking-[-0.03em] text-ink-faint lg:grid-cols-4">
          {LOGOS.map((l) => <span key={l}>{l}</span>)}
        </div>
        <div>
          <h3 className="text-[15px] font-medium">Startups:</h3>
          <div className="mt-3 grid grid-cols-3 gap-y-[26px] text-[15px] leading-[22px] font-semibold text-ink-faint lg:grid-cols-4">{STARTUPS.map((s) => <span key={s}>{s}</span>)}</div>
        </div>
      </div>
    </div>
  );
}

const TEMPLATES = [
  { name: "Orbit AI/SaaS Product Template", by: "nova", slug: "liquid-metal-hero" },
  { name: "Signal Analytics Dashboard", by: "prism", slug: "bento-metrics-grid" },
  { name: "Drift Agency Landing", by: "glitchlab", slug: "aurora-mesh-background" },
  { name: "Pulse Launch Page", by: "minhxthanh", slug: "floating-command-island" },
];
const THEMES = [
  { name: "Silk Black", sw: ["#ffffff", "#7c5cff", "#c6f432", "#ff8a3d"] },
  { name: "Paper Mint", sw: ["#f4f1ea", "#1f8a70", "#bedb39", "#fd7400"] },
  { name: "Night Ocean", sw: ["#e6f1ff", "#2b6cff", "#24d1c4", "#ff4d6d"] },
];
const SHADERS = [
  { name: "Plasma", bg: "radial-gradient(circle at 30% 30%,#ff5e8a,transparent 55%),radial-gradient(circle at 70% 70%,#3d5cff,transparent 55%),#140b2a" },
  { name: "Mesh", bg: "conic-gradient(from 90deg at 50% 50%,#00d2ff,#3a7bd5,#9b5cff,#00d2ff)" },
  { name: "Grain", bg: "radial-gradient(circle at 50% 120%,#ffb347,#ff5f6d 45%,#1b0f1f 80%)" },
  { name: "Waves", bg: "repeating-linear-gradient(115deg,#0f2027 0 14px,#203a43 14px 28px,#2c5364 28px 42px)" },
];

/** Auto-advancing progress-bar tabs; clicking a tab jumps to it and restarts its bar. */
function useCycler(count: number, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setI((n) => (n + 1) % count), ms);
    return () => clearTimeout(t);
  }, [i, count, ms]);
  return [i, setI] as const;
}

function ProgressTabs({ count, active, onPick, ms, label }: { count: number; active: number; onPick: (i: number) => void; ms: number; label: string }) {
  return (
    <div className="flex gap-1.5" role="tablist">
      {Array.from({ length: count }, (_, i) => (
        <button key={i} type="button" role="tab" aria-selected={i === active} aria-label={`${label} ${i + 1}`} onClick={() => onPick(i)} className="h-4 w-7 py-1.5">
          <span className="block h-1 overflow-hidden rounded-full bg-white/15">
            {i === active && <motion.span key={`${active}`} className="block h-full bg-white/80" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: ms / 1000, ease: "linear" }} />}
            {i < active && <span className="block h-full bg-white/50" />}
          </span>
        </button>
      ))}
    </div>
  );
}

function Article({ className, pc, preview, title, sub, href, cta }: { className?: string; pc: string; preview: React.ReactNode; title: string; sub: string; href: string; cta: string }) {
  return (
    <article className={cn("flex flex-col overflow-hidden rounded-[20px] bg-panel", className)}>
      <div className={cn("relative m-2 mb-0 overflow-hidden rounded-[14px] bg-panel-2", pc)}>{preview}</div>
      <footer className="flex flex-1 items-end justify-between gap-4 px-[18px] pt-5 pb-[14px] lg:px-6 lg:pb-5">
        <div>
          <h3 className="text-[16px] font-medium">{title}</h3>
          <p className="text-[15px] text-dim">{sub}</p>
        </div>
        <Link href={href} className="flex shrink-0 items-center gap-1 text-[14px] font-medium text-ink-soft hover:text-ink">{cta} <ArrowRight className="size-3.5" /></Link>
      </footer>
    </article>
  );
}

const ICONS: [string, string, React.ComponentType<{ className?: string }>][] = [
  ["Clock", "time", Clock],
  ["Cloud", "", Cloud],
  ["Wallet", "money cash", Wallet],
  ["Heart", "love like", Heart],
  ["Rocket", "", Rocket],
  ["Camera", "", Camera],
  ["Music", "", Music],
  ["Bell", "", Bell],
  ["Globe", "", Globe],
  ["Zap", "", Zap],
  ["Star", "", Star],
  ["Gift", "", Gift],
  ["Coffee", "", Coffee],
  ["Sun", "", Sun],
  ["Moon", "", Moon],
  ["Lock", "", Lock],
  ["Mail", "email", Mail],
  ["Map", "", Map],
  ["Flag", "", Flag],
  ["Leaf", "", Leaf],
  ["Banknote", "money cash", Banknote],
  ["CreditCard", "money pay", CreditCard],
  ["Coins", "money", Coins],
  ["Timer", "clock time", Timer],
  ["AlarmClock", "clock time", AlarmClock],
  ["CloudRain", "cloud weather", CloudRain],
  ["CloudSun", "cloud weather", CloudSun],
  ["Umbrella", "rain weather", Umbrella],
  ["Home", "", Home],
  ["User", "", User],
  ["Users", "", Users],
  ["Settings", "", Settings],
  ["Trash", "", Trash],
  ["Send", "", Send],
  ["Phone", "call", Phone],
  ["Calendar", "", Calendar],
  ["Book", "", Book],
  ["Cpu", "", Cpu],
  ["Database", "", Database],
  ["Shield", "", Shield],
  ["Key", "", Key],
];

function IconSearch() {
  const [q, setQ] = useState("");
  const names = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (s ? ICONS.filter(([n, tags]) => (n + tags).toLowerCase().includes(s)) : ICONS).slice(0, 20);
  }, [q]);
  return (
    <div className="flex h-full flex-col p-4">
      <label className="flex h-9 items-center gap-2 rounded-lg bg-white/[0.06] px-3 text-[13px]">
        <Search className="size-3.5 text-dim" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try clock, cloud, money" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-dim" />
      </label>
      <div className="mt-3 grid flex-1 grid-cols-5 content-start gap-1.5">
        {names.map(([n, , I]) => <span key={n} title={n} className="flex h-10 items-center justify-center rounded-lg bg-white/[0.03] text-ink-soft"><I className="size-[18px]" /></span>)}
      </div>
    </div>
  );
}

export function MoreThan() {
  const [t, setT] = useCycler(TEMPLATES.length, 5000);
  const [theme, setTheme] = useState(0);
  const [sh, setSh] = useCycler(SHADERS.length, 4000);
  const tpl = TEMPLATES[t];
  return (
    <section className="site-col py-[72px] lg:py-[115px]">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="display text-[28px] lg:text-[44px]">More than components</h2>
          <p className="mt-3 max-w-[340px] text-[16px] text-dim">Whole templates, themes, live shaders and icons, from the same design engineers</p>
        </div>
        <Button variant="secondary" className="h-10 w-fit rounded-[10px] bg-chip px-4 text-[14px] text-ink" render={<Link href={LIB} />} nativeButton={false}>Browse components</Button>
      </div>
      <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-[639fr_453fr]">
        <Article
          className="md:col-span-2 lg:col-span-1" pc="h-[233px] md:h-[436px] lg:h-[330px]"
          title="362 templates" sub="Whole sites to start from" href={LIB} cta="All templates"
          preview={
            <>
              <AnimatePresence mode="wait">
                <motion.div key={t} className="absolute inset-0" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={spring}>
                  <MiniPreview component={getComponent(tpl.slug)!} designWidth={900} className="h-full" />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 pt-8 pb-3">
                <Link href={`/c/${tpl.slug}/`} className="truncate text-[13px] text-white/90">{tpl.name} by @{tpl.by}</Link>
                <ProgressTabs count={TEMPLATES.length} active={t} onPick={setT} ms={5000} label="Template" />
              </div>
            </>
          }
        />
        <Article
          className="md:col-span-2 lg:col-span-1" pc="h-[322px] md:h-[330px]"
          title="995 themes" sub="Re-skin your whole app in one paste" href={LIB} cta="All themes"
          preview={
            <div className="flex h-full flex-col gap-3 p-2">
              <div className="flex flex-1 flex-col rounded-xl bg-black p-4 ring-1 ring-white/10">
                <p className="text-[13px] text-ink-soft">Total revenue</p>
                <p className="text-[28px] font-semibold tracking-[-0.03em]">$45,231.89</p>
                <p className="text-[12px] text-dim">+20.1% from last month</p>
                <div className="mt-auto flex h-24 items-end gap-2">
                  {[38, 62, 50, 84, 70, 76, 96].map((h, i) => <motion.span key={i} className="flex-1 rounded-sm" animate={{ height: `${h}%`, backgroundColor: THEMES[theme].sw[0] === "#ffffff" ? "#ffffff" : THEMES[theme].sw[1] }} transition={spring} />)}
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-1">
                {THEMES.map((th, i) => (
                  <button key={th.name} type="button" aria-label={th.name} aria-pressed={i === theme} onClick={() => setTheme(i)} className={cn("size-4 rounded-full ring-offset-2 ring-offset-panel-2", i === theme && "ring-2 ring-white")} style={{ background: th.sw[1] }} />
                ))}
                <span className="ml-1.5 text-[13px] text-ink-soft">{THEMES[theme].name}</span>
              </div>
            </div>
          }
        />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Article
          pc="h-[274px] md:h-[298px]" title="386 shaders" sub="Live backgrounds, in your colours" href={LIB} cta="All shaders"
          preview={
            <>
              <motion.div key={sh} className="absolute inset-0" style={{ background: SHADERS[sh].bg }} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 pb-3">
                <div className="flex gap-1.5">{SHADERS.map((s, i) => <button key={s.name} type="button" aria-label={s.name} onClick={() => setSh(i)} className={cn("size-5 rounded-full ring-2", i === sh ? "ring-white" : "ring-transparent")} style={{ background: s.bg }} />)}</div>
                <ProgressTabs count={SHADERS.length} active={sh} onPick={setSh} ms={4000} label="Shader" />
              </div>
            </>
          }
        />
        <Article pc="h-[298px]" title="29,000 icons" sub="Found by what they mean" href={LIB} cta="Search icons" preview={<IconSearch />} />
        <Article
          className="md:col-span-2 lg:col-span-1" pc="h-[274px] lg:h-[298px]"
          title="138 apps" sub="Open source, each with a live demo" href={LIB} cta="All apps"
          preview={
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="rounded-full bg-[radial-gradient(circle_at_35%_30%,#3d6bff,#0b1440_70%)] p-6 shadow-[0_0_80px_#0033ff55]">
                <Globe2 className="size-28 text-white/70" strokeWidth={0.8} />
              </motion.div>
              <p className="flex items-center gap-1 text-[13px] text-ink-soft"><Star className="size-3.5 fill-current" /> 42,438 · World View</p>
            </div>
          }
        />
      </div>
    </section>
  );
}

const AGENTS = [
  { bg: "#c96a4f", text: "Paste it in the terminal and the source lands in your repo, adapted to your stack.", body: <div className="rounded-xl bg-black/25 p-4 font-mono text-[12px] leading-6 text-white/90"><p>$ agent</p><p className="text-white/70">✓ create components/ui/border-beam-button.tsx</p><p className="text-white/70">✓ full source is 148 lines, uses cn()</p><p className="text-white/70">✓ updated main in app/page.tsx</p><p className="mt-2">› Done in 9s</p></div> },
  { bg: "#4b4fd6", text: "The same prompt as a task, and the cloud agent ships a pull request.", body: <div className="rounded-xl bg-white p-4 font-mono text-[12px] leading-6 text-black/80"><p className="font-sans font-medium">Diff · 2 files</p><p className="text-emerald-600">+ import {"{ BorderBeamButton }"}</p><p className="text-emerald-600">+ &lt;BorderBeamButton /&gt;</p><p className="text-rose-600">- &lt;button&gt;Get started&lt;/button&gt;</p></div> },
  { bg: "#ead3cf", text: "Paste it in chat and the exact UI appears in your project.", dark: true, body: <div className="rounded-xl bg-white p-4 text-[13px] text-black/80 shadow-sm"><p className="text-black/50">Worked for 14s</p><p className="mt-2 flex items-center gap-1.5"><Check className="size-4 text-emerald-600" /> Added the hero with your colours</p><p className="mt-2 font-mono text-[11.5px] text-black/55">{'<AnimatedHero className="hover:shimmer" title="Acme website" />'}</p></div> },
];

export function BuiltFor() {
  const [tab, setTab] = useState<"code" | "preview">("code");
  const [saved, setSaved] = useState(false);
  const c = getComponent("border-beam-button")!;
  const lines = getSource(c.slug).split("\n").slice(0, 22);
  return (
    <section className="site-col py-[72px] lg:py-[115px]">
      <h2 className="display text-[28px] lg:text-[44px]">Built for how you ship</h2>
      <div className="mt-10 flex snap-x gap-3 overflow-x-auto [scrollbar-width:none] lg:grid lg:grid-cols-3">
        {AGENTS.map((a, i) => (
          <div key={i} className="flex h-[520px] w-[300px] shrink-0 snap-start flex-col justify-between rounded-[20px] p-8 lg:w-auto" style={{ background: a.bg }}>
            {a.body}
            <p className={cn("max-w-[288px] text-[17px] leading-[1.35]", a.dark ? "text-black/80" : "text-white/90")}>{a.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid overflow-hidden rounded-[20px] bg-panel lg:grid-cols-[1.75fr_1fr]">
        <div className="p-6 md:p-10">
          <div className="relative flex w-fit rounded-lg bg-white/[0.05] p-0.5">
            {(["code", "preview"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setTab(k)} className="relative z-10 h-8 w-[82px] text-[13px] capitalize">
                {tab === k && <motion.span layoutId="code-preview" transition={spring} className="absolute inset-0 -z-10 rounded-md bg-white/10" />}
                {k}
              </button>
            ))}
          </div>
          <div className="mt-4 h-[300px] overflow-hidden rounded-xl bg-[#0a0a0b] ring-1 ring-white/[0.06]">
            {tab === "code" ? (
              <pre className="h-full overflow-auto p-4 font-mono text-[12px] leading-5 text-ink-soft"><span className="text-dim">{"// "}components/ui/{c.slug}.tsx{"\n"}</span>{lines.join("\n")}</pre>
            ) : (
              <MiniPreview component={c} designWidth={520} className="h-full" />
            )}
          </div>
          <h3 className="mt-6 text-[17px] font-medium">Real code, ready to ship</h3>
          <p className="mt-1 max-w-[463px] text-[15px] text-dim">React and Tailwind on shadcn/ui conventions. Yours to edit, no lock-in.</p>
          <Button className="mt-5 h-9 rounded-[10px] px-4" render={<Link href={`/c/${c.slug}/`} />} nativeButton={false}>Get started →</Button>
        </div>
        <div className="flex flex-col justify-end border-t border-white/[0.06] p-6 md:p-10 lg:border-t-0 lg:border-l">
          <div className="rounded-xl bg-white/[0.04] p-5">
            <p className="text-[13px] text-dim">25,431 installs this week</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[15px] font-medium">Number Ticker</p>
              <button type="button" onClick={() => setSaved((s) => !s)} className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[13px]">
                <Bookmark className={cn("size-3.5", saved && "fill-current text-brand")} /> {454 + (saved ? 1 : 0)}
              </button>
            </div>
          </div>
          <h3 className="mt-6 text-[17px] font-medium">Save it for later</h3>
          <p className="mt-1 text-[15px] text-dim">Bookmark any component into your lists, and find it again in a second.</p>
        </div>
      </div>
    </section>
  );
}

const TOOLS = [
  { title: `${BRAND} AI`, sub: "Not in the library? Generate it", art: "ai" as const, href: "/c/aurora-mesh-background/" },
  { title: "Design Bug Bot", sub: "Design review on every pull request", art: "bot" as const, href: "/pricing/" },
  { title: "MCP and CLI", sub: "Inside your agent and your terminal", art: "cli" as const, href: "/c/border-beam-button/" },
  { title: "Shader Builder", sub: "Any shader in your colours, then copy the code", art: "library" as const, href: LIB },
];

export function OtherTools() {
  return (
    <section className="site-col py-[72px] lg:py-[115px]">
      <h2 className="display text-[28px] lg:text-[44px]">Other tools</h2>
      <div className="mt-10 flex snap-x gap-3 overflow-x-auto [scrollbar-width:none] lg:grid lg:grid-cols-4">
        {TOOLS.map((t) => (
          <Link key={t.title} href={t.href} className="group w-[280px] shrink-0 snap-start rounded-[20px] bg-panel p-2 pb-6 lg:w-auto">
            <div className="h-[220px] overflow-hidden rounded-[14px] bg-white/[0.04] transition-colors group-hover:bg-white/[0.07]"><ProductArt art={t.art} /></div>
            <h3 className="mt-4 px-4 text-[16px] font-medium">{t.title}</h3>
            <p className="px-4 text-[15px] text-dim">{t.sub}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

const FAQ = [
  ["What do I get for free?", "Browse the whole library, open any component in the studio, and copy prompts and install commands for free components."],
  ["How does a component get into my project?", "Copy the CLI command and run it, paste the source into src/components/ui, or hand the AI prompt to your coding agent."],
  ["Will my site look like everyone else's?", "No. Every component exposes its props, and the studio lets you change colours, sizes and copy, or apply your own theme, before you ship."],
  ["What does a paid plan add?", "Premium components, templates and themes, plus AI credits for generating new components and many code reviews."],
  ["Does it work with my stack?", "Components are React + Tailwind on shadcn/ui conventions, so they work with Next.js, Vite, Remix and Astro, and deploy to Vercel or any host in 10 minutes."],
];

export function Faq({ title = "Questions before you join", items = FAQ, className }: { title?: string; items?: string[][]; className?: string }) {
  return (
    <section className={cn("site-col grid gap-8 pt-[72px] pb-10 md:pb-14 lg:grid-cols-[464px_1fr] lg:pt-[115px]", className)}>
      <h2 className="display text-[28px] lg:text-[44px]">{title}</h2>
      <Accordion>
        {items.map(([q, a]) => (
          <AccordionItem key={q} value={q} className="border-b border-white/[0.06]">
            <AccordionTrigger className="h-16 items-center text-[17px] font-medium hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden">
              {q}
              <Plus className="ml-auto size-4 text-dim transition-transform group-aria-expanded/accordion-trigger:rotate-45" />
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-[15px] text-dim">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

export function Cta() {
  return (
    <section className="site-col pt-8 pb-[72px] md:pt-12 lg:pb-[115px]">
      <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#0b1a6b,#0033ff_55%,#4d7bff)] px-6 py-20 text-center md:py-28">
        <div aria-hidden className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_60px,#ffffff0a_60px_61px)]" />
        <h2 className="relative display text-[28px] lg:text-[44px]">Get started today.</h2>
        <div className="relative mt-8 flex justify-center gap-2.5">
          <Button className="h-[46px] rounded-[10px] bg-white px-[22px] text-[15px] font-medium text-black hover:bg-white/90" render={<Link href="/pricing/" />} nativeButton={false}>Get {BRAND} free</Button>
          <Button variant="secondary" className="h-[46px] rounded-[10px] bg-white/15 px-[22px] text-[15px] font-medium text-white hover:bg-white/25" render={<Link href={LIB} />} nativeButton={false}>Browse components</Button>
        </div>
      </div>
    </section>
  );
}
