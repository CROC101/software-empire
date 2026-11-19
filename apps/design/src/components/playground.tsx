"use client";

import { cn } from "@empire/ui";
import { Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { defaultSurface, surfaces, type StageMessage, type Surface } from "@/lib/stage";
import {
  clampValue,
  defaults,
  kindOf,
  type Control,
  type Entry,
  type Values,
} from "@/registry/meta";
import { CodeView, type CodeFile } from "./code-view";

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

const widths = [
  ["full", "เต็ม", Monitor],
  ["768", "แท็บเล็ต 768", Tablet],
  ["390", "มือถือ 390", Smartphone],
] as const;

const seg = (on: boolean) =>
  cn(
    "rounded transition-colors duration-75",
    on ? "bg-(--em-ink-700) text-(--em-ink-50)" : "text-(--em-ink-400) hover:text-(--em-ink-100)",
  );

/**
 * Live props on the left; on the right a stage that loads /p/<slug> in an iframe, so 390 and 768
 * are real viewports (media queries fire), with Preview / Code tabs.
 */
export function Playground({
  entry,
  files,
  deps,
}: {
  entry: Entry;
  files: readonly CodeFile[];
  deps: readonly string[];
}) {
  const component = kindOf(entry) === "component";
  const [values, setValues] = useState<Values>(() => defaults(entry));
  const [surface, setSurface] = useState<Surface>(() => defaultSurface(component));
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [run, setRun] = useState(0);
  const [width, setWidth] = useState<(typeof widths)[number][0]>("full");
  const frame = useRef<HTMLIFrameElement>(null);

  const send = useCallback(() => {
    const msg: StageMessage = { type: "croc:stage", values, surface };
    frame.current?.contentWindow?.postMessage(msg, location.origin);
  }, [values, surface]);

  useEffect(send, [send]);
  // the frame says when it is listening (after hydration), then gets the current state
  useEffect(() => {
    const onReady = (m: MessageEvent) => {
      const data: unknown = m.data;
      if (
        m.origin === location.origin &&
        m.source === frame.current?.contentWindow &&
        typeof data === "object" &&
        data !== null &&
        (data as { type?: unknown }).type === "croc:ready"
      )
        send();
    };
    addEventListener("message", onReady);
    return () => removeEventListener("message", onReady);
  }, [send]);

  const tabButton = (t: typeof tab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === t}
      aria-controls={`panel-${t}`}
      onClick={() => setTab(t)}
      className={cn("px-3 py-1.5 text-sm", seg(tab === t))}
    >
      {label}
    </button>
  );

  return (
    <div className={cn("grid gap-6", entry.controls.length > 0 && "lg:grid-cols-[18rem_1fr]")}>
      <aside
        className={cn(
          "order-2 h-fit rounded-xl border bg-card p-5 lg:order-1",
          !entry.controls.length && "hidden",
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Props
          </p>
          <button
            type="button"
            onClick={() => setValues(defaults(entry))}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors duration-75 hover:bg-muted"
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
          {tab === "preview" && (
            <div className="flex flex-wrap gap-2">
              <div
                role="radiogroup"
                aria-label="พื้นหลัง"
                className="flex rounded-md bg-(--em-ink-900) p-0.5"
              >
                {surfaces.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={surface === s}
                    onClick={() => setSurface(s)}
                    className={cn("px-2 py-1 font-mono text-xs", seg(surface === s))}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div
                role="radiogroup"
                aria-label="ความกว้างจอ"
                className="flex rounded-md bg-(--em-ink-900) p-0.5"
              >
                {widths.map(([w, label, Icon]) => (
                  <button
                    key={w}
                    type="button"
                    role="radio"
                    aria-checked={width === w}
                    aria-label={label}
                    title={label}
                    onClick={() => setWidth(w)}
                    className={cn("grid size-7 place-items-center", seg(width === w))}
                  >
                    <Icon aria-hidden className="size-4" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setRun((n) => n + 1)}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-(--em-ink-300) transition-colors duration-75 hover:bg-(--em-ink-900)"
              >
                <RotateCcw aria-hidden className="size-4" />
                เล่นใหม่
              </button>
            </div>
          )}
        </div>
        <div
          id="panel-preview"
          role="tabpanel"
          hidden={tab !== "preview"}
          className={cn("overflow-auto bg-(--em-ink-900)", component ? "h-[26rem]" : "h-[36rem]")}
        >
          <iframe
            key={run}
            ref={frame}
            src={`/p/${entry.slug}`}
            title={`ตัวอย่าง ${entry.name}`}
            className={cn(
              "mx-auto block h-full",
              width !== "full" && "border-x border-(--em-ink-700)",
            )}
            // +2 for the 1px side borders, so the frame content is exactly 390 / 768
            style={{ width: width === "full" ? "100%" : `${Number(width) + 2}px` }}
          />
        </div>
        {tab === "code" && (
          <div id="panel-code" role="tabpanel" className="h-[32rem]">
            <CodeView files={files} deps={deps} />
          </div>
        )}
      </section>
    </div>
  );
}
