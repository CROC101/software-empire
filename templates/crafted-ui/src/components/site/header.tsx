"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUp, ChevronDown, Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND, Logo } from "@/components/site/logo";
import { openCommandMenu } from "@/components/playground/command-menu";
import { cn } from "@/lib/utils";

const LIB = "/community/components/";

const SECTIONS = [
  { label: "Components", count: "12,000+", sub: "Live, each one with its author" },
  { label: "Templates", count: "362", sub: "Whole sites to start from" },
  { label: "Themes", count: "995", sub: "Re-skin your whole app" },
  { label: "Icons", count: "29,000", sub: "Searched by meaning" },
  { label: "Apps", count: "138", sub: "Open source, with demos" },
];

const STARTS = [
  ["Heroes", "1,257"], ["Pricing", "164"], ["AI chats", "358"], ["Backgrounds", "542"],
  ["Shaders", "651"], ["Dashboards", "325"], ["Buttons", "1,710"], ["Navigation", "528"],
  ["Testimonials", "122"], ["Sign-in", "87"], ["Forms", "1,749"], ["Cards", "1,334"],
  ["Text", "605"], ["CTAs", "356"], ["Galleries", "314"], ["Features", "202"],
];

const PRODUCTS = [
  { title: "The library", sub: "Real components, templates and themes", href: LIB, art: "library" },
  { title: `${BRAND} AI`, sub: "Not in the library? Generate it", href: "/c/aurora-mesh-background/", art: "ai" },
  { title: "Design Bug Bot", sub: "Design review on every pull request", href: "/pricing/", art: "bot" },
  { title: "MCP and CLI", sub: "Inside your agent and your terminal", href: "/c/border-beam-button/", art: "cli" },
] as const;

export function ProductArt({ art }: { art: (typeof PRODUCTS)[number]["art"] }) {
  if (art === "library")
    return (
      <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-xl bg-black px-6">
        <div className="absolute -right-10 top-1/4 h-40 w-56 rotate-[-25deg] rounded-full bg-[radial-gradient(closest-side,#f59e0b,#7c2d12_60%,transparent)] opacity-80 blur-md" />
        <p className="relative text-[18px] leading-tight tracking-[-0.03em] text-white">Light does not<br />leave here</p>
        <div className="relative mt-4 flex gap-2"><span className="h-3 w-9 rounded-full bg-white" /><span className="h-3 w-9 rounded-full bg-white/10" /></div>
      </div>
    );
  if (art === "ai")
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1.5 px-9">
        <div className="flex w-full items-center justify-between rounded-lg bg-brand px-2.5 py-1.5 text-[12.5px] font-semibold text-white">
          A pricing section <span className="flex size-5 items-center justify-center rounded-md bg-white text-brand"><ArrowUp className="size-3.5" /></span>
        </div>
        <div className="h-24 w-full rounded-lg border border-white/10 bg-black p-3"><div className="mx-auto h-full w-1/2 rounded bg-panel-2" /></div>
      </div>
    );
  if (art === "bot")
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="w-full rounded-xl border border-white/10 bg-panel-2 p-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full border-2 border-brand text-[12px] font-bold">70</span>
            <span className="text-[12.5px] leading-tight text-ink">Design score<br /><span className="text-dim">3 findings on a PR</span></span>
          </div>
          <div className="mt-2 truncate rounded-md bg-white/5 px-2 py-1.5 text-[12px] text-ink-soft">Button heights differ, 40 and 36</div>
        </div>
      </div>
    );
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="w-full rounded-xl border border-white/10 bg-panel-2 p-3 font-mono text-[11px] leading-[1.7] text-dim">
        <div>$ npx {BRAND.toLowerCase()} add hero</div>
        <div className="text-ink"><span className="text-sky-400">✓</span> hero.tsx</div>
        <div>agent › <span className="text-ink">{BRAND.toLowerCase()} over MCP</span></div>
        <div className="text-ink"><span className="text-sky-400">✓</span> installed</div>
      </div>
    </div>
  );
}

type MenuId = "library" | "product" | null;

function MegaPanel({ id, onClose }: { id: Exclude<MenuId, null>; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="absolute left-1/2 top-[64px] w-[min(1080px,calc(100vw-32px))] -translate-x-1/2 rounded-[20px] border border-white/[0.08] bg-[#0d0d10]/90 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
    >
      {id === "library" ? (
        <div className="grid grid-cols-[1fr_388px_338px] gap-2">
          <div className="flex flex-col px-4 pt-4 pb-3">
            {SECTIONS.map((s) => (
              <Link key={s.label} href={LIB} onClick={onClose} className="group mb-[17px] block">
                <span className="text-[19px] font-semibold tracking-[-0.03em] text-ink">{s.label}</span>
                <span className="ml-2 text-[13px] text-dim">{s.count}</span>
                <span className="block text-[13px] text-dim group-hover:text-ink-soft">{s.sub}</span>
              </Link>
            ))}
            <Link href="/pricing/" onClick={onClose} className="mt-auto flex items-center gap-1.5 text-[13px] text-dim hover:text-ink">
              Made something? Publish it <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-4">
            <p className="mb-3 text-[13px] text-dim">Where people start</p>
            <div className="grid grid-cols-2 gap-x-5">
              {STARTS.map(([label, n]) => (
                <Link key={label} href={LIB} onClick={onClose} className="flex h-[41px] items-center justify-between text-[14px] font-medium text-ink hover:text-white">
                  {label}<span className="text-[12.5px] font-normal text-dim">{n}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-3">
            <div className="flex h-[216px] items-center justify-center rounded-lg border border-white/10 bg-black p-6 font-mono text-[9px] leading-relaxed text-dim">
              <div className="w-full space-y-2">
                <div className="ml-auto w-fit rounded-md bg-white/10 px-2 py-1 text-ink">Why is the runs list query slow?</div>
                <p>Postgres picks a sequential scan because the status filter matches most rows. An index on (status, created_at) fixes it.</p>
                <div className="rounded border border-white/10 px-2 py-1">{`{ rating: "down" }`}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between px-1 text-[14px]">
              <span className="font-medium text-ink">New on {BRAND}, <span className="font-normal text-ink-soft">Nov 13</span></span>
              <Link href="/c/floating-command-island/" onClick={onClose} className="flex items-center gap-1 text-[13px] text-dim hover:text-ink">Open <ArrowRight className="size-3.5" /></Link>
            </div>
            <div className="mt-2 flex items-center gap-2 px-1 text-[13px] text-ink">
              <span className="size-4 rounded bg-gradient-to-br from-amber-300 to-rose-500" /> Message Feedback <span className="text-dim">@nova</span><span className="ml-auto text-dim">4</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-5 p-2">
          {PRODUCTS.map((p) => (
            <Link key={p.title} href={p.href} onClick={onClose} className="group block">
              <div className="h-[276px] overflow-hidden rounded-xl bg-white/[0.04] transition-colors group-hover:bg-white/[0.06]"><ProductArt art={p.art} /></div>
              <p className="mt-4 px-1.5 text-[15px] font-semibold text-ink">{p.title}</p>
              <p className="mt-1 px-1.5 text-[13px] text-dim">{p.sub}</p>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
}

const noop = () => () => {};

/** Full-screen phone menu: a disclosure panel (aria-expanded), not a modal. */
function MobileMenu() {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(noop, () => true, () => false); // hydration-safe portal gate
  const close = () => setOpen(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);
  const row = "flex h-11 items-center justify-between text-[16px] text-ink";
  return (
    <>
      <button type="button" aria-label="Open the menu" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)} className="flex size-9 items-center justify-center text-ink">
        <Menu className="size-5" />
      </button>
      {/* Portal: the header's backdrop-blur would otherwise trap position:fixed inside it. */}
      {mounted && createPortal(<AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-[60] flex h-dvh flex-col bg-page"
          >
            <div className="flex h-14 shrink-0 items-center justify-between px-4">
              <Logo />
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Search" onClick={() => { close(); openCommandMenu(); }} className="flex size-9 items-center justify-center text-dim"><Search className="size-4" /></button>
                <Button size="sm" className="h-8 rounded-[10px] px-3 text-[13px]" render={<Link href="/pricing/" onClick={close} />} nativeButton={false}>Get {BRAND} free</Button>
                <button type="button" aria-label="Close the menu" onClick={close} className="flex size-9 items-center justify-center text-ink"><X className="size-5" /></button>
              </div>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto px-5 pt-4">
              <button type="button" onClick={() => { close(); openCommandMenu(); }} className="flex h-12 shrink-0 items-center gap-3 rounded-xl bg-white/[0.05] px-4 text-left text-[15px] text-dim">
                <Search className="size-4" /> Search 12,000+ components
              </button>
              <div className="mt-8 flex flex-col gap-3">
                {SECTIONS.map((s) => (
                  <Link key={s.label} href={LIB} onClick={close} className="text-[28px] font-semibold tracking-[-0.03em] text-ink">
                    {s.label} <span className="ml-1 align-middle text-[13px] font-normal tracking-normal text-dim">{s.count}</span>
                  </Link>
                ))}
              </div>
              <div className="mt-10 flex flex-col">
                {PRODUCTS.slice(1).map((p) => <Link key={p.title} href={p.href} onClick={close} className={row}>{p.title} <ArrowRight className="size-4 text-dim" /></Link>)}
                <Link href="/" onClick={close} className={row}>How it works <ArrowRight className="size-4 text-dim" /></Link>
                <Link href="/pricing/" onClick={close} className={row}>Pricing</Link>
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-2 p-4">
              <Link href="/pricing/" onClick={close} className="flex h-10 items-center justify-center rounded-[10px] bg-white/[0.07] text-[15px] font-medium text-ink">Log in</Link>
              <Link href="/pricing/" onClick={close} className="flex h-10 items-center justify-center rounded-[10px] bg-brand text-[15px] font-medium text-white">Get {BRAND} free</Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>, document.body)}
    </>
  );
}

export function Header() {
  const [menu, setMenu] = useState<MenuId>(null);
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => setMenu(null), [pathname]);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setMenu(null);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [menu]);

  const hold = (id: MenuId) => {
    window.clearTimeout(closeTimer.current);
    setMenu(id);
  };
  const release = () => {
    closeTimer.current = window.setTimeout(() => setMenu(null), 160);
  };

  const trigger = (id: Exclude<MenuId, null>, label: string) => (
    <button
      type="button"
      aria-expanded={menu === id}
      onClick={() => setMenu(menu === id ? null : id)}
      onPointerEnter={(e) => e.pointerType === "mouse" && hold(id)}
      onPointerLeave={release}
      className={cn("flex h-9 items-center gap-1 px-3 text-[14px] font-medium transition-colors hover:text-ink", menu === id ? "text-ink" : "text-dim")}
    >
      {label}
      <ChevronDown className={cn("size-3 transition-transform", menu === id && "rotate-180")} />
    </button>
  );

  return (
    <header ref={ref} className="sticky inset-x-0 top-0 z-50 h-14 bg-gradient-to-b from-page/80 to-page/40 backdrop-blur-md">
      <div className="mx-auto h-full max-w-6xl"><div className="site-col flex h-full items-center">
        <Logo className="mr-[52px]" />
        <nav className="hidden items-center lg:flex" aria-label="Main">
          {trigger("library", "Library")}
          {trigger("product", "Product")}
          <Link href="/pricing/" className={cn("flex h-9 items-center px-3 text-[14px] font-medium transition-colors hover:text-ink", pathname.startsWith("/pricing") ? "text-ink" : "text-dim")}>
            Pricing
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-1 md:gap-2">
          <button type="button" onClick={openCommandMenu} className="hidden h-9 items-center gap-2 px-3 text-[14px] text-dim transition-colors hover:text-ink md:flex">
            <Search className="size-4" /> Search <kbd className="rounded-md bg-white/[0.08] px-1.5 py-0.5 font-sans text-[12px]">⌘K</kbd>
          </button>
          <button type="button" aria-label="Search" onClick={openCommandMenu} className="flex size-9 items-center justify-center text-dim md:hidden">
            <Search className="size-4" />
          </button>
          <Link href="/pricing/" className="hidden h-9 items-center px-3 text-[14px] font-medium text-dim transition-colors hover:text-ink md:flex">Log in</Link>
          <Button className="h-8 rounded-[8px] px-3 text-[13px] font-medium" render={<Link href="/pricing/" />} nativeButton={false}>
            Get {BRAND} free
          </Button>
          <div className="lg:hidden"><MobileMenu /></div>
        </div>
      </div></div>
      <div onPointerEnter={() => menu && hold(menu)} onPointerLeave={release}>
        <AnimatePresence>{menu && <MegaPanel key={menu} id={menu} onClose={() => setMenu(null)} />}</AnimatePresence>
      </div>
    </header>
  );
}
