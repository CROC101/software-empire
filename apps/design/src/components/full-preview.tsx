"use client";

import { cn } from "@empire/ui";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  defaultSurface,
  parseStage,
  readStage,
  stageKey,
  surfaceClass,
  type Surface,
} from "@/lib/stage";
import { defaults, entry, kindOf, type Values } from "@/registry/meta";
import { Part } from "@/registry/parts";
import { useStored } from "./library-state";

const noop = () => () => {};

/**
 * One part alone at the real viewport. Inside the playground iframe it takes props and surface from
 * the parent page (same origin only, every value clamped by readStage) and hides its back link.
 */
export function FullPreview({ slug }: { slug: string }) {
  const e = entry(slug);
  const component = e ? kindOf(e) === "component" : true;
  const [sent, setStage] = useState<{ values: Values; surface: Surface } | null>(null);
  // opened full screen on its own: show what the playground had, not the defaults
  const [raw] = useStored(stageKey(slug));
  const embedded = useSyncExternalStore(
    noop,
    () => window.self !== window.top,
    () => false,
  );

  useEffect(() => {
    if (!e) return;
    const onMessage = (m: MessageEvent) => {
      if (m.origin !== location.origin || m.source !== window.parent) return;
      const next = readStage(m.data, e);
      if (next) setStage(next);
    };
    addEventListener("message", onMessage);
    // tell the playground we are listening, so it sends the current values
    if (window.parent !== window)
      window.parent.postMessage({ type: "croc:ready" }, location.origin);
    return () => removeEventListener("message", onMessage);
  }, [e]);

  if (!e) return null;
  const stage = sent ?? (embedded ? null : parseStage(raw, e));
  const surface = stage?.surface ?? defaultSurface(component);
  return (
    <main
      className={cn(
        surfaceClass[surface],
        component ? "h-dvh [&>*:last-child]:h-full" : "min-h-dvh",
      )}
    >
      {!embedded && (
        <a
          href={`/c/${slug}`}
          className="vt-top fixed bottom-4 left-4 z-50 inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-sm hover:bg-muted"
        >
          <ArrowLeft aria-hidden className="size-4" /> กลับไปหน้า {e.name}
        </a>
      )}
      <Part slug={slug} values={stage?.values ?? defaults(e)} />
    </main>
  );
}
