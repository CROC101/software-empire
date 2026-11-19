"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ComponentCard from "@/components/site/ComponentCard";
import { categoryFromSlug, categorySlug, registry } from "@/data/registry";
import { CATEGORIES } from "@/types/component-registry";
import { cn } from "@/lib/utils";

export default function ComponentGrid() {
  const category = categoryFromSlug(useSearchParams().get("category"));
  const items = category ? registry.filter((r) => r.category === category) : registry;
  const chip = (active: boolean) =>
    cn("h-8 shrink-0 rounded-lg px-3 text-[13px] leading-8 font-medium transition", active ? "bg-white/10 text-white" : "text-white/55 hover:text-white");

  return (
    <>
      <h1 className="text-[37.44px] leading-[1.15] font-medium tracking-[-0.035em] text-white max-tab:text-[30px]">{category ?? "All components"}</h1>
      <p className="mt-3 text-[14.5px] text-white/55">
        {items.length} live, copy-paste components. Open one to tweak its props and grab the code.
      </p>
      <nav aria-label="Categories" className="-mx-1 mt-6 flex gap-1 overflow-x-auto px-1 pb-1">
        <Link href="/components/" className={chip(!category)} aria-current={!category ? "page" : undefined}>
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={`/components/?category=${categorySlug(c)}`} className={chip(c === category)} aria-current={c === category ? "page" : undefined}>
            {c}
          </Link>
        ))}
      </nav>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {items.map((item) => (
          <ComponentCard key={item.slug} item={item} />
        ))}
      </div>
    </>
  );
}
