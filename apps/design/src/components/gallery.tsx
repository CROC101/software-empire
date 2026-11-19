"use client";

import { cn } from "@empire/ui";
import { ArrowUpRight, Flame, Heart, LayoutGrid, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { filterEntries, isHot, isNew, sorts, type Sort } from "@/lib/library";
import { categories, kindOf, kinds, type Category, type Entry, type Kind } from "@/registry/meta";
import { InView } from "./in-view";
import { useFavs, useView } from "./library-state";
import { Thumb } from "./preview";

const kindList = Object.keys(kinds) as Kind[];
const catList = Object.keys(categories) as Category[];

/**
 * The library: kinds and categories in a sidebar (a scrolling chip row on phones), search, sort by
 * popular / new / A–Z, favourites, and a grid of live previews. The whole view lives in the URL
 * hash, so a filtered list can be shared and the back button keeps it.
 */
export function Gallery({ entries }: { entries: readonly Entry[] }) {
  const [view, setView] = useView();
  const [favs, toggleFav] = useFavs();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLElement &&
        e.target.closest("input, textarea, select, [contenteditable]");
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const shown = useMemo(() => filterEntries(entries, view, favs), [entries, view, favs]);
  const count = (pred: (e: Entry) => boolean) => entries.filter(pred).length;

  const navItem = (
    active: boolean,
    label: string,
    n: number,
    onClick: () => void,
    icon?: React.ReactNode,
  ) => (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring",
        active
          ? "bg-primary/10 font-semibold text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="font-mono text-[11px] tabular-nums">{n}</span>
    </button>
  );

  const chip = (active: boolean, label: string, onClick: () => void) => (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-ring",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
      )}
    >
      {label}
    </button>
  );

  const heading =
    view.cat !== "all"
      ? categories[view.cat].label
      : view.kind !== "all"
        ? kinds[view.kind]
        : view.fav
          ? "ที่ชอบ"
          : "ทั้งหมด";

  return (
    <section
      id="parts"
      className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[14rem_1fr]"
    >
      <aside aria-label="หมวด" className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100dvh-6rem)] space-y-5 overflow-y-auto pr-1 pb-6 [scrollbar-width:thin]">
          <div className="space-y-0.5">
            {navItem(
              view.kind === "all" && !view.fav,
              "ทั้งหมด",
              entries.length,
              () => {
                setView({ kind: "all", cat: "all", fav: false });
              },
              <LayoutGrid aria-hidden className="size-4" />,
            )}
            {navItem(
              view.fav,
              "ที่ชอบ",
              favs.size,
              () => {
                setView({ fav: !view.fav });
              },
              <Heart aria-hidden className="size-4" />,
            )}
          </div>
          {kindList.map((k) => (
            <div key={k}>
              <button
                type="button"
                aria-pressed={view.kind === k && view.cat === "all"}
                onClick={() => {
                  setView({ kind: k, cat: "all" });
                }}
                className="mb-1 flex w-full items-center justify-between px-3 text-xs font-semibold tracking-wide text-foreground hover:text-primary aria-pressed:text-primary"
              >
                {kinds[k]}
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  {count((e) => kindOf(e) === k)}
                </span>
              </button>
              <div className="space-y-0.5">
                {catList
                  .filter((c) => categories[c].kind === k)
                  .map((c) => (
                    <div key={c}>
                      {navItem(
                        view.cat === c,
                        categories[c].label,
                        count((e) => e.category === c),
                        () => {
                          setView({ cat: c, kind: k });
                        },
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <span className="sr-only">ค้นหาชิ้นส่วน</span>
            <input
              id="gallery-search"
              ref={input}
              type="search"
              value={view.q}
              maxLength={60}
              onChange={(e) => {
                setView({ q: e.target.value });
              }}
              placeholder="ค้นหา เช่น ปุ่ม, glow, pricing, ราคา"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            />
            {view.q ? (
              <button
                type="button"
                aria-label="ล้างคำค้น"
                onClick={() => {
                  setView({ q: "" });
                }}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X aria-hidden className="size-4" />
              </button>
            ) : (
              <kbd className="hidden rounded border px-1.5 font-mono text-[10px] text-muted-foreground sm:inline">
                /
              </kbd>
            )}
          </label>
          <div
            role="radiogroup"
            aria-label="เรียงตาม"
            className="flex shrink-0 rounded-lg border bg-muted p-1"
          >
            {(Object.keys(sorts) as Sort[]).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={view.sort === s}
                onClick={() => {
                  setView({ sort: s });
                }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded-md px-3 py-1 text-sm whitespace-nowrap transition-colors",
                  view.sort === s
                    ? "bg-background font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s === "popular" && <Flame aria-hidden className="size-3.5" />}
                {s === "new" && <Sparkles aria-hidden className="size-3.5" />}
                {sorts[s]}
              </button>
            ))}
          </div>
        </div>

        <div
          className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden"
          role="group"
          aria-label="ชนิด"
        >
          {chip(view.kind === "all" && !view.fav, "ทั้งหมด", () => {
            setView({ kind: "all", cat: "all", fav: false });
          })}
          {kindList.map((k) => (
            <span key={k} className="contents">
              {chip(view.kind === k && view.cat === "all", kinds[k], () => {
                setView({ kind: k, cat: "all" });
              })}
            </span>
          ))}
          {chip(view.fav, `ที่ชอบ ${String(favs.size)}`, () => {
            setView({ fav: !view.fav });
          })}
        </div>
        <div
          className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden"
          role="group"
          aria-label="หมวด"
        >
          {catList
            .filter((c) => view.kind === "all" || categories[c].kind === view.kind)
            .map((c) => (
              <span key={c} className="contents">
                {chip(view.cat === c, categories[c].label, () => {
                  setView(view.cat === c ? { cat: "all" } : { cat: c, kind: categories[c].kind });
                })}
              </span>
            ))}
        </div>

        <div className="mt-6 flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-2xl font-black">{heading}</h2>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {shown.length} ชิ้น
          </p>
        </div>

        <ul className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((e) => {
            const fav = favs.has(e.slug);
            return (
              <li
                key={e.slug}
                className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <InView className="relative aspect-[16/10] overflow-hidden border-b">
                  <Thumb entry={e} />
                </InView>
                <div className="pointer-events-none absolute top-2 left-2 flex gap-1">
                  {isHot(e) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-(--em-coral-500) px-2 py-0.5 text-[11px] font-semibold text-(--em-ink-0)">
                      <Flame aria-hidden className="size-3" />
                      ฮิต
                    </span>
                  )}
                  {isNew(e) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-(--em-sky-500) px-2 py-0.5 text-[11px] font-semibold text-(--em-ink-975)">
                      <Sparkles aria-hidden className="size-3" />
                      ใหม่
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  aria-pressed={fav}
                  aria-label={fav ? `เอา ${e.name} ออกจากที่ชอบ` : `เก็บ ${e.name} ไว้ในที่ชอบ`}
                  onClick={() => {
                    toggleFav(e.slug);
                  }}
                  className="absolute top-2 right-2 z-10 grid size-8 place-items-center rounded-md bg-(--em-ink-975)/60 text-(--em-ink-50) backdrop-blur transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none"
                >
                  <Heart
                    aria-hidden
                    className={cn("size-4", fav && "fill-(--em-coral-400) text-(--em-coral-400)")}
                  />
                </button>
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <p className="text-xs font-semibold text-primary">
                    {categories[e.category].label}
                  </p>
                  <h3 className="flex items-start justify-between gap-3 font-heading text-lg font-bold">
                    {/* plain <a>: Next 16 export writes /c/<slug> RSC payloads where Link prefetch does not look (404) */}
                    <a
                      href={`/c/${e.slug}`}
                      className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {e.name}
                    </a>
                    <ArrowUpRight
                      aria-hidden
                      className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary motion-reduce:transition-none"
                    />
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{e.summary}</p>
                  <ul className="mt-auto flex flex-wrap gap-1.5 pt-2" aria-label="ผสมจาก">
                    {e.blend.slice(0, 3).map((b) => (
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
            );
          })}
        </ul>
        {!shown.length && (
          <div className="grid place-items-center gap-3 py-20 text-center text-muted-foreground">
            <p>
              {view.fav && !favs.size
                ? "ยังไม่มีชิ้นที่ชอบ กดหัวใจบนการ์ดเพื่อเก็บไว้"
                : "ไม่พบชิ้นที่ตรงกับคำค้น"}
            </p>
            <button
              type="button"
              onClick={() => {
                setView({ kind: "all", cat: "all", q: "", fav: false });
              }}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              ล้างตัวกรอง
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
