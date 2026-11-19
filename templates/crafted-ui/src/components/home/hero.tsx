"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AppWindow, Bookmark, Boxes, ChevronRight, CircleHelp, Clapperboard, Diamond, Folder, Grid2x2, Home, Image as ImageIcon,
  Layers, LayoutTemplate, LogIn, Menu, MessageSquare, Palette, PanelsTopLeft, PlusCircle, Search, Sparkles, SquareMousePointer, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND, Mark } from "@/components/site/logo";
import { MiniPreview } from "@/components/playground/mini-preview";
import { COMPONENTS, getComponent } from "@/data/components-registry";
import { openCommandMenu } from "@/components/playground/command-menu";
import { cn } from "@/lib/utils";

const LIB = "/community/components/";

const NAV = [
  { label: "Components", Icon: Grid2x2 },
  { label: "Themes", Icon: Palette },
  { label: "Templates", Icon: LayoutTemplate },
  { label: "Apps", Icon: Boxes, isNew: true },
  { label: "Icons", Icon: Diamond, isNew: true },
  { label: "Video", Icon: Clapperboard, isNew: true },
];

const CATS = [
  { group: "Heroes and motion", items: [["Animated heroes", "", Sparkles], ["Hero sections", "1.3K", PanelsTopLeft], ["Shaders", "651", Palette], ["Backgrounds", "542", ImageIcon], ["Gradients", "", Layers], ["Footers", "", AppWindow]] },
  { group: "UI components", items: [["Buttons", "1.7K", SquareMousePointer], ["AI chats", "358", MessageSquare], ["Cards & grids", "1.3K", Grid2x2], ["Galleries & 3D", "", Boxes], ["Navigation", "528", Menu], ["Sign ins & widgets", "87", LogIn]] },
] as const;

function Rail({ title, sub, from, numbered }: { title: string; sub: string; from: number; numbered?: boolean }) {
  const slugs = Array.from({ length: 8 }, (_, i) => COMPONENTS[(from + i) % COMPONENTS.length].slug);
  return (
    <section className="mb-9">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-ink">{title}</h3>
          <p className="mt-0.5 text-[13px] text-dim">{sub}</p>
        </div>
        <Link href={LIB} className="flex shrink-0 items-center gap-0.5 text-[13px] text-dim hover:text-ink">View all <ChevronRight className="size-3.5" /></Link>
      </div>
      <div className="mt-3 flex gap-4 overflow-x-auto [scrollbar-width:none]">
        {slugs.map((s, i) => {
          const c = getComponent(s)!;
          return (
            <Link key={s} href={`/c/${s}/`} className={cn("relative block shrink-0", numbered ? "w-[42%] pl-11 md:w-[288px]" : "w-[44%] md:w-[232px]")}>
              {numbered && <span className="absolute bottom-6 left-0 text-[88px] font-bold leading-none text-white/[0.07]">{i + 1}</span>}
              <MiniPreview component={c} className="h-[173px] rounded-xl ring-1 ring-white/[0.06]" designWidth={560} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function GalleryView() {
  return (
    <div className="flex h-full">
      <aside className="hidden w-[228px] shrink-0 flex-col bg-white/[0.016] px-3 pt-4 pb-3 lg:flex">
        <div className="mb-3 flex items-center gap-1.5 px-1 text-[17px] font-bold tracking-[-0.03em]"><Mark className="text-brand" />{BRAND.toUpperCase()}</div>
        <button type="button" onClick={openCommandMenu} className="flex h-8 items-center gap-2 rounded-lg bg-white/[0.043] px-2.5 text-[13px] text-dim ring-1 ring-white/[0.06]">
          <Search className="size-3.5" /> Search <span className="ml-auto text-[11px]">⌘ K</span>
        </button>
        <span className="mt-3 flex h-[30px] items-center gap-2 rounded-lg bg-[#f1f1ff12] px-2.5 text-[13px] font-medium text-ink"><Home className="size-4" />Home</span>
        <p className="mt-4 mb-1 px-2 text-[11.5px] font-medium text-dim">Explore</p>
        {NAV.map(({ label, Icon, isNew }) => (
          <Link key={label} href={LIB} className="flex h-[31px] items-center gap-2 rounded-lg px-2.5 text-[13px] text-[#f6f6f9c7] hover:bg-white/5">
            <Icon className="size-4" />{label}
            {isNew && <span className="rounded bg-white/10 px-1.5 text-[10.5px]">New</span>}
            <ChevronRight className="ml-auto size-3.5 text-dim" />
          </Link>
        ))}
        <span className="flex h-[31px] items-center gap-2 px-2.5 text-[13px] text-[#f6f6f9c7]"><Bookmark className="size-4" />Bookmarks</span>
        <div className="mt-auto flex items-center justify-between px-2 text-[12.5px] text-[#f6f6f8cc]">
          <CircleHelp className="size-4 text-dim" />
          <Link href="/pricing/" className="flex items-center gap-1.5"><PlusCircle className="size-3.5" />Publish</Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1 overflow-y-auto px-4 pt-4 md:px-8 [scrollbar-width:none]">
        <div className="flex items-center justify-end gap-4">
          <span className="mr-auto flex items-center gap-1.5 text-[17px] font-bold tracking-[-0.03em] lg:hidden"><Mark className="text-brand" />{BRAND.toUpperCase()}</span>
          <Search className="size-4 text-ink lg:hidden" />
          <Bookmark className="size-4 text-ink" />
          <span className="size-7 rounded-full bg-[#e2f53b]" />
        </div>
        <div className="mt-2">
          <Rail title="Top today" sub="The most saved components of the day" from={8} numbered />
          <Rail title="New & noteworthy" sub="The best components of the last month" from={0} />
          <section className="mb-9">
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-semibold tracking-[-0.02em]">Categories</h3>
              <Link href={LIB} className="flex items-center gap-0.5 text-[13px] text-dim hover:text-ink">All components <ChevronRight className="size-3.5" /></Link>
            </div>
            <div className="mt-2 grid gap-x-8 md:grid-cols-2">
              {CATS.map((g) => (
                <div key={g.group}>
                  <p className="mb-1.5 text-[13px] font-medium text-dim">{g.group}</p>
                  <div className="grid grid-cols-2 gap-x-2">
                    {g.items.map(([label, n, Icon]) => (
                      <Link key={label} href={LIB} className="flex h-[35px] min-w-0 items-center gap-2 text-[14px] font-medium tracking-[-0.02em] text-ink hover:text-white">
                        <Icon className="size-4 shrink-0 text-dim" /><span className="truncate">{label}</span>{n && <span className="text-[11px] text-dim">{n}</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <Rail title="Heroes that move" sub="Animated heroes and shaders, the most copied this week" from={3} />
          <Rail title="UI that ships" sub="Inputs, chats and buttons made by design engineers" from={5} />
        </div>
      </div>
    </div>
  );
}

function ChatView() {
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div className="flex h-full">
      <aside className="hidden w-[164px] shrink-0 flex-col gap-0.5 bg-[#1e1e1e] px-1.5 pt-6 text-[12.5px] text-[#d9d9d9] md:flex">
        <p className="px-2 py-1">New chat</p>
        <p className="mt-2 px-2 text-[11.5px] text-white/40">Projects</p>
        <p className="rounded-md bg-[#2b2b2b] px-2 py-1">acme-website</p>
        <p className="px-2 py-1 text-[#d9d9d9d1]">Fix flaky checkout test</p>
        <p className="px-2 py-1 text-[#d9d9d9d1]">Audit bundle size</p>
        <p className="mt-2 px-2 text-[11.5px] text-white/40">Recents</p>
        {["Add dark mode toggle", "Find latest PR", "Accessibility pass"].map((r) => <p key={r} className="px-2 py-1">{r}</p>)}
      </aside>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-[#171717] px-6">
        {sent.map((s, i) => <p key={i} className="max-w-md self-end rounded-xl bg-white/10 px-3 py-2 text-[13px]">{s}</p>)}
        {!sent.length && <p className="text-center text-[18px] text-white">What should we build in acme-website?</p>}
        <form
          className="flex w-full max-w-lg items-center gap-2 rounded-2xl bg-[#262626] p-2 pl-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (msg.trim()) setSent((s) => [...s, msg.trim()]);
            setMsg("");
          }}
        >
          <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Add the animated hero from the library" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-white/40" />
          <button type="submit" aria-label="Send" className="flex size-8 items-center justify-center rounded-full bg-white text-black"><Wand2 className="size-4" /></button>
        </form>
      </div>
    </div>
  );
}

function TerminalView() {
  const c = getComponent("border-beam-button")!;
  return (
    <div className="flex h-full flex-col bg-[#c96a4f] p-6 font-mono text-[13px] text-white/90 md:p-10">
      <p>$ agent</p>
      <p className="mt-3 text-white/70">✓ components/ui/{c.slug}.tsx</p>
      <p className="text-white/70">✓ +{COMPONENTS.length * 12} lines, adapted to your theme</p>
      <p className="mt-6 border-t border-white/20 pt-3">› [Pasted prompt: {c.name}]<span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-white" /></p>
    </div>
  );
}

const DOCK = [
  { id: "finder", label: "Files", bg: "linear-gradient(180deg,#3fc1ff,#1673ea)", Icon: Folder },
  { id: "gallery", label: BRAND, bg: "linear-gradient(180deg,#3d6bff,#0033ff)", Icon: null },
  { id: "chat", label: "Chat", bg: "linear-gradient(180deg,#2b2b40,#1a1a24)", Icon: MessageSquare },
  { id: "terminal", label: "Agent", bg: "linear-gradient(180deg,#f08a5d,#d9541e)", Icon: Sparkles },
] as const;
type View = (typeof DOCK)[number]["id"];

export function Hero({ children }: { children?: React.ReactNode }) {
  const [view, setView] = useState<View>("gallery");
  return (
    <section className="relative mx-auto max-w-6xl pb-16 md:pb-24">
      <div aria-hidden className="swirl pointer-events-none absolute left-1/2 w-screen -translate-x-1/2 overflow-hidden -top-14 h-[1000px] [mask-image:linear-gradient(to_bottom,black_45%,transparent)]">
        <div className="absolute inset-0 animate-[swirl-float_18s_ease-in-out_infinite] bg-[radial-gradient(40%_30%_at_70%_20%,#2440ff55,transparent_70%)]" />
      </div>
      <div className="site-col relative pt-[76px] text-center md:pt-[83px] lg:pt-[81px]">
        <h1 className="display mx-auto max-w-[620px] text-[40px] md:text-[45px] lg:max-w-none lg:text-hero">
          Just copy-paste<br />real designs.
        </h1>
        <p className="mx-auto mt-5 max-w-[330px] text-[17px] leading-[1.5] text-dim md:max-w-none lg:text-lead">
          Find components, copy prompts, and ship polished UI with your AI agent.
        </p>
        <div className="mt-7 flex justify-center gap-2.5">
          <Button className="h-[46px] rounded-[10px] px-[22px] text-[15px] font-medium" render={<Link href="/pricing/" />} nativeButton={false}>Get {BRAND} free</Button>
          <Button variant="secondary" className="h-[46px] rounded-[10px] bg-chip px-[22px] text-[15px] font-medium text-ink hover:bg-white/15" render={<Link href={LIB} />} nativeButton={false}>Browse components</Button>
        </div>
      </div>

      <div className="site-col relative mt-[64px]">
        <div className="relative rounded-[28px] border border-white/[0.07] bg-white/[0.02] p-3 pb-0 md:rounded-[40px] md:p-[37px] md:pb-0">
          <div className="h-[540px] overflow-hidden rounded-t-[18px] border border-b-0 border-white/[0.07] bg-[#060607] md:h-[520px] lg:h-[781px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={view} className="h-full" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.985 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
                {view === "chat" ? <ChatView /> : view === "terminal" ? <TerminalView /> : <GalleryView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div className="absolute -bottom-[30px] left-1/2 flex -translate-x-1/2 gap-2 rounded-[22px] border border-white/10 bg-[#1b1b1f]/90 p-[7px] pb-3 backdrop-blur-xl">
          {DOCK.map((d) => (
            <motion.button
              key={d.id}
              type="button"
              aria-label={d.label}
              onClick={() => setView(d.id === "finder" ? "gallery" : d.id)}
              whileHover={{ y: -4, scale: 1.08 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative flex size-[46px] items-center justify-center rounded-[12px] text-white"
              style={{ background: d.bg }}
            >
              {d.Icon ? <d.Icon className="size-6" /> : <Mark className="size-6" />}
              {view === d.id && <motion.span layoutId="dock-dot" className="absolute -bottom-[7px] size-1 rounded-full bg-white/80" />}
            </motion.button>
          ))}
        </div>
      </div>
      {children}
    </section>
  );
}
