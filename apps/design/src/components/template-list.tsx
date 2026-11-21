"use client";

import { NimbusNavbar } from "@empire/ui";
import { Atom, LayoutGrid, Search, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { found, hasAll } from "@/lib/search";
import { templateBase, templates, templateZip, type Template } from "@/lib/templates";
import { useNimbus } from "./library-state";
import { RescueNote } from "./rescue-note";
import { TemplatePreview } from "./template-preview";

const stacks = ["Next.js", "Vite"] as const;
const text = (t: Template) => [t.name, t.slug, t.about, t.stack, t.inspired.name];

/** The app templates with a search box and a stack bar; ?q= and ?stack= keep the view on reload. */
export function TemplateList() {
  const [q, setQ] = useState("");
  const [stack, setStack] = useState("");
  const [ready, setReady] = useState(false);
  const { phone, tone } = useNimbus();
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const st = p.get("stack") ?? "";
    // the query string is only readable after mount (static export)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQ((p.get("q") ?? "").slice(0, 60));
    setStack((stacks as readonly string[]).includes(st) ? st : "");
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (stack) p.set("stack", stack);
    const qs = p.size ? `?${p}` : "";
    if (qs !== location.search)
      history.replaceState(history.state, "", `${location.pathname}${qs}${location.hash}`);
  }, [q, stack, ready]);

  const { items, rescue } = useMemo(() => {
    const pool = templates.filter((t) => !stack || t.stack === stack);
    return found(
      pool.filter((t) => hasAll(q, text(t))),
      pool.length ? pool : templates,
      q,
      text,
      4,
    );
  }, [q, stack]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 basis-60">
          <span className="sr-only">ค้นหาเทมเพลต</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value.slice(0, 60))}
            placeholder="ชื่อแอป แอปต้นแบบ หรือสิ่งที่อยากทำ เช่น เพลง วิดีโอ"
            className="h-10 w-full rounded-md border bg-background pr-3 pl-9 text-sm outline-none focus-visible:border-ring"
          />
        </label>
        <div className="-my-3.5 overflow-x-auto py-3.5 [scrollbar-width:none]">
          <NimbusNavbar
            label="สแตก"
            items={[
              { label: "ทั้งหมด", icon: <LayoutGrid aria-hidden />, fx: "drop" },
              { label: "Next.js", icon: <Atom aria-hidden />, fx: "spin" },
              { label: "Vite", icon: <Zap aria-hidden />, fx: "glow" },
            ]}
            active={stack ? stacks.indexOf(stack as (typeof stacks)[number]) + 1 : 0}
            compact={phone}
            tone={tone}
            onChange={(i) => setStack(stacks[i - 1] ?? "")}
          />
        </div>
        <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {items.length} แอป
        </p>
      </div>
      {rescue && (
        <div className="mt-4">
          <RescueNote rescue={rescue} q={q} />
        </div>
      )}
      <div className="mt-8">
        <ul className="grid gap-x-6 gap-y-12 md:grid-cols-2">
          {items.map((t) => (
            <li key={t.slug} className="flex flex-col gap-3">
              <TemplatePreview src={templateBase(t.slug)} title={`ตัวอย่าง ${t.name}`} />
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-heading text-xl font-black">{t.name}</h2>
                <span className="font-mono text-xs text-muted-foreground">{t.stack}</span>
              </div>
              <p className="text-sm text-muted-foreground">{t.about}</p>
              <p className="flex items-center gap-2 text-sm">
                {t.inspired.icon && (
                  // eslint-disable-next-line @next/next/no-img-element -- a 20px static svg
                  <img src={`/brands/${t.inspired.icon}.svg`} alt="" className="size-5" />
                )}
                <span>
                  แรงบันดาลใจจาก{" "}
                  {t.inspired.url ? (
                    <a
                      href={t.inspired.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4 hover:text-(--em-blue-600) dark:hover:text-(--em-sky-400)"
                    >
                      {t.inspired.name}
                    </a>
                  ) : (
                    t.inspired.name
                  )}
                </span>
              </p>
              <div className="flex flex-wrap gap-2 text-sm">
                <a
                  href={templateZip(t.slug)}
                  download
                  className="rounded-md bg-foreground px-3 py-1.5 text-background hover:opacity-90"
                >
                  ดาวน์โหลดซอร์ส
                </a>
                <a
                  href={templateBase(t.slug)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border px-3 py-1.5 hover:bg-muted"
                >
                  เปิดเต็มจอ <span aria-hidden>↗</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
