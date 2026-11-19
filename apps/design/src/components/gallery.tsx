"use client";

import { cn } from "@empire/ui";
import { ArrowUpRight, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { categories, defaults, type Category, type Entry } from "@/registry/meta";
import { Part } from "@/registry/parts";
import { InView } from "./in-view";

/** Search + category chips + a grid of live previews. "/" or Ctrl/⌘K jumps to the search. */
export function Gallery({ entries }: { entries: readonly Entry[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, select");
      if ((e.key === "/" && !typing) || (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (cat === "all" || e.category === cat) &&
        (!q || [e.name, e.summary, ...e.blend].some((s) => s.toLowerCase().includes(q))),
    );
  }, [entries, query, cat]);

  const chip = (value: Category | "all", label: string) => (
    <button
      key={value}
      type="button"
      aria-pressed={cat === value}
      onClick={() => setCat(value)}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring",
        cat === value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
      )}
    >
      {label}
    </button>
  );

  return (
    <section id="parts" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <label className="flex w-full items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-ring md:max-w-sm">
          <Search aria-hidden className="size-4 text-muted-foreground" />
          <span className="sr-only">ค้นหาคอมโพเนนต์</span>
          <input
            ref={input}
            type="search"
            value={query}
            maxLength={60}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา เช่น text, card, แสง"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border px-1.5 font-mono text-[10px] text-muted-foreground sm:inline">
            /
          </kbd>
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="หมวด">
          {chip("all", "ทั้งหมด")}
          {(Object.keys(categories) as Category[]).map((c) => chip(c, categories[c]))}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {shown.length} ชิ้น
      </p>

      <ul className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((e) => (
          <li
            key={e.slug}
            className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-transform hover:-translate-y-0.5"
          >
            <InView className="relative h-56 overflow-hidden bg-(--em-ink-975) [&>*]:h-full">
              <Part slug={e.slug} values={defaults(e)} />
            </InView>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-3">
                {/* plain <a>: Next 16 export writes /c/<slug> RSC payloads where Link prefetch does not look (404) */}
                <h2 className="font-heading text-lg font-bold">
                  <a
                    href={`/c/${e.slug}`}
                    className="focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {e.name}
                  </a>
                </h2>
                <a
                  href={`/c/${e.slug}`}
                  aria-label={`เปิด ${e.name}`}
                  className="rounded-md border p-1.5 text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary"
                >
                  <ArrowUpRight aria-hidden className="size-4" />
                </a>
              </div>
              <p className="text-sm text-muted-foreground">{e.summary}</p>
              <ul className="mt-auto flex flex-wrap gap-1.5 pt-2" aria-label="ผสมจาก">
                {e.blend.map((b) => (
                  <li
                    key={b}
                    className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
      {!shown.length && (
        <p className="py-16 text-center text-muted-foreground">ไม่พบชิ้นที่ตรงกับคำค้น</p>
      )}
    </section>
  );
}
