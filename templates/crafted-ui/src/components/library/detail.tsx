"use client";

import Link from "next/link";
import { Bookmark, Check, ChevronRight, Copy, Home, Play } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ComponentCard } from "@/components/playground/component-card";
import { MiniPreview } from "@/components/playground/mini-preview";
import { CATEGORIES, COMPONENTS, defaultProps, getComponent, getSource } from "@/data/components-registry";
import { buildPrompt, filePath, usageCode } from "@/lib/prompt-builder";
import { useCopy, useOrigin } from "@/lib/use-copy";

const LIB = "/community/components/";

function Grid({ title, items }: { title: string; items: typeof COMPONENTS }) {
  if (!items.length) return null;
  return (
    <section className="mt-20">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[20px] font-medium tracking-[-0.02em]">{title}</h2>
        <Link href={LIB} className="text-[14px] text-dim hover:text-ink">View all</Link>
      </div>
      <ul className="mt-2 grid grid-cols-1 gap-x-3 gap-y-[42px] py-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 8).map((c) => <li key={c.slug}><ComponentCard c={c} bare /></li>)}
      </ul>
    </section>
  );
}

function CodeSection({ c, copied, copy }: { c: NonNullable<ReturnType<typeof getComponent>>; copied: string | null; copy: ReturnType<typeof useCopy>["copy"] }) {
  return (
    <>
      <section className="flex flex-wrap items-baseline justify-between gap-x-4 pt-6">
        <h2 className="text-[16px] font-medium">Code</h2>
        <p className="font-mono text-[12px] text-dim">{filePath(c)}</p>
        <p className="mt-2 w-full text-[14px] text-dim">How {c.name} is used: the demo&apos;s code. The component&apos;s own source comes with the prompt or the CLI.</p>
        <div className="mt-4 w-full overflow-hidden rounded-xl bg-[#0a0a0b] ring-1 ring-white/[0.06]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2 text-[12.5px] text-dim">
            <span className="font-mono">Usage.tsx</span>
            <button type="button" onClick={() => copy(usageCode(c, defaultProps(c), true), "usage")} className="flex items-center gap-1 hover:text-ink">{copied === "usage" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}Copy</button>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-5 text-ink-soft">{usageCode(c, defaultProps(c), true)}</pre>
        </div>
      </section>
      <section className="flex flex-wrap items-center gap-3 pt-6">
        <h2 className="w-full text-[16px] font-medium">Dependencies</h2>
        <div className="flex flex-wrap gap-2">
          {c.dependencies.map((d) => <span key={d} className="rounded-md bg-white/[0.06] px-3 py-2.5 font-mono text-[12px] text-ink-soft">{d}</span>)}
        </div>
      </section>
    </>
  );
}

export function Detail({ slug }: { slug: string }) {
  const c = getComponent(slug)!;
  const origin = useOrigin();
  const { copied, copy } = useCopy();
  const [saved, setSaved] = useState(false);
  const others = COMPONENTS.filter((x) => x.slug !== slug);
  const byAuthor = others.filter((x) => x.author.handle === c.author.handle);
  const inCat = others.filter((x) => x.category === c.category);

  return (
    <div className="site-col pt-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px] text-dim">
        <Link href="/" aria-label="Home" className="hover:text-ink"><Home className="size-3.5" /></Link>
        <ChevronRight className="size-3.5" /><Link href={LIB} className="hover:text-ink">Library</Link>
        <ChevronRight className="size-3.5" /><Link href={LIB} className="hover:text-ink">{c.category}</Link>
        <ChevronRight className="size-3.5" /><span className="truncate text-ink-soft">{c.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[374px_minmax(0,1fr)]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[14px]">
            <span className="size-6 rounded-full" style={{ background: `linear-gradient(135deg,hsl(${c.author.hue} 80% 62%),hsl(${c.author.hue + 50} 70% 40%))` }} />
            <span className="font-medium">{c.author.name}</span><span className="text-dim">@{c.author.handle}</span>
          </div>
          <h1 className="mt-6 text-[26px] font-semibold tracking-[-0.03em] lg:text-[32px]">{c.name}</h1>
          <p className="mt-1 flex items-center gap-3 text-[14px] text-dim">
            {c.category}
            <button type="button" onClick={() => setSaved((s) => !s)} className="flex items-center gap-1 hover:text-ink" aria-pressed={saved}>
              <Bookmark className={saved ? "size-3.5 fill-current text-brand" : "size-3.5"} />{(c.bookmarks + (saved ? 1 : 0)).toLocaleString("en-US")}
            </button>
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button className="h-11 rounded-[10px] px-5 text-[16px]" onClick={() => copy(buildPrompt(c, getSource(c.slug), defaultProps(c), origin), "prompt")}>
              {copied === "prompt" ? <Check /> : <Copy />}{copied === "prompt" ? "Copied" : "Copy prompt"}
            </Button>
            <Button variant="secondary" className="h-11 rounded-[10px] bg-chip px-5 text-[16px] text-ink" render={<Link href={`/c/${c.slug}/`} />} nativeButton={false}>Open in studio</Button>
          </div>
        </div>
        <div className="relative h-[300px] overflow-hidden rounded-[14px] md:h-[283px] lg:h-[450px] ring-1 ring-white/[0.06]">
          <MiniPreview component={c} designWidth={720} className="h-full" />
          <Button size="sm" className="absolute right-3 bottom-3 rounded-lg bg-white/90 text-black hover:bg-white" render={<Link href={`/c/${c.slug}/`} />} nativeButton={false}><Play />Preview</Button>
        </div>
      </div>

      <div className="mt-12 border-b border-white/[0.06]">
        <span className="relative inline-block pb-3 text-[15px] font-medium">About<span className="absolute inset-x-0 -bottom-px h-0.5 bg-ink" /></span>
      </div>
      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_260px] md:gap-12 lg:grid-cols-[minmax(0,733px)_260px] lg:justify-between">
        <div className="min-w-0">
        <p className="text-[15px] leading-[1.6] text-ink-soft">{c.description}</p>
        <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">Built with React and Tailwind. Copy the prompt and paste it into your coding agent: it adds {c.name} to your project and fits it to your theme.</p>
        <CodeSection c={c} copied={copied} copy={copy} />
        </div>
        <aside aria-label="Details"><dl className="grid grid-cols-[96px_1fr] gap-y-2 text-[14px]">
          <dt className="text-dim">Author</dt><dd className="text-right">{c.author.name}</dd>
          <dt className="text-dim">Category</dt><dd className="text-right">{c.category}</dd>
          <dt className="text-dim">Library</dt><dd className="text-right">{c.library}</dd>
          <dt className="text-dim">Published</dt><dd className="text-right">{c.published}</dd>
        </dl></aside>
      </div>


      <Grid title={`More by ${c.author.name}`} items={byAuthor.length ? byAuthor : others} />
      <Grid title={`More in ${c.category}`} items={[...inCat, ...others.filter((x) => x.category !== c.category).reverse()]} />

      <section className="mt-10 pt-6 pb-16">
        <h2 className="text-[16px] font-semibold tracking-[-0.02em]">Explore more</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.slice(1).map((cat) => <Link key={cat} href={LIB} className="rounded-full bg-white/[0.05] px-3.5 py-1.5 text-[13px] text-ink-soft hover:bg-white/10">{cat}</Link>)}
        </div>
      </section>
    </div>
  );
}
