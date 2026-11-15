import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Clock, CornerDownLeft, Search, X } from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "@empire/ui";
import { readLang } from "@empire/core/lang";
import { catalog, findEntry, KIND_LABEL, type Entry } from "@/lib/catalog";
import { rank } from "@/lib/fuzzy";
import { readHistory } from "@/lib/history";

type Kind = "all" | Entry["kind"];
const KINDS: Kind[] = ["all", "tool", "app", "craft", "page"];
const ALL = { th: "ทั้งหมด", en: "All" };

/** Typing in a field: "/" belongs to the field, not to the palette. */
const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/**
 * Ctrl+K / ⌘K / "/" search over every tool, app, craft app and page. A miss shows the closest
 * names ("did you mean") instead of an empty list; an empty query shows this browser's history.
 */
export function CommandPalette() {
  const lang = readLang(document.cookie);
  const entries = useMemo(() => catalog(lang), [lang]);
  const ref = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  const open = () => {
    setQuery("");
    setActive(0);
    ref.current?.showModal();
    input.current?.focus();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (ref.current?.open) ref.current.close();
        else open();
      } else if (e.key === "/" && !typing(e.target) && !ref.current?.open) {
        e.preventDefault();
        open();
      }
    };
    const onOpen = () => open();
    document.addEventListener("keydown", onKey);
    document.addEventListener("crocwork:search", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("crocwork:search", onOpen);
    };
  }, []);

  const pool = kind === "all" ? entries : entries.filter((e) => e.kind === kind);
  const { hits, exact, recent } = useMemo(() => {
    if (query.trim()) return { ...rank(pool, query, 40), recent: false };
    const seen = [...new Set(readHistory().map((v) => v.id))]
      .map((id) => findEntry(pool, id))
      .filter((e): e is Entry => !!e);
    return {
      hits: seen.length ? seen.slice(0, 8) : pool.slice(0, 8),
      exact: true,
      recent: !!seen.length,
    };
  }, [pool, query]);
  const current = Math.min(active, Math.max(hits.length - 1, 0));

  const go = (e: Entry) => {
    ref.current?.close();
    // /apps and /craft are separate builds: they need a full page load
    if (e.full) location.assign(e.href);
    else void navigate(e.href);
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (step) {
      e.preventDefault();
      const next = (current + step + hits.length) % Math.max(hits.length, 1);
      setActive(next);
      list.current?.children[next]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && hits[current]) {
      e.preventDefault();
      go(hits[current]);
    }
  };

  const th = lang === "th";
  return (
    <dialog
      ref={ref}
      aria-label={th ? "ค้นหาเครื่องมือและแอป" : "Search tools and apps"}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      className="vt-top m-auto mt-[12vh] w-[min(640px,calc(100vw-32px))] overflow-hidden rounded-xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-foreground/30 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search aria-hidden className="size-5 shrink-0 text-muted-foreground" />
        <input
          ref={input}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={hits[current] ? `pal-${hits[current].id}` : undefined}
          placeholder={th ? "ค้นหา เช่น บีบอัดรูป, qr, pdf…" : "Search, e.g. compress, qr, pdf…"}
          className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label={th ? "ปิด" : "Close"}
          className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <div
        role="group"
        aria-label={th ? "ประเภท" : "Kind"}
        className="flex gap-1.5 overflow-x-auto px-4 py-2.5"
      >
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k);
              setActive(0);
              input.current?.focus();
            }}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs",
              kind === k
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {k === "all" ? ALL[lang] : KIND_LABEL[k][lang]}
          </button>
        ))}
      </div>
      <p className="px-4 pb-1 text-xs text-muted-foreground">
        {recent ? (
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden className="size-3" />
            {th ? "ล่าสุด" : "Recent"}
          </span>
        ) : !exact ? (
          th ? (
            `ไม่พบ "${query}" — ใกล้เคียงที่สุด`
          ) : (
            `No match for "${query}" — closest`
          )
        ) : query.trim() ? (
          `${hits.length} ${th ? "รายการ" : "results"}`
        ) : th ? (
          "แนะนำ"
        ) : (
          "Suggested"
        )}
      </p>
      <ul
        id="palette-list"
        ref={list}
        role="listbox"
        className="max-h-[50vh] overflow-y-auto px-2 pb-2"
      >
        {hits.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">
            {th ? "ไม่พบอะไรที่ใกล้เคียง ลองคำอื่น" : "Nothing close. Try another word."}
          </li>
        )}
        {hits.map((e, i) => (
          <li
            key={e.id}
            id={`pal-${e.id}`}
            role="option"
            aria-selected={i === current}
            onMouseMove={() => setActive(i)}
            onClick={() => go(e)}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5",
              i === current && "bg-muted",
            )}
          >
            <e.icon aria-hidden className="size-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate">{e.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{e.group}</span>
            {i === current && (
              <CornerDownLeft aria-hidden className="size-3.5 text-muted-foreground" />
            )}
          </li>
        ))}
      </ul>
      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        ↑↓ {th ? "เลือก" : "move"} · Enter {th ? "เปิด" : "open"} · Esc {th ? "ปิด" : "close"} ·
        Ctrl K
      </p>
    </dialog>
  );
}

/** Header button: the palette listens for this event so the two stay decoupled. */
export const openSearch = () => document.dispatchEvent(new Event("crocwork:search"));
