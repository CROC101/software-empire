"use client";

import { RotateCcw } from "lucide-react";
import type { PropControl, PropValue, PropValues } from "@/types/registry";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function Control({ p, value, onChange }: { p: PropControl; value: PropValue; onChange: (v: PropValue) => void }) {
  const id = `prop-${p.name}`;
  switch (p.kind) {
    case "number":
      return (
        <div className="flex items-center gap-3">
          <Slider id={id} aria-label={p.label} min={p.min} max={p.max} step={p.step} value={Number(value)} onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)} className="flex-1" />
          <span className="w-14 text-right font-mono text-[12px] tabular-nums text-ink-soft">{Number(value)}{p.unit ?? ""}</span>
        </div>
      );
    case "color":
      return (
        <div className="flex items-center gap-2">
          <input id={id} type="color" aria-label={p.label} value={String(value)} onChange={(e) => onChange(e.target.value)} className="size-8 cursor-pointer rounded-md border border-white/10 bg-transparent p-0.5" />
          <Input aria-label={`${p.label} hex`} value={String(value)} onChange={(e) => onChange(e.target.value)} className="h-8 font-mono text-[12px]" />
        </div>
      );
    case "boolean":
      return <Switch id={id} aria-label={p.label} checked={Boolean(value)} onCheckedChange={(v) => onChange(v)} />;
    case "select":
      return (
        <Select value={String(value)} onValueChange={(v) => onChange(String(v))}>
          <SelectTrigger id={id} aria-label={p.label} className="h-8 w-full text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>{p.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      );
    default:
      return <Input id={id} aria-label={p.label} value={String(value)} onChange={(e) => onChange(e.target.value)} className="h-8 text-[13px]" />;
  }
}

/** One control per propSchema entry; every change flows back to the preview and the code. */
export function PropsInspector({ schema, values, onChange, onReset }: { schema: PropControl[]; values: PropValues; onChange: (name: string, v: PropValue) => void; onReset: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium">Props</p>
        <button type="button" onClick={onReset} className="flex items-center gap-1 text-[12px] text-dim hover:text-ink"><RotateCcw className="size-3" />Reset</button>
      </div>
      {schema.map((p) => (
        <div key={p.name} className="flex flex-col gap-2">
          <label htmlFor={`prop-${p.name}`} className="flex items-center justify-between text-[12.5px]">
            <span className="text-ink-soft">{p.label}</span>
            <code className="font-mono text-[11px] text-dim">{p.name}</code>
          </label>
          <Control p={p} value={values[p.name] ?? p.default} onChange={(v) => onChange(p.name, v)} />
        </div>
      ))}
    </div>
  );
}
