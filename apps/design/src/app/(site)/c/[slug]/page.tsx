import { readFile } from "node:fs/promises";
import path from "node:path";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompareOriginal } from "@/components/compare-original";
import { CopyButton } from "@/components/copy-button";
import { InView } from "@/components/in-view";
import { InstallPanel } from "@/components/install-panel";
import { Playground } from "@/components/playground";
import { Thumb } from "@/components/preview";
import { isHot, isNew, sortEntries } from "@/lib/library";
import { aiPrompt } from "@/lib/stage";
import { categories, entry, kindOf, kinds, promptFor, registry } from "@/registry/meta";

export const dynamicParams = false;

export function generateStaticParams() {
  return registry.map((e) => ({ slug: e.slug }));
}

type Props = { params: Promise<{ slug: string }> };

// the same origin the registry JSON was built for (deploy writes NEXT_PUBLIC_SITE_URL)
const base = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://crocwork-design.crocwork.workers.dev"
).replace(/\/$/, "");

type Item = {
  dependencies?: string[];
  docs?: string;
  files: { path: string; type: string; content: string }[];
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = entry((await params).slug);
  return e ? { title: e.name, description: e.summary } : {};
}

// plain <a> throughout: Next 16 export writes /c/<slug> RSC payloads where Link prefetch does not look (404)
export default async function ComponentPage({ params }: Props) {
  const e = entry((await params).slug);
  if (!e) notFound();
  // slug comes from the registry (dynamicParams = false), never from a visitor; the JSON is what
  // scripts/build-registry.mjs wrote before this build, so the page shows exactly what installs
  const item = JSON.parse(
    await readFile(path.join(process.cwd(), "public/r", `${e.slug}.json`), "utf8"),
  ) as Item;
  const deps = item.dependencies ?? [];
  const files = item.files.map((f) => ({
    path: `${f.type === "registry:lib" ? "lib" : "components/ui"}/${path.basename(f.path)}`,
    content: f.content,
  }));
  const kind = kindOf(e);

  // prev / next walk the same category in popular order, wrapping round
  const same = sortEntries(
    registry.filter((x) => x.category === e.category),
    "popular",
  );
  const i = same.findIndex((x) => x.slug === e.slug);
  const prev = same.at(i - 1);
  const next = same[(i + 1) % same.length];
  const related = same.filter((x) => x.slug !== e.slug).slice(0, 3);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav aria-label="ตำแหน่ง" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- see the note above: the export 404s Link prefetch */}
            <a href="/" className="hover:text-foreground">
              ทั้งหมด
            </a>
          </li>
          <li aria-hidden>/</li>
          <li>
            <a href={`/#k=${kind}`} className="hover:text-foreground">
              {kinds[kind]}
            </a>
          </li>
          <li aria-hidden>/</li>
          <li>
            <a href={`/#c=${e.category}`} className="hover:text-foreground">
              {categories[e.category].label}
            </a>
          </li>
        </ol>
      </nav>

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {isNew(e) && (
              <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
                <span aria-hidden className="size-1.5 rounded-full bg-primary" />
                ใหม่
              </span>
            )}
            {isHot(e) && (
              <span className="text-xs text-muted-foreground">ยอดนิยมอันดับ {e.rank}</span>
            )}
            <span className="text-xs text-muted-foreground">
              เพิ่มเมื่อ <time className="font-mono">{e.added}</time>
            </span>
          </div>
          <h1 className="mt-2 font-heading text-3xl font-black sm:text-5xl">{e.name}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{e.summary}</p>
          {e.credit && (
            <p className="mt-2 text-sm text-muted-foreground">
              แรงบันดาลใจจาก{" "}
              <a
                href={e.credit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                {e.credit.author} บน 21st.dev <span aria-hidden>↗</span>
              </a>
            </p>
          )}
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
        <div className="flex flex-wrap gap-2 self-start md:self-auto">
          <a
            href={`/p/${e.slug}`}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Expand aria-hidden className="size-4" />
            เต็มจอ
          </a>
          <CopyButton
            text={aiPrompt(e, { base, dependencies: deps, usage: item.docs, brief: promptFor(e) })}
            label="คัดลอก prompt ให้ AI"
          />
        </div>
      </div>

      <div className="mt-8">
        <Playground entry={e} files={files} deps={deps} />
        {e.inspiredBy && <CompareOriginal entry={e} title={e.inspiredBy} />}
      </div>

      <section aria-labelledby="install" className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <h2 id="install" className="font-heading text-lg font-semibold">
            ติดตั้ง
          </h2>
          <p className="mt-1 mb-3 text-sm text-muted-foreground">
            shadcn CLI วางไฟล์และลงแพ็กเกจให้เอง โปรเจกต์ที่ไม่มี shadcn ใช้ croc-ui แทน
          </p>
          <InstallPanel base={base} slug={e.slug} />
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">ค่าที่ปรับได้</h2>
          {e.controls.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="py-1 pr-3 font-medium">prop</th>
                    <th className="py-1 pr-3 font-medium">ชนิด</th>
                    <th className="py-1 font-medium">ค่าเริ่มต้น</th>
                  </tr>
                </thead>
                <tbody>
                  {e.controls.map((c) => (
                    <tr key={c.key} className="border-t">
                      <td className="py-1.5 pr-3 font-mono text-xs">{c.key}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground">
                        {c.type === "range"
                          ? `${String(c.min)}-${String(c.max)}`
                          : c.type === "select"
                            ? c.options.join(" | ")
                            : c.type === "toggle"
                              ? "boolean"
                              : "string"}
                      </td>
                      <td className="py-1.5 font-mono text-xs">{String(c.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">ชิ้นนี้ไม่มีค่าให้ปรับ ใช้ได้ทันที</p>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-12">
          <h2 id="related" className="font-heading text-2xl font-black">
            ในหมวด{categories[e.category].label}
          </h2>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug} className="group relative overflow-hidden rounded-xl border bg-card">
                <InView className="aspect-[16/10] overflow-hidden border-b">
                  <Thumb entry={r} />
                </InView>
                <p className="p-4 font-heading font-semibold">
                  <a
                    href={`/c/${r.slug}`}
                    className="after:absolute after:inset-0 group-hover:text-primary"
                  >
                    {r.name}
                  </a>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {prev && next && same.length > 1 && (
        <nav
          aria-label="ชิ้นก่อนหน้าและถัดไป"
          className="mt-12 grid gap-3 border-t pt-6 sm:grid-cols-2"
        >
          {/* two in the category: prev and next are the same part, so show it once */}
          {prev.slug !== next.slug && (
            <a
              href={`/c/${prev.slug}`}
              className="group flex items-center gap-3 rounded-xl border p-4 hover:bg-muted"
            >
              <ChevronLeft aria-hidden className="size-5 text-muted-foreground" />
              <span>
                <span className="block text-xs text-muted-foreground">ก่อนหน้า</span>
                <span className="font-semibold">{prev.name}</span>
              </span>
            </a>
          )}
          <a
            href={`/c/${next.slug}`}
            className="group flex items-center justify-end gap-3 rounded-xl border p-4 text-right hover:bg-muted sm:col-start-2"
          >
            <span>
              <span className="block text-xs text-muted-foreground">ถัดไป</span>
              <span className="font-semibold">{next.name}</span>
            </span>
            <ChevronRight aria-hidden className="size-5 text-muted-foreground" />
          </a>
        </nav>
      )}
    </main>
  );
}
