"use client";

import { RotateCcw } from "lucide-react";
import type { PropControl, PropValue } from "@/types/component-registry";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function PropsCustomizer({
  controls,
  values,
  onChange,
  onReset,
}: {
  controls: PropControl[];
  values: Record<string, PropValue>;
  onChange: (name: string, value: PropValue) => void;
  onReset: () => void;
}) {
  return (
    <div className="card-shell">
      <div className="flex items-center justify-between px-3 pt-1.5 pb-2">
        <h3 className="text-[13px] font-medium text-white">Customize</h3>
        <button onClick={onReset} className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white">
          <RotateCcw className="size-3" /> Reset
        </button>
      </div>
      <div className="card-well grid gap-x-8 gap-y-5 p-5 tab:grid-cols-2">
        {controls.map((c) => {
          const id = `ctl-${c.name}`;
          const label = c.label ?? c.name;
          const v = values[c.name];
          return (
            <div key={c.name} className="flex min-w-0 flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={id} className="font-mono text-[12.5px] text-white/70">
                  {label}
                </label>
                {c.type === "range" && (
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-white/80">
                    {Number(v)}
                    {c.unit}
                  </span>
                )}
              </div>
              {c.type === "range" && (
                <input
                  id={id}
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={Number(v)}
                  onChange={(e) => onChange(c.name, Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer accent-violet"
                />
              )}
              {c.type === "color" && (
                <div className="flex items-center gap-2">
                  <input
                    id={id}
                    type="color"
                    value={String(v)}
                    onChange={(e) => onChange(c.name, e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded-md border border-white/10 bg-transparent p-0.5"
                  />
                  <Input
                    aria-label={`${label} hex`}
                    value={String(v)}
                    onChange={(e) => onChange(c.name, e.target.value)}
                    className="h-8 font-mono text-xs"
                  />
                </div>
              )}
              {c.type === "toggle" && (
                <button
                  id={id}
                  role="switch"
                  aria-checked={Boolean(v)}
                  onClick={() => onChange(c.name, !v)}
                  className={cn("relative h-6 w-11 rounded-full transition", v ? "bg-violet" : "bg-white/15")}
                >
                  <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition", v && "translate-x-5")} />
                </button>
              )}
              {c.type === "text" && (
                <Input id={id} value={String(v)} onChange={(e) => onChange(c.name, e.target.value)} className="h-8 text-sm" />
              )}
              {c.type === "select" && (
                <select
                  id={id}
                  value={String(v)}
                  onChange={(e) => onChange(c.name, e.target.value)}
                  className="h-8 rounded-lg border border-input bg-ink px-2 text-sm text-white"
                >
                  {c.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
