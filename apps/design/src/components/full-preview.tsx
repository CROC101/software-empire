"use client";

import { ArrowLeft } from "lucide-react";
import { defaults, entry, kindOf } from "@/registry/meta";
import { Part } from "@/registry/parts";

export function FullPreview({ slug }: { slug: string }) {
  const e = entry(slug);
  if (!e) return null;
  const component = kindOf(e) === "component";
  return (
    <main className={component ? "h-dvh bg-(--em-ink-975) [&>*:last-child]:h-full" : "min-h-dvh"}>
      <a
        href={`/c/${slug}`}
        className="vt-top fixed bottom-4 left-4 z-50 inline-flex items-center gap-1.5 rounded-lg border bg-background/90 px-3 py-2 text-sm shadow-lg backdrop-blur hover:bg-muted"
      >
        <ArrowLeft aria-hidden className="size-4" />
        กลับไปหน้า {e.name}
      </a>
      <Part slug={slug} values={defaults(e)} />
    </main>
  );
}
