"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Eye, Terminal } from "lucide-react";
import type { RegistryComponent } from "@/types/registry";
import { MiniPreview } from "@/components/playground/mini-preview";
import { defaultProps, getSource } from "@/data/components-registry";
import { buildPrompt, cliCommand } from "@/lib/prompt-builder";
import { useCopy, useOrigin } from "@/lib/use-copy";

export const detailHref = (c: RegistryComponent) => `/@${c.author.handle}/components/${c.slug}/`;
const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : String(n));

/** Live thumbnail card; hover/focus reveals Preview, Copy prompt and Copy CLI. */
export function ComponentCard({ c, bare }: { c: RegistryComponent; bare?: boolean }) {
  const router = useRouter();
  const origin = useOrigin();
  const { copied, copy } = useCopy();
  const btn = "flex h-8 items-center gap-1.5 rounded-lg bg-white/90 px-2.5 text-[12.5px] font-medium text-black backdrop-blur hover:bg-white";
  return (
    <div className="group">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-white/[0.06]">
        <MiniPreview component={c} designWidth={560} className="h-full" />
        <Link href={detailHref(c)} aria-label={c.name} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-black/55 p-3 opacity-0 transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
          <div className="flex flex-wrap gap-1">
            {c.dependencies.slice(0, 3).map((d) => <span key={d} className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10.5px] text-white/80">{d}</span>)}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={btn} onClick={() => router.push(`/c/${c.slug}/`)}><Eye className="size-3.5" />Preview</button>
            <button type="button" className={btn} onClick={() => copy(buildPrompt(c, getSource(c.slug), defaultProps(c), origin), "prompt")}>
              {copied === "prompt" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}Prompt
            </button>
            <button type="button" className={btn} onClick={() => copy(cliCommand(c, "npm", origin), "cli")}>
              {copied === "cli" ? <Check className="size-3.5" /> : <Terminal className="size-3.5" />}CLI
            </button>
          </div>
        </div>
      </div>
      <div className={bare ? "sr-only" : "mt-2.5 flex items-center gap-2 text-[13px]"}>
        <span className="size-5 shrink-0 rounded-full" style={{ background: `linear-gradient(135deg,hsl(${c.author.hue} 80% 62%),hsl(${c.author.hue + 50} 70% 40%))` }} />
        <h3 className="min-w-0 truncate text-[13px] font-medium"><Link href={detailHref(c)} className="text-ink hover:underline">{c.name}</Link></h3>
        <span className="ml-auto flex shrink-0 items-center gap-1 text-dim"><Download className="size-3" />{fmt(c.installs)}</span>
      </div>
    </div>
  );
}
