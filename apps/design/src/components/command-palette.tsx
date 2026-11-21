"use client";

import { cn } from "@empire/ui";
import { CornerDownLeft, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GROUPS, searchAll, thaiHits, type Group, type Hit } from "@/lib/everything";
import { parseIndex } from "@/lib/thai-fonts";
import { RescueNote } from "./rescue-note";

const groups = Object.entries(GROUPS) as [Group, string][];

/**
 * Ctrl/⌘K anywhere: one search over parts, Thai and Latin fonts, React Bits and app templates, with
 * chips to keep one kind. Arrows move, Enter opens. A native <dialog> keeps focus and Esc.
 */
export function CommandPalette() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const [group, setGroup] = useState<Group | "">("");
  const [thai, setThai] = useState<Hit[] | null>(null);
  const loading = useRef(false);

  const { items: hits, rescue } = useMemo(() => searchAll(q, group, thai ?? []), [q, group, thai]);

  const open = () => {
    setQ("");
    setAt(0);
    setGroup("");
    dialog.current?.showModal();
    input.current?.focus();
    // the Thai index is ~1 MB: fetch it the first time the palette opens, not with every page
    if (!loading.current) {
      loading.current = true;
      fetch("/data/f0nt.json")
        .then((r) => (r.ok ? r.json() : null))
        .then((raw: unknown) => {
          const index = raw ? parseIndex(raw) : null;
          if (index) setThai(thaiHits(index));
          else loading.current = false;
        })
        .catch(() => {
          loading.current = false;
        });
    }
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

  const go = (href: string) => {
    // full load on purpose: Next 16 export writes /c/<slug> RSC payloads where client navigation does not look (404)
    window.location.assign(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="ml-auto flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Search aria-hidden className="size-4" />
        <span className="hidden sm:inline">ค้นหาทั้งเว็บ</span>
        <kbd className="hidden rounded border px-1.5 font-mono text-[10px] sm:inline">Ctrl K</kbd>
      </button>
      <dialog
        ref={dialog}
        aria-label="ค้นหาทั้งเว็บ"
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
            aria-activedescendant={hits[at] ? `pal-${at}` : undefined}
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
                go(hits[at].href);
              }
            }}
            placeholder="ชิ้นส่วน ฟอนต์ React Bits หรือแอป"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border px-1.5 font-mono text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </label>
        <div
          role="group"
          aria-label="ชนิด"
          className="flex gap-1.5 overflow-x-auto border-b px-3 py-2 [scrollbar-width:none]"
        >
          {[["", "ทั้งหมด"] as const, ...groups].map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={group === k}
              onClick={() => {
                setGroup(k);
                setAt(0);
                input.current?.focus();
              }}
              className="shrink-0 rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-muted aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"
            >
              {label}
            </button>
          ))}
        </div>
        {rescue && (
          <div className="px-3 pt-2">
            <RescueNote rescue={rescue} q={q} />
          </div>
        )}
        {group === "thai" && !thai && (
          <p className="px-4 pt-3 text-sm text-muted-foreground">กำลังโหลดรายชื่อฟอนต์ไทย</p>
        )}
        <ul
          id="palette-list"
          role="listbox"
          aria-label="ผลค้นหา"
          className="max-h-[50vh] overflow-y-auto p-2"
        >
          {hits.map((e, i) => (
            <li
              key={e.key}
              id={`pal-${i}`}
              role="option"
              aria-selected={i === at}
              onMouseMove={() => {
                setAt(i);
              }}
              onClick={() => {
                go(e.href);
              }}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2",
                i === at && "bg-muted",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{e.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{e.sub}</span>
              </span>
              {i === at && <CornerDownLeft aria-hidden className="size-4 text-muted-foreground" />}
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
