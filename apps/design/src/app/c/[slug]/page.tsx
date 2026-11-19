import { readFile } from "node:fs/promises";
import path from "node:path";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { Playground } from "@/components/playground";
import { categories, entry, registry } from "@/registry/meta";

export const dynamicParams = false;

export function generateStaticParams() {
  return registry.map((e) => ({ slug: e.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = entry((await params).slug);
  return e ? { title: e.name, description: e.summary } : {};
}

export default async function ComponentPage({ params }: Props) {
  const e = entry((await params).slug);
  if (!e) notFound();
  // slug comes from the registry (dynamicParams = false), never from a visitor
  const source = await readFile(path.join(process.cwd(), "src/registry", `${e.slug}.tsx`), "utf8");

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        ทั้งหมด
      </Link>
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">{e.category}</p>
          <h1 className="mt-1 font-heading text-3xl font-black sm:text-4xl">{e.name}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {categories[e.category]} · {e.summary}
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="ผสมจาก">
            {e.blend.map((b) => (
              <li
                key={b}
                className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                {b}
              </li>
            ))}
          </ul>
        </div>
        <CopyButton text={e.prompt} label="คัดลอก prompt" className="self-start md:self-auto" />
      </div>
      <div className="mt-8">
        <Playground entry={e} source={source} />
      </div>
    </main>
  );
}
