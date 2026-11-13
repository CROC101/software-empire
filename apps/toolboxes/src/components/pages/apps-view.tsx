import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  Briefcase,
  Cog,
  FileText,
  Gamepad2,
  Palette,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { readLang, setLang, type Lang } from "@empire/core/lang";
import apps from "@/lib/apps.json";

type Text = Record<Lang, string>;
export const CATEGORIES: { key: string; icon: LucideIcon; name: Text }[] = [
  { key: "documents", icon: FileText, name: { th: "เอกสาร", en: "Documents" } },
  { key: "business", icon: Briefcase, name: { th: "ธุรกิจและการเงิน", en: "Business & finance" } },
  { key: "team", icon: Users, name: { th: "ทีมและลูกค้า", en: "Team & customers" } },
  { key: "operations", icon: Truck, name: { th: "งานปฏิบัติการ", en: "Operations" } },
  { key: "media", icon: Palette, name: { th: "สื่อและออกแบบ", en: "Media & design" } },
  { key: "engineering", icon: Cog, name: { th: "วิศวกรรม", en: "Engineering" } },
  { key: "games", icon: Gamepad2, name: { th: "เกม", en: "Games" } },
];

const COPY = {
  title: { th: "แอปทำงานครบชุด", en: "Work apps" },
  intro: {
    th: "แอปสำหรับงานเอกสาร ธุรกิจ ทีม และอื่นๆ เปิดใช้ได้ทันที ข้อมูลเก็บในเบราว์เซอร์นี้เท่านั้น",
    en: "Apps for documents, business, teams and more, ready to open. Your data stays in this browser.",
  },
  all: { th: "ทั้งหมด", en: "All" },
  categories: { th: "หมวดหมู่", en: "Categories" },
  apps: { th: "แอป", en: "apps" },
  notices: { th: "ประกาศซอฟต์แวร์บุคคลที่สาม", en: "Third-party notices" },
} satisfies Record<string, Text>;

const chip = (on: boolean) =>
  `inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm whitespace-nowrap ${on ? "border-primary-container bg-primary-container text-on-primary" : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container"}`;

// Each app is a separate static build under /apps/<slug>/, so links are full page loads.
export function AppsView() {
  const [lang, setLangState] = useState<Lang>(() => readLang(document.cookie));
  const [params, setParams] = useSearchParams();
  const picked = CATEGORIES.find((c) => c.key === params.get("c"));
  const shown = picked ? [picked] : CATEGORIES;

  const pick = (key?: string) =>
    setParams(key ? { c: key } : {}, { replace: true, preventScrollReset: true });
  const switchLang = (next: Lang) => {
    setLang(next, import.meta.env.VITE_COOKIE_DOMAIN);
    setLangState(next);
  };

  return (
    <main lang={lang} className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-on-surface-variant uppercase">
              crocwork apps
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold">{COPY.title[lang]}</h1>
            <p className="mt-2 max-w-2xl text-on-surface-variant">{COPY.intro[lang]}</p>
          </div>
          <div
            role="group"
            aria-label="Language / ภาษา"
            className="inline-flex rounded-full border border-outline-variant bg-surface-container-lowest p-1 text-sm"
          >
            {(["th", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={lang === l}
                onClick={() => switchLang(l)}
                className={`min-h-9 rounded-full px-4 ${lang === l ? "bg-primary-container text-on-primary" : "hover:bg-surface-container"}`}
              >
                {l === "th" ? "ไทย" : "English"}
              </button>
            ))}
          </div>
        </header>

        <nav
          aria-label={COPY.categories[lang]}
          className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          <button
            type="button"
            aria-pressed={!picked}
            onClick={() => pick()}
            className={chip(!picked)}
          >
            {COPY.all[lang]} {apps.length}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={picked === c}
              onClick={() => pick(c.key)}
              className={chip(picked === c)}
            >
              <c.icon aria-hidden className="size-4" />
              {c.name[lang]} {apps.filter((a) => a.category === c.key).length}
            </button>
          ))}
        </nav>

        {shown.map((c) => (
          <section key={c.key} aria-labelledby={`cat-${c.key}`} className="mt-8">
            <h2 id={`cat-${c.key}`} className="flex items-center gap-2 text-lg font-semibold">
              <c.icon aria-hidden className="size-5 text-primary" />
              {c.name[lang]}
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {apps
                .filter((a) => a.category === c.key)
                .map((app) => (
                  <li key={app.slug}>
                    <a
                      href={`/apps/${app.slug}/`}
                      className="lift flex h-full min-h-24 gap-3 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-container/15 text-primary">
                        <c.icon aria-hidden className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold leading-snug text-on-surface">
                          {app.name[lang]}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-on-surface-variant">
                          {app.description[lang]}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
            </ul>
          </section>
        ))}

        <p className="mt-10 text-sm text-on-surface-variant">
          © crocwork ·{" "}
          <a
            href="/apps/THIRD_PARTY_NOTICES.txt"
            className="font-medium text-primary underline underline-offset-4"
          >
            {COPY.notices[lang]}
          </a>
        </p>
      </div>
    </main>
  );
}
