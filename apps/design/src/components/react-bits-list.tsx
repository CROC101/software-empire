"use client";

import { cn, NimbusNavbar, type NimbusFx } from "@empire/ui";
import {
  Component,
  LayoutGrid,
  MousePointerClick,
  Search,
  Sparkles,
  Type,
  Wallpaper,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import data from "@/lib/react-bits.json";
import { reactBitsUrl } from "@/lib/react-bits-url";
import { found, hasAll } from "@/lib/search";
import { CopyButton } from "./copy-button";
import { useNimbus, useStored } from "./library-state";
import { RescueNote } from "./rescue-note";

type Tool = "shadcn" | "jsrepo";
const slug = (s: string) => s.replace(/\s+/g, "-").toLowerCase();
// the official commands from reactbits.dev; the code comes from their registry, not ours
const command = (tool: Tool, name: string) =>
  tool === "shadcn"
    ? `npx shadcn@latest add @react-bits/${name}`
    : `npx jsrepo@latest add https://reactbits.dev/r/${name}`;

const catIcon: Record<string, [React.ReactNode, NimbusFx]> = {
  "Text Animations": [<Type key="i" aria-hidden />, "wave"],
  Animations: [<Sparkles key="i" aria-hidden />, "spin"],
  Components: [<Component key="i" aria-hidden />, "pop"],
  Micro: [<MousePointerClick key="i" aria-hidden />, "drop"],
  Backgrounds: [<Wallpaper key="i" aria-hidden />, "glow"],
};
const catNames = data.categories.map((c) => c.name);
type Item = { cat: string; title: string; component: string };
const all: Item[] = data.categories.flatMap((c) => c.items.map((it) => ({ cat: c.name, ...it })));

/** Search state in the query string (?q=&c=&ours=1), so reload, back and shared links keep it. */
function readFind(search: string) {
  const p = new URLSearchParams(search);
  const c = p.get("c") ?? "";
  return {
    q: (p.get("q") ?? "").slice(0, 60),
    c: catNames.includes(c) ? c : "",
    mine: p.get("ours") === "1",
  };
}

function Tabs<T extends string>({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1">
      {items.map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={value === t}
          onClick={() => onChange(t)}
          className={cn(
            "rounded-md px-2.5 py-1 font-mono text-xs transition-colors duration-75",
            value === t
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/**
 * Every React Bits component with its official install command, in the variant picked. "พรีวิว" opens
 * their own page in a frame (one at a time, loaded only on click), so their code stays on their site.
 * `ours` maps a React Bits title to the slug of our own rebuild of it.
 */
export function ReactBitsList({ ours = {} }: { ours?: Readonly<Record<string, string>> }) {
  // the picked variant and tool stay across reloads
  const [saved, save] = useStored("croc-rb-pick");
  const [v, t] = (saved ?? "").split("|");
  const variant = v && data.variants.includes(v) ? v : "TS-TW";
  const tool: Tool = t === "jsrepo" ? "jsrepo" : "shadcn";
  const pick = (nv: string, nt: Tool) => save(`${nv}|${nt}`);
  const [open, setOpen] = useState<string | null>(null);
  const [find, setFind] = useState({ q: "", c: "", mine: false });
  const [ready, setReady] = useState(false);
  const { phone, tone } = useNimbus();
  useEffect(() => {
    // the query string is only readable after mount (static export)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFind(readFind(location.search));
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams();
    if (find.q) p.set("q", find.q);
    if (find.c) p.set("c", find.c);
    if (find.mine) p.set("ours", "1");
    const qs = p.size ? `?${p}` : "";
    if (qs !== location.search)
      history.replaceState(history.state, "", `${location.pathname}${qs}${location.hash}`);
  }, [find, ready]);

  const text = (it: Item) => [
    it.title,
    it.component,
    it.cat,
    ours[it.title] ? "ของเรา crocwork" : "",
  ];
  const { items, rescue } = useMemo(() => {
    const pool = all.filter(
      (it) => (!find.c || it.cat === find.c) && (!find.mine || ours[it.title]),
    );
    const hits = pool.filter((it) => hasAll(find.q, text(it)));
    return found(hits, pool.length ? pool : all, find.q, text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [find, ours]);
  const sections = data.categories
    .map((c) => ({ name: c.name, items: items.filter((it) => it.cat === c.name) }))
    .filter((c) => c.items.length);
  const mineCount = all.filter((it) => ours[it.title]).length;

  return (
    <>
      <div className="vt-top sticky top-[3.6rem] z-20 -mx-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-b bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Tabs
          label="ภาษาและสไตล์"
          items={data.variants}
          value={variant}
          onChange={(v) => pick(v, tool)}
        />
        <Tabs
          label="เครื่องมือติดตั้ง"
          items={["shadcn", "jsrepo"] as const}
          value={tool}
          onChange={(t) => pick(variant, t)}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 basis-60">
          <span className="sr-only">ค้นหาใน React Bits</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={find.q}
            onChange={(e) => setFind((f) => ({ ...f, q: e.target.value.slice(0, 60) }))}
            placeholder="ชื่อชิ้น เช่น aurora, glitch, dock"
            className="h-10 w-full rounded-md border bg-background pr-3 pl-9 text-sm outline-none focus-visible:border-ring"
          />
        </label>
        <button
          type="button"
          aria-pressed={find.mine}
          onClick={() => setFind((f) => ({ ...f, mine: !f.mine }))}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors hover:bg-muted aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"
        >
          มีของเรา <span className="text-xs opacity-60 tabular-nums">{mineCount}</span>
        </button>
        <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {items.length} ชิ้น
        </p>
      </div>
      <div className="-mx-4 mt-2 overflow-x-auto px-4 py-3.5 [scrollbar-width:none]">
        <div className="mx-auto w-max">
          <NimbusNavbar
            label="หมวด React Bits"
            items={[
              { label: "ทั้งหมด", icon: <LayoutGrid aria-hidden />, fx: "drop" },
              ...data.categories.map((c) => {
                const [icon, fx] = catIcon[c.name] ?? [
                  <LayoutGrid key="i" aria-hidden />,
                  "wave" as const,
                ];
                return { label: c.name, icon, fx };
              }),
            ]}
            active={find.c ? catNames.indexOf(find.c) + 1 : 0}
            compact={phone}
            tone={tone}
            onChange={(i) => setFind((f) => ({ ...f, c: catNames[i - 1] ?? "" }))}
          />
        </div>
      </div>
      {rescue && (
        <div className="mt-2">
          <RescueNote rescue={rescue} q={find.q} />
        </div>
      )}
      {sections.map((c) => (
        <section key={c.name} aria-labelledby={slug(c.name)} className="mt-10">
          <h2 id={slug(c.name)} className="font-heading text-2xl font-black">
            {c.name}{" "}
            <span className="font-mono text-sm font-normal text-muted-foreground">
              {c.items.length}
            </span>
          </h2>
          <ul className="mt-4 divide-y border-y">
            {c.items.map((it) => {
              const cmd = command(tool, `${it.component}-${variant}`);
              const url = reactBitsUrl(c.name, it.title);
              const mine = ours[it.title];
              const shown = open === it.component;
              return (
                <li
                  key={it.component}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5"
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 font-semibold hover:text-(--em-blue-600) sm:w-44 sm:flex-none dark:hover:text-(--em-sky-400)"
                  >
                    {it.title} <span aria-hidden>↗</span>
                  </a>
                  {/* phones: the command takes its own line under the name, never cut to "npx j…" */}
                  <code className="order-last basis-full font-mono text-xs break-all text-muted-foreground sm:order-none sm:min-w-0 sm:flex-1 sm:basis-0 sm:truncate sm:break-normal">
                    {cmd}
                  </code>
                  {mine && (
                    <a
                      href={`/c/${mine}`}
                      className="rounded-md px-2 py-1 text-xs font-semibold text-(--em-blue-600) hover:bg-muted dark:text-(--em-sky-400)"
                    >
                      ของเรา
                    </a>
                  )}
                  <button
                    type="button"
                    aria-expanded={shown}
                    aria-controls={`rb-${it.component}`}
                    onClick={() => setOpen(shown ? null : it.component)}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {shown ? "ปิดพรีวิว" : "พรีวิว"}
                  </button>
                  <CopyButton text={cmd} label="คัดลอก" />
                  {shown && (
                    <iframe
                      id={`rb-${it.component}`}
                      src={url}
                      title={`${it.title} บน reactbits.dev`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      sandbox="allow-scripts allow-same-origin allow-popups"
                      className="order-last mt-2 h-[32rem] w-full basis-full rounded-lg border bg-(--em-ink-975)"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
