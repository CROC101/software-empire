import { ArrowUpRight, Download, Globe, Package, Zap } from "lucide-react";
import type { Lang } from "@empire/core/lang";
import { CopyButton } from "@/components/tools/tool-output";
import { CRAFT_APPS, downloads, releaseUrl } from "@/lib/craft-apps";
import apps from "@/lib/apps.json";

const COPY = {
  web: { th: "เปิดในเว็บ", en: "Open on the web" },
  exe: { th: "ติดตั้ง EXE", en: "Install EXE" },
  msi: { th: "ตัวติดตั้ง MSI", en: "MSI installer" },
  zip: { th: "แบบพกพา ZIP", en: "Portable ZIP" },
  share: { th: "คัดลอกลิงก์", en: "Copy link" },
  webTag: { th: "เว็บ", en: "Web" },
  pro: { th: "ตัวเต็ม", en: "Pro" },
  light: { th: "ตัวเบา:", en: "Quick version:" },
  unsigned: {
    th: "ตัวติดตั้งยังไม่ได้เซ็น Windows จะเตือนตอนเปิดครั้งแรก",
    en: "The installer is unsigned, so Windows warns the first time.",
  },
  pwa: {
    th: "เปิดในเว็บแล้วกด ติดตั้งแอป ในเมนูเบราว์เซอร์ ก็ได้แอปบนเครื่องที่ใช้ออฟไลน์ได้ ล็อกอินแล้วงานซิงก์ข้ามเครื่องให้เอง",
    en: "Open one on the web and choose Install app in the browser menu to keep it on this device. Signed in, your work syncs across devices.",
  },
} satisfies Record<string, Record<Lang, string>>;

const button =
  "inline-flex min-h-10 items-center gap-2 rounded-lg border border-outline-variant px-4 text-sm hover:bg-surface-container";
const tag = "rounded-sm border border-outline-variant px-1.5 py-0.5 text-[11px]";

/** Lineup of crocwork's own apps, in a hairline grid (each card: number, kind, tile, name, actions,
 * and the quick everything app for the same job). */
export function CraftLineup({ lang }: { lang: Lang }) {
  return (
    <>
      <ul className="grid gap-px overflow-hidden rounded-xl border border-outline-variant bg-outline-variant sm:grid-cols-2 xl:grid-cols-4">
        {CRAFT_APPS.map((app, i) => {
          const exe = releaseUrl(app);
          const files = downloads(app);
          const light = apps.find((a) => a.slug === app.light);
          return (
            <li key={app.slug} className="flex flex-col bg-surface-container-lowest p-5">
              <div className="flex items-center justify-between gap-2 text-xs text-on-surface-variant">
                <span className="rounded-sm bg-primary-container px-1.5 py-0.5 font-mono text-[11px] tracking-[0.2em] text-on-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {app.kind[lang]}
                {app.repo && <span className={tag}>{COPY.pro[lang]}</span>}
              </div>
              <span className="water-tile mt-6 grid size-16 place-items-center rounded-xl shadow-sm">
                <app.icon aria-hidden className="size-8" strokeWidth={1.75} />
              </span>
              <h3 className="mt-5 font-display text-2xl font-black tracking-tight">
                crocwork <span className="text-primary">{app.word}</span>
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-on-surface-variant">
                {app.description[lang]}
              </p>
              <p className="mt-4 flex flex-wrap gap-1.5 text-on-surface-variant">
                {app.web && <span className={tag}>{COPY.webTag[lang]}</span>}
                {app.web && <span className={tag}>PWA</span>}
                {exe && <span className={tag}>Windows</span>}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {/* each app is its own static build, so a full page load */}
                {app.web && (
                  <a
                    href={app.web}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary-container px-4 text-sm font-medium text-on-primary"
                  >
                    <Globe aria-hidden className="size-4" />
                    {COPY.web[lang]}
                  </a>
                )}
                {app.web && (
                  <CopyButton
                    value={new URL(app.web, location.origin).href}
                    label={COPY.share[lang]}
                  />
                )}
                {files ? (
                  <>
                    <a href={files.msi} rel="noreferrer" className={button}>
                      <Download aria-hidden className="size-4" />
                      {COPY.msi[lang]}
                    </a>
                    <a href={files.zip} rel="noreferrer" className={button}>
                      <Package aria-hidden className="size-4" />
                      {COPY.zip[lang]}
                    </a>
                  </>
                ) : (
                  exe && (
                    <a href={exe} rel="noreferrer" className={button}>
                      <Download aria-hidden className="size-4" />
                      {COPY.exe[lang]}
                      <ArrowUpRight aria-hidden className="size-3.5" />
                    </a>
                  )
                )}
              </div>
              {light && (
                <a
                  href={`/apps/${light.slug}/`}
                  className="mt-4 inline-flex min-h-10 items-center gap-1.5 border-t border-outline-variant pt-3 text-sm text-on-surface-variant hover:text-primary"
                >
                  <Zap aria-hidden className="size-4 text-primary" />
                  {COPY.light[lang]}{" "}
                  <span className="font-medium text-on-surface">{light.name[lang]}</span>
                </a>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-on-surface-variant">
        {COPY.pwa[lang]} {COPY.unsigned[lang]}
      </p>
    </>
  );
}
