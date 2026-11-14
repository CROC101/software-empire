import { useState } from "react";
import { ArrowRight, Clock, LayoutGrid, LockKeyhole, Star, Wifi, Zap } from "lucide-react";
import { readLang, type Lang } from "@empire/core/lang";
import { CraftLineup } from "@/components/apps/craft-lineup";
import { CRAFT_APPS } from "@/lib/craft-apps";
import { Link } from "react-router";
import { ToolCard, ToolGrid } from "@/components/tools/tool-card";
import { ToolSearch } from "@/components/tools/tool-search";
import { TOOLBOXES_HOME } from "@empire/core/cms-pages";
import { useCmsContent } from "@/lib/cms";
import { useSession } from "@/lib/session";
import { CATEGORIES } from "@/lib/tools/categories";
import { useFavorites, useRecent } from "@/lib/tools/prefs";
import { findTool, toolsIn, TOOLS } from "@/lib/tools/registry";
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

/// where each app tile floats round the hero
const TILE_SPOTS = [
  { top: "12%", left: "7%" },
  { top: "18%", right: "8%" },
  { bottom: "14%", left: "12%" },
  { bottom: "18%", right: "11%" },
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
        <section className="relative overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest px-5 py-14 text-center sm:px-10 sm:py-20">
          {/* the apps float round the hero (decoration; links are in the lineup below) */}
          <ul aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
            {CRAFT_APPS.slice(0, TILE_SPOTS.length).map((app, i) => (
              <li
                key={app.slug}
                className="float-tile water-tile absolute grid size-14 place-items-center rounded-xl shadow-md vt-live"
                style={{ ...TILE_SPOTS[i], animationDelay: `${i * -1.7}s` }}
              >
                <app.icon className="size-7" strokeWidth={1.75} />
              </li>
            ))}
          </ul>
          <p className="relative text-on-surface-variant">
            {name ? `สวัสดี ${name}` : "ยินดีต้อนรับ"}
          </p>
          <h1 className="relative mt-2 font-display text-4xl font-black leading-tight sm:text-6xl">
            {cms.text("hero.title")}
            <span className="block text-primary">{TOOLS.length} ชิ้นในที่เดียว</span>
          </h1>
          <p className="relative mx-auto mt-4 max-w-2xl text-lg text-on-surface-variant">
            {cms.text("hero.intro")}
          </p>
          <div className="relative mx-auto mt-7 max-w-2xl text-left">
            <ToolSearch autoFocus />
          </div>
          <div className="relative mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to="/apps"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary-container px-5 font-medium text-on-primary"
            >
              <LayoutGrid aria-hidden className="size-4" />
              ดูแอปทั้งหมด
            </Link>
            <Link
              to="/tools"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant px-5 hover:bg-surface-container"
            >
              เครื่องมือทั้งหมด
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <ul className="relative mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-on-surface-variant">
            <li className="flex items-center gap-2">
              <LockKeyhole aria-hidden className="size-4" />
              {cms.text("hero.perk1")}
            </li>
            <li className="flex items-center gap-2">
              <Zap aria-hidden className="size-4" />
              {cms.text("hero.perk2")}
            </li>
            <li className="flex items-center gap-2">
              <Wifi aria-hidden className="size-4" />
              {cms.text("hero.perk3")}
            </li>
          </ul>
        </section>

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
