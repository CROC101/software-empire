"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComponentCard } from "@/components/playground/component-card";
import { CATEGORIES, COMPONENTS } from "@/data/components-registry";
import { cn } from "@/lib/utils";

const spring = { type: "spring", stiffness: 400, damping: 30 } as const;
const TABS = [["Components", "12K"], ["Templates", "362"], ["Themes", "995"], ["Apps", "138"]] as const;

export function Library() {
  const [tab, setTab] = useState<string>("Components");
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return COMPONENTS.filter((c) => (cat === "All" || c.category === cat) && (!s || `${c.name} ${c.description} ${c.category}`.toLowerCase().includes(s)));
  }, [cat, q]);

  return (
    <>
    <section className="site-col pt-12 pb-8 md:pt-16 md:pb-10">
      <h1 className="text-[13px] font-medium text-dim">Community UI Components for React &amp; Next.js</h1>
      <p className="display mt-2 text-[36px] lg:text-[58px]">The library</p>
      <p className="mt-3 max-w-[560px] text-[16px] text-dim">Real components, templates and themes from design engineers. Open any one live, tweak it, and copy it into your project.</p>
    </section>
    <div className="site-col">

      <div className="flex flex-col gap-4 border-b border-white/[0.06] md:flex-row md:items-end md:justify-between">
        <div className="-mb-px flex gap-5 overflow-x-auto [scrollbar-width:none]" role="tablist">
          {TABS.map(([t, n]) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("relative flex shrink-0 items-center gap-1.5 pb-3 text-[15px] font-medium", tab === t ? "text-ink" : "text-dim hover:text-ink-soft")}>
              {t}<span className="text-[12px] text-dim">{n}</span>
              {tab === t && <motion.span layoutId="lib-tab" transition={spring} className="absolute inset-x-0 -bottom-px h-0.5 bg-ink" />}
            </button>
          ))}
        </div>
        <label className="mb-3 flex h-9 w-full items-center gap-2 rounded-[10px] bg-white/[0.05] px-3 text-[14px] md:w-[280px]">
          <Search className="size-4 text-dim" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search components" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-dim" />
          <kbd className="text-[11px] text-dim">⌘K</kbd>
        </label>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {CATEGORIES.map((c) => {
          const n = c === "All" ? COMPONENTS.length : COMPONENTS.filter((x) => x.category === c).length;
          return (
            <button key={c} type="button" onClick={() => setCat(c)} className={cn("relative h-8 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition-colors", cat === c ? "text-black" : "bg-white/[0.05] text-ink-soft hover:bg-white/10")}>
              {cat === c && <motion.span layoutId="lib-pill" transition={spring} className="absolute inset-0 -z-0 rounded-full bg-white" />}
              <span className="relative">{c} <span className="opacity-50">{n}</span></span>
            </button>
          );
        })}
      </div>

      <h2 className="mt-6 text-[16px] font-medium">Browse components</h2>
      {tab === "Components" ? (
        list.length ? (
          <motion.div layout className="mt-4 grid grid-cols-1 gap-x-3 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((c, i) => <motion.div layout key={c.slug} className={cn(!q && cat === "All" && [i >= 3 && "max-sm:hidden", i >= 8 && "max-lg:hidden"])} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring}><ComponentCard c={c} /></motion.div>)}
          </motion.div>
        ) : (
          <p className="mt-16 text-center text-[15px] text-dim">Nothing matches “{q}”. Try another word or category.</p>
        )
      ) : (
        <p className="mt-16 text-center text-[15px] text-dim">{tab} arrive with the full catalogue. Browse components for now.</p>
      )}

      <div className="relative mt-10 rounded-[20px] bg-[linear-gradient(180deg,transparent,#0d0d0e_40%)] px-6 pt-16 pb-14 text-center">
        <p className="text-[24px] font-semibold tracking-[-0.03em]">Keep browsing with a free account</p>
        <p className="mt-2 text-[15px] text-dim">See all 12K components, save bookmarks, and copy two a day for free.</p>
        <div className="mt-6 flex justify-center gap-2.5">
          <Button className="h-10 rounded-[10px] px-4" render={<Link href="/pricing/" />} nativeButton={false}>Get free</Button>
          <Button variant="secondary" className="h-10 rounded-[10px] bg-chip px-4 text-ink" render={<Link href="/pricing/" />} nativeButton={false}>See plans</Button>
        </div>
      </div>
    </div>
    </>
  );
}
