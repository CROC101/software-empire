import { Search } from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect, useId, useRef, useState } from "react";
import { categoryOf } from "@/lib/tools/categories";
import { searchTools, toolHref, TOOLS } from "@/lib/tools/registry";

/// ช่องค้นหาเครื่องมือแบบ combobox — พิมพ์แล้วเลือกด้วยลูกศร/Enter · กด / หรือ Ctrl+K เพื่อโฟกัส
export function ToolSearch({
  autoFocus = false,
  size = "lg",
}: {
  autoFocus?: boolean;
  size?: "lg" | "md";
}) {
  const navigate = useNavigate();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = query.trim() ? searchTools(query).slice(0, 8) : [];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest('input, textarea, select, [contenteditable="true"]');

      if (
        (event.key === "k" && (event.ctrlKey || event.metaKey)) ||
        (event.key === "/" && !typing)
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKey);

    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (index: number) => {
    const tool = results[index];

    if (tool) void navigate(toolHref(tool));
    else if (query.trim()) void navigate(`/tools?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  };

  return (
    <div className="relative w-full" role="search">
      <label htmlFor={`${id}-input`} className="sr-only">
        ค้นหาเครื่องมือ
      </label>
      <Search
        aria-hidden
        className={`pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant ${size === "lg" ? "size-5" : "size-4"}`}
      />
      <input
        ref={inputRef}
        id={`${id}-input`}
        type="search"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={`${id}-list`}
        aria-activedescendant={open && results[active] ? `${id}-opt-${active}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        autoFocus={autoFocus}
        value={query}
        placeholder={`ค้นหาเครื่องมือ ${TOOLS.length} ชิ้น เช่น json, qr, เกรด, ภาษี…`}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            go(active);
          } else if (e.key === "Escape") setOpen(false);
        }}
        className={`w-full rounded-2xl border border-outline-variant bg-surface-container-lowest pr-16 text-on-surface shadow-sm outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/15 ${size === "lg" ? "h-14 pl-12 text-lg" : "h-11 pl-10 text-base"}`}
      />
      <kbd className="pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 rounded-md border border-outline-variant px-1.5 text-sm text-on-surface-variant sm:block">
        /
      </kbd>

      {open && results.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label="ผลการค้นหา"
          className="soft-shadow absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest py-1"
        >
          {results.map((tool, index) => (
            <li
              key={tool.slug}
              id={`${id}-opt-${index}`}
              role="option"
              aria-selected={index === active}
              onPointerDown={(e) => {
                e.preventDefault();
                go(index);
              }}
              onPointerEnter={() => setActive(index)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${index === active ? "bg-primary-fixed" : ""}`}
            >
              <tool.icon aria-hidden className="size-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate">{tool.name}</span>
              <span className="shrink-0 text-sm text-on-surface-variant">
                {categoryOf(tool.category).label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
