"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Monitor, RotateCw, Smartphone, Tablet } from "lucide-react";
import type { PropValue, PropValues } from "@/types/registry";
import { defaultProps, getComponent } from "@/data/components-registry";
import { ViewportFrame, VIEWPORTS, CANVASES, type Canvas, type Viewport } from "@/components/playground/viewport-frame";
import { PropsInspector } from "@/components/playground/props-inspector";
import { CodeViewer } from "@/components/playground/code-viewer";
import { detailHref } from "@/components/playground/component-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const spring = { type: "spring", stiffness: 400, damping: 30 } as const;
const ACCENTS = { Zinc: "#a1a1aa", Violet: "#8b5cf6", Cyan: "#06b6d4", Emerald: "#10b981", Amber: "#f59e0b" } as const;
const VP_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone } as const;

export function Studio({ slug }: { slug: string }) {
  const c = getComponent(slug)!;
  const [props, setProps] = useState<PropValues>(() => defaultProps(c));
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [canvas, setCanvas] = useState<Canvas>(c.canvas === "light" ? "light" : "dark");
  const [accent, setAccent] = useState<keyof typeof ACCENTS | null>(null);
  const [replay, setReplay] = useState(0);
  const { Component } = c;

  const set = (name: string, v: PropValue) => setProps((p) => ({ ...p, [name]: v }));
  const pickAccent = (k: keyof typeof ACCENTS) => {
    setAccent(k);
    setProps((p) => {
      const next = { ...p };
      for (const s of c.propSchema) if (s.kind === "color" && s.accent) next[s.name] = ACCENTS[k];
      return next;
    });
  };

  return (
    <div className="flex min-h-[calc(100dvh-56px)] flex-col lg:h-[calc(100dvh-56px)] lg:flex-row" style={{ "--craft-accent": accent ? ACCENTS[accent] : "#0033ff" } as React.CSSProperties}>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-3 py-2 md:px-4">
          <Link href={detailHref(c)} className="flex min-w-0 items-center gap-1 text-[13px] font-medium hover:text-white">
            <ChevronLeft className="size-4 shrink-0 text-dim" /><span className="truncate">{c.name}</span>
          </Link>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-white/[0.05] p-0.5">
              {(Object.keys(VIEWPORTS) as Viewport[]).map((v) => {
                const I = VP_ICONS[v];
                const w = VIEWPORTS[v].width;
                return (
                  <Tooltip key={v}>
                    <TooltipTrigger render={<button type="button" aria-label={`${VIEWPORTS[v].label} ${typeof w === "number" ? `${w}px` : w}`} aria-pressed={viewport === v} onClick={() => setViewport(v)} className="relative flex size-7 items-center justify-center" />}>
                      {viewport === v && <motion.span layoutId="vp" transition={spring} className="absolute inset-0 rounded-md bg-white/10" />}
                      <I className={cn("relative size-3.5", viewport === v ? "text-ink" : "text-dim")} />
                    </TooltipTrigger>
                    <TooltipContent>{VIEWPORTS[v].label} · {typeof w === "number" ? `${w}px` : w}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            <div className="flex rounded-lg bg-white/[0.05] p-0.5">
              {(Object.keys(CANVASES) as Canvas[]).map((k) => (
                <Tooltip key={k}>
                  <TooltipTrigger render={<button type="button" aria-label={CANVASES[k].label} aria-pressed={canvas === k} onClick={() => setCanvas(k)} className="relative flex size-7 items-center justify-center" />}>
                    {canvas === k && <motion.span layoutId="cv" transition={spring} className="absolute inset-0 rounded-md bg-white/10" />}
                    <span className="relative size-3.5 rounded-[4px] ring-1 ring-white/25" style={{ ...CANVASES[k].style, backgroundSize: "4px 4px" }} />
                  </TooltipTrigger>
                  <TooltipContent>{CANVASES[k].label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-2 py-1.5">
              {(Object.keys(ACCENTS) as (keyof typeof ACCENTS)[]).map((k) => (
                <button key={k} type="button" aria-label={`${k} accent`} aria-pressed={accent === k} title={k} onClick={() => pickAccent(k)} className={cn("size-4 rounded-full ring-offset-2 ring-offset-[#050506] transition-shadow", accent === k && "ring-2 ring-white/80")} style={{ background: ACCENTS[k] }} />
              ))}
            </div>
            <button type="button" onClick={() => setReplay((n) => n + 1)} className="flex h-8 items-center gap-1.5 rounded-lg bg-white/[0.05] px-2.5 text-[12.5px] hover:bg-white/10">
              <RotateCw className="size-3.5" />Replay
            </button>
          </div>
        </div>
        <div className="h-[420px] min-h-0 flex-1 lg:h-auto">
          <ViewportFrame viewport={viewport} canvas={canvas} minHeight={c.previewHeight}>
            <Component key={replay} {...props} />
          </ViewportFrame>
        </div>
      </div>
      <aside className="flex w-full shrink-0 flex-col border-t border-white/[0.06] lg:w-[400px] lg:border-t-0 lg:border-l">
        <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
          <PropsInspector schema={c.propSchema} values={props} onChange={set} onReset={() => { setProps(defaultProps(c)); setAccent(null); }} />
          <div className="mt-8"><CodeViewer component={c} props={props} /></div>
        </div>
      </aside>
    </div>
  );
}
