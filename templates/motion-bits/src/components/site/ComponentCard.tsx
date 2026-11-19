"use client";

import Link from "next/link";
import { ArrowUpRight, Heart, X } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import type { ComponentItem } from "@/types/component-registry";
import { cn } from "@/lib/utils";

export function FavButton({ slug, name, className }: { slug: string; name: string; className?: string }) {
  const { isFavorite, toggle } = useFavorites();
  const on = isFavorite(slug);
  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
      className={cn("flex size-8 items-center justify-center rounded-lg bg-black/40 backdrop-blur transition hover:bg-black/60", className)}
    >
      <Heart className={cn("size-4", on ? "fill-pink-500 text-pink-500" : "text-white/70")} />
    </button>
  );
}

export default function ComponentCard({ item, onRemove }: { item: ComponentItem; onRemove?: () => void }) {
  const C = item.component;
  const href = `/components/${item.slug}/`;
  return (
    <article className="card-shell flex min-w-0 flex-col">
      <div className="card-well relative h-[210px] overflow-hidden bg-[#060010]">
        <div className={cn("h-full w-full", !item.fill && "pointer-events-auto flex items-center justify-center")}>
          {item.fill ? (
            <C {...item.defaultProps} />
          ) : (
            <div className="origin-center scale-[0.62]">
              <C {...item.defaultProps} />
            </div>
          )}
        </div>
        <div className="absolute top-2.5 right-2.5 z-20">
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${item.name} from favorites`}
              className="flex size-8 items-center justify-center rounded-lg bg-black/40 text-white/70 backdrop-blur hover:bg-black/60 hover:text-white"
            >
              <X className="size-4" />
            </button>
          ) : (
            <FavButton slug={item.slug} name={item.name} />
          )}
        </div>
        {item.badge && (
          <span
            className={cn(
              "absolute top-3 left-3 z-20 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
              item.badge === "NEW" ? "bg-cyan/15 text-cyan" : "bg-violet/20 text-[#d8b4fe]",
            )}
          >
            {item.badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-3 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold text-white">
            <Link href={href} className="hover:underline">
              {item.name}
            </Link>
          </h2>
          <span className="ml-auto text-xs text-white/40">{item.category}</span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-[1.55] text-white/55">{item.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
          {item.dependencies.map((d) => (
            <span key={d} className="rounded-chip bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-white/55">
              {d}
            </span>
          ))}
          <Link href={href} className="ml-auto inline-flex items-center gap-1 text-[13px] text-white/55 hover:text-white">
            Open Playground <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
