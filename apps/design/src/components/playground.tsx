"use client";

import { cn } from "@empire/ui";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { clampValue, defaults, type Control, type Entry, type Values } from "@/registry/meta";
import { Part } from "@/registry/parts";
import { CopyButton } from "./copy-button";

function Field({
  c,
  value,
  set,
}: {
  c: Control;
  value: Values[string];
  set: (v: Values[string]) => void;
}) {
  const id = `ctl-${c.key}`;
  const label = (
    <label htmlFor={id} className="text-sm font-medium">
      {c.label}
    </label>
  );
  if (c.type === "range")
    return (
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          {label}
          <output htmlFor={id} className="font-mono text-xs text-muted-foreground tabular-nums">
            {String(value)}
          </output>
        </div>
        <input
          id={id}
          type="range"
          min={c.min}
          max={c.max}
          step={c.step}
          value={Number(value)}
          onChange={(e) => set(Number(e.target.value))}
          className="accent-(--primary)"
        />
      </div>
    );
  if (c.type === "select")
    return (
      <div className="grid gap-1.5">
        {label}
        <select
          id={id}
          value={String(value)}
          onChange={(e) => set(e.target.value)}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          {c.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  if (c.type === "toggle")
    return (
      <div className="flex items-center justify-between">
        {label}
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => set(e.target.checked)}
          className="size-4 accent-(--primary)"
        />
      </div>
    );
  return (
    <div className="grid gap-1.5">
      {label}
      <input
        id={id}
        type="text"
        value={String(value)}
        maxLength={c.maxLength}
        onChange={(e) => set(e.target.value)}
        className="rounded-md border bg-background px-2 py-1.5 text-sm"
      />
    </div>
  );
}

/** Live props on the left, a dark stage with Preview / Code tabs on the right. */
export function Playground({ entry, source }: { entry: Entry; source: string }) {
  const [values, setValues] = useState<Values>(() => defaults(entry));
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [run, setRun] = useState(0);

  const tabButton = (t: typeof tab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === t}
      aria-controls={`panel-${t}`}
      onClick={() => setTab(t)}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm transition-colors",
        tab === t
          ? "bg-(--em-ink-800) text-(--em-ink-50)"
          : "text-(--em-ink-400) hover:text-(--em-ink-100)",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <aside className="order-2 h-fit rounded-xl border bg-card p-5 lg:order-1">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Props
          </p>
          <button
            type="button"
            onClick={() => {
              setValues(defaults(entry));
              setRun((n) => n + 1);
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            <RotateCcw aria-hidden className="size-3.5" />
            คืนค่าเดิม
          </button>
        </div>
        <div className="grid gap-5">
          {entry.controls.map((c) => (
            <Field
              key={c.key}
              c={c}
              value={values[c.key] ?? c.value}
              set={(v) => setValues((old) => ({ ...old, [c.key]: clampValue(c, v) }))}
            />
          ))}
        </div>
      </aside>

      <section className="order-1 min-w-0 overflow-hidden rounded-xl border border-(--em-ink-800) bg-(--em-ink-975) lg:order-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--em-ink-800) p-2">
          <div role="tablist" aria-label="มุมมอง" className="flex gap-1">
            {tabButton("preview", "Preview")}
            {tabButton("code", "Code")}
          </div>
          <div className="flex gap-2">
            {tab === "preview" && (
              <button
                type="button"
                onClick={() => setRun((n) => n + 1)}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-(--em-ink-300) hover:bg-(--em-ink-900)"
              >
                <RotateCcw aria-hidden className="size-4" />
                เล่นใหม่
              </button>
            )}
            <CopyButton
              text={source}
              label="คัดลอกโค้ด"
              className="border-(--em-ink-800) text-(--em-ink-100) hover:bg-(--em-ink-900)"
            />
          </div>
        </div>
        {tab === "preview" ? (
          <div id="panel-preview" role="tabpanel" className="h-[26rem] [&>*]:h-full">
            <Part key={run} slug={entry.slug} values={values} />
          </div>
        ) : (
          <div id="panel-code" role="tabpanel" className="h-[26rem] overflow-auto">
            {/* shortcut: plain text, no syntax colours; add a highlighter when the registry grows */}
            <pre className="p-5 font-mono text-xs leading-relaxed text-(--em-ink-200)">
              <code>{source}</code>
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
