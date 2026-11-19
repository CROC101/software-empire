"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { CopyButton } from "@/components/playground/CodeBlock";
import ComponentCard from "@/components/site/ComponentCard";
import { BTN } from "@/components/site/Section";
import { useFavorites } from "@/hooks/use-favorites";
import { installCommand, npmDeps, registry } from "@/data/registry";
import { cn } from "@/lib/utils";

export default function FavoritesView() {
  const { favorites, remove, clear } = useFavorites();
  const items = registry.filter((r) => favorites.includes(r.slug));
  const deps = npmDeps(items);
  const combined = [deps.length ? `npm i ${deps.join(" ")}` : "", ...items.map((i) => installCommand(i))].filter(Boolean).join(" && ");

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[37.44px] leading-[1.15] font-medium tracking-[-0.035em] text-white max-tab:text-[30px]">Favorites</h1>
          <p className="mt-3 text-[14.5px] text-white/55">
            {items.length ? `${items.length} saved on this device.` : "Components you heart show up here, saved on this device."}
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={clear} className="h-9 rounded-[10px] px-3.5 text-[13px] text-white/55 shadow-hair hover:text-white">
              Clear all
            </button>
            <CopyButton text={combined} label="Copy Combined Install Command" className="h-9" />
          </div>
        )}
      </div>

      {items.length ? (
        <>
          <pre className="card-well mt-6 overflow-x-auto px-4 py-3 font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap break-all text-white/70">
            {combined}
          </pre>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {items.map((item) => (
              <ComponentCard key={item.slug} item={item} onRemove={() => remove(item.slug)} />
            ))}
          </div>
        </>
      ) : (
        <div className="card-shell mt-10">
          <div className="card-well flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-raise shadow-hair">
              <Heart className="size-6 text-white/50" />
            </span>
            <h2 className="mt-5 text-[20px] font-medium text-white">No favorites yet</h2>
            <p className="mt-2 max-w-[360px] text-[14px] leading-[1.6] text-white/55">
              Tap the heart on any component to keep it here, then install them all with one command.
            </p>
            <Link href="/components/" className={cn(BTN, "btn-light mt-7")}>
              Browse components
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
