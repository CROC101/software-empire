"use client";

import { cn } from "@empire/ui";
import { CornerDownLeft, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { rank, sortEntries } from "@/lib/library";
import { categories, kinds, kindOf, registry } from "@/registry/meta";

/** Ctrl/⌘K anywhere: type to find a part, arrows to move, Enter to open. A native <dialog> keeps focus and Esc. */
export function CommandPalette() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);

  const hits = useMemo(
    () =>
      // popular first, then a stable sort by fuzzy score keeps popular order among ties
      sortEntries(registry, "popular")
        .map((e) => ({ e, r: rank(e, q) }))
        .filter((x) => x.r > 0)
        .sort((a, b) => b.r - a.r)
        .slice(0, 30)
        .map((x) => x.e),
    [q],
  );

  const open = () => {
    setQ("");
    setAt(0);
    dialog.current?.showModal();
    input.current?.focus();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const go = (slug: string) => {
    // full load on purpose: Next 16 export writes /c/<slug> RSC payloads where client navigation does not look (404)
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/c/${slug}`);
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="ml-auto flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Search aria-hidden className="size-4" />
        <span className="hidden sm:inline">ค้นหาชิ้นส่วน</span>
        <kbd className="hidden rounded border px-1.5 font-mono text-[10px] sm:inline">Ctrl K</kbd>
      </button>
      <dialog
        ref={dialog}
        aria-label="ค้นหาชิ้นส่วน"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="mx-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-popover p-0 text-popover-foreground shadow-lg backdrop:bg-(--em-ink-975)/60"
      >
        <label className="flex items-center gap-2 border-b px-4 py-3">
          <Search aria-hidden className="size-4 text-muted-foreground" />
          <span className="sr-only">คำค้น</span>
          <input
            ref={input}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={hits[at] ? `pal-${hits[at].slug}` : undefined}
            value={q}
            maxLength={60}
            onChange={(e) => {
              setQ(e.target.value);
              setAt(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setAt((i) => Math.min(i + 1, hits.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setAt((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && hits[at]) {
                go(hits[at].slug);
              }
            }}
            placeholder="พิมพ์ชื่อ หมวด หรือลูกเล่น"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border px-1.5 font-mono text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </label>
        <ul
          id="palette-list"
          role="listbox"
          aria-label="ผลค้นหา"
          className="max-h-[50vh] overflow-y-auto p-2"
        >
          {hits.map((e, i) => (
            <li
              key={e.slug}
              id={`pal-${e.slug}`}
              role="option"
              aria-selected={i === at}
              onMouseMove={() => {
                setAt(i);
              }}
              onClick={() => {
                go(e.slug);
              }}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2",
                i === at && "bg-muted",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{e.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {kinds[kindOf(e)]} · {categories[e.category].label}
                </span>
              </span>
              {i === at && <CornerDownLeft aria-hidden className="size-4 text-muted-foreground" />}
            </li>
          ))}
          {!hits.length && (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">ไม่พบ</li>
          )}
        </ul>
      </dialog>
    </>
  );
}
