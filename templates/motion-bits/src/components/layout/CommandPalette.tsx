"use client";

import { useRouter } from "next/navigation";
import { CornerDownLeft, FileText, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { registry } from "@/data/registry";
import { cn } from "@/lib/utils";

const OPEN_EVENT = "motion-bits:open-palette";
export const openCommandPalette = () => window.dispatchEvent(new Event(OPEN_EVENT));

const PAGES = [
  { href: "/", label: "Home" },
  { href: "/components/", label: "All components" },
  { href: "/get-started/introduction/", label: "Docs: Introduction" },
  { href: "/tools/", label: "Tools" },
  { href: "/pro/", label: "Pro" },
  { href: "/sponsors/", label: "Sponsors" },
  { href: "/favorites/", label: "Favorites" },
  { href: "/about/", label: "About & shortcuts" },
];

type Entry = { href: string; label: string; hint: string; kind: "component" | "page" };

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  const entries = useMemo<Entry[]>(() => {
    const q = query.trim().toLowerCase();
    const comps: Entry[] = registry.map((r) => ({ href: `/components/${r.slug}/`, label: r.name, hint: r.category, kind: "component" }));
    const pages: Entry[] = PAGES.map((p) => ({ ...p, hint: "Page", kind: "page" }));
    const all = [...comps, ...pages];
    return q ? all.filter((e) => `${e.label} ${e.hint}`.toLowerCase().includes(q)) : all;
  }, [query]);

  useEffect(() => setIndex(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
  }, [index]);

  const go = (e?: Entry) => {
    if (!e) return;
    setOpen(false);
    setQuery("");
    router.push(e.href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[18%] max-w-[560px] translate-y-0 gap-0 overflow-hidden rounded-2xl border border-white/10 bg-[#16131b] p-0 sm:max-w-[560px]"
      >
        <DialogTitle className="sr-only">Search components</DialogTitle>
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-4">
          <Search className="size-4 text-white/40" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(i + 1, entries.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(entries[index]);
              }
            }}
            placeholder="Search components and pages..."
            className="h-12 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/35"
            aria-label="Search"
            role="combobox"
            aria-expanded
            aria-controls="palette-list"
            aria-activedescendant={`palette-${index}`}
          />
          <kbd className="rounded bg-white/10 px-1.5 font-mono text-[11px] text-white/50">ESC</kbd>
        </div>
        <ul id="palette-list" ref={listRef} role="listbox" className="max-h-[340px] overflow-y-auto p-2">
          {entries.length === 0 && <li className="px-3 py-8 text-center text-sm text-white/40">No results for “{query}”</li>}
          {entries.map((e, i) => (
            <li
              key={e.href}
              id={`palette-${i}`}
              data-index={i}
              role="option"
              aria-selected={i === index}
              onMouseMove={() => setIndex(i)}
              onClick={() => go(e)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[14px]",
                i === index ? "bg-white/[0.07] text-white" : "text-white/70",
              )}
            >
              {e.kind === "component" ? <Sparkles className="size-4 text-violet" /> : <FileText className="size-4 text-white/40" />}
              <span className="flex-1">{e.label}</span>
              <span className="text-xs text-white/35">{e.hint}</span>
              {i === index && <CornerDownLeft className="size-3.5 text-white/40" />}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
