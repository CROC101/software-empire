import { useState } from "react";
import { ArrowRight, Clock, Star } from "lucide-react";
import { readLang, type Lang } from "@empire/core/lang";
import { CraftLineup } from "@/components/apps/craft-lineup";
import { Link } from "react-router";
import { ToolCard, ToolGrid } from "@/components/tools/tool-card";
import { HomeHero } from "./home-hero";
import { TOOLBOXES_HOME } from "@empire/core/cms-pages";
import { useCmsContent } from "@/lib/cms";
import { useSession } from "@/lib/session";
import { CATEGORIES } from "@/lib/tools/categories";
import { useFavorites, useRecent } from "@/lib/tools/prefs";
import { findTool, toolsIn } from "@/lib/tools/registry";
import type { Tool } from "@/lib/tools/types";

/// ทางลัดที่ทีมเลือกให้ (ไม่ได้อ้างว่าเป็นสถิติยอดนิยม)
const PICKS = [
  "json-formatter",
  "qr-code-generator",
  "word-counter",
  "password-generator",
  "gpa-calculator",
  "image-compressor",
  "pdf-to-word",
  "timestamp-converter",
];

function resolve(slugs: readonly string[]): Tool[] {
  return slugs.map((s) => findTool(s)).filter((t): t is Tool => Boolean(t));
}

export function HomeView() {
  const { user } = useSession();
  const { favorites } = useFavorites();
  const { recent } = useRecent();
  const favoriteTools = resolve(favorites);
  const recentTools = resolve(recent).slice(0, 8);
  const name = user?.email?.split("@")[0];
  const cms = useCmsContent(TOOLBOXES_HOME);
  const [lang] = useState<Lang>(() => readLang(document.cookie));

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <HomeHero
          name={name}
          title={cms.text("hero.title")}
          intro={cms.text("hero.intro")}
          perks={[cms.text("hero.perk1"), cms.text("hero.perk2"), cms.text("hero.perk3")]}
        />

        <section aria-labelledby="lineup" className="mt-12">
          <p className="font-mono text-xs tracking-[0.2em] text-on-surface-variant uppercase">
            01 / lineup
          </p>
          <h2 id="lineup" className="mt-1 mb-5 font-display text-2xl font-black">
            แอปหลัก ใช้ในเว็บหรือติดตั้งลงเครื่อง
          </h2>
          <CraftLineup lang={lang} />
        </section>

        {recentTools.length > 0 && (
          <section aria-labelledby="recent" className="mt-10">
            <h2 id="recent" className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Clock aria-hidden className="size-5 text-primary" />
              ใช้ล่าสุด
            </h2>
            <ToolGrid tools={recentTools} />
          </section>
        )}

        {favoriteTools.length > 0 && (
          <section aria-labelledby="favorites" className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 id="favorites" className="flex items-center gap-2 text-xl font-bold">
                <Star aria-hidden className="size-5 text-brand-amber" />
                รายการโปรด
              </h2>
              <Link
                to="/favorites"
                className="inline-flex min-h-10 items-center gap-1 text-primary-container hover:underline"
              >
                ดูทั้งหมด
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <ToolGrid tools={favoriteTools.slice(0, 8)} />
          </section>
        )}

        <section aria-labelledby="picks" className="mt-10">
          <h2 id="picks" className="mb-1 text-xl font-bold">
            แนะนำให้ลอง
          </h2>
          <p className="mb-4 text-on-surface-variant">
            กดดาวที่การ์ดเพื่อเก็บเครื่องมือที่ใช้บ่อยไว้ในรายการโปรด
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {resolve(PICKS).map((tool) => (
              <li key={tool.slug}>
                <ToolCard tool={tool} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="categories" className="mt-12">
          <h2 id="categories" className="mb-4 text-xl font-bold">
            หมวดหมู่
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {CATEGORIES.map((c) => (
              <li key={c.key}>
                <Link
                  to={`/category/${c.key}`}
                  className="lift flex h-full items-start gap-3 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4"
                >
                  <span className="brand-gradient grid size-11 shrink-0 place-items-center rounded-xl text-primary-foreground">
                    <c.icon aria-hidden className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-baseline gap-2 font-semibold">
                      {c.label}
                      <span className="text-sm font-normal text-on-surface-variant">
                        {toolsIn(c.key).length} ชิ้น
                      </span>
                    </span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-on-surface-variant">
                      {c.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {CATEGORIES.map((c) => (
          <section key={c.key} aria-labelledby={`cat-${c.key}`} className="mt-12">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 id={`cat-${c.key}`} className="flex items-center gap-2 text-xl font-bold">
                <c.icon aria-hidden className="size-5 text-primary" />
                {c.label}
              </h2>
              <Link
                to={`/category/${c.key}`}
                className="inline-flex min-h-10 items-center gap-1 text-primary-container hover:underline"
              >
                ทั้งหมด {toolsIn(c.key).length}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <ToolGrid tools={toolsIn(c.key).slice(0, 8)} />
          </section>
        ))}
      </div>
    </main>
  );
}
