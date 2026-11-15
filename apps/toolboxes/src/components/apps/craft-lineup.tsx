import type { CSSProperties } from "react";
import { ArrowUpRight, Download, Globe, MessagesSquare, Package, Zap } from "lucide-react";
import type { Lang } from "@empire/core/lang";
import { CraftTile } from "@/components/apps/craft-tile";
import { FavoriteButton } from "@/components/tools/tool-card";
import { CopyButton } from "@/components/tools/tool-output";
import { CRAFT_APPS, craftHue, craftShot, downloads, releaseUrl } from "@/lib/craft-apps";
import apps from "@/lib/apps.json";
import { logVisit } from "@/lib/history";

const COPY = {
  web: { th: "เปิดในเว็บ", en: "Open on the web" },
  exe: { th: "ติดตั้ง EXE", en: "Install EXE" },
  msi: { th: "MSI", en: "MSI" },
  zip: { th: "ZIP พกพา", en: "Portable ZIP" },
  share: { th: "คัดลอกลิงก์", en: "Copy link" },
  guide: { th: "อ่านคู่มือ", en: "Read the guide" },
  explore: { th: "เปิด crocwork", en: "Explore crocwork" },
  ready: { th: "พร้อมใช้", en: "Ready" },
  installers: { th: "มีตัวติดตั้ง", en: "Installers ready" },
  light: { th: "ตัวเบา:", en: "Quick version:" },
  moreTitle: { th: "แอปใหม่กำลังมา", en: "More apps on the way" },
  moreBody: {
    th: "บอกเราใน Discord ว่าอยากได้แอปอะไรต่อ",
    en: "Tell us on the Discord which app you want next.",
  },
  discord: { th: "เข้า Discord", en: "Join the Discord" },
  unsigned: {
    th: "ตัวติดตั้งยังไม่ได้เซ็น Windows จะเตือนตอนเปิดครั้งแรก",
    en: "The installer is unsigned, so Windows warns the first time.",
  },
  pwa: {
    th: "เปิดในเว็บแล้วกด ติดตั้งแอป ในเมนูเบราว์เซอร์ ก็ได้แอปบนเครื่องที่ใช้ออฟไลน์ได้ ล็อกอินแล้วงานซิงก์ข้ามเครื่องให้เอง",
    en: "Open one on the web and choose Install app in the browser menu to keep it on this device. Signed in, your work syncs across devices.",
  },
} satisfies Record<string, Record<Lang, string>>;

const link =
  "inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-outline-variant px-3 text-sm hover:bg-surface-container";
const tag = "rounded-sm border px-1.5 py-0.5 font-mono text-[11px] tracking-wider uppercase";
const hueTag = `${tag} border-[color-mix(in_oklab,var(--hue)_45%,transparent)] text-(--hue)`;

/** The lineup: one card per crocwork app (number in the app's colour, a screenshot with the tile
 *  over its edge, the two-tone name, tags, downloads, then the light app for the same job). */
export function CraftLineup({ lang, more }: { lang: Lang; more?: string }) {
  return (
    <>
      <ul className="grid gap-px overflow-hidden rounded-xl border border-outline-variant bg-outline-variant sm:grid-cols-2 xl:grid-cols-4">
        {CRAFT_APPS.map((app, i) => {
          const exe = releaseUrl(app);
          const files = downloads(app);
          const light = apps.find((a) => a.slug === app.light);
          const shot = craftShot(app.slug);
          const explore = app.web ?? `/craft/guide/#${app.slug}`;
          const logDownload = () => logVisit(`craft-${app.slug}`, "download");
          return (
            <li
              key={app.slug}
              id={`app-${app.slug}`}
              className="ch-card flex scroll-mt-24 flex-col bg-surface-container-lowest"
              style={{ "--hue": craftHue(app.slug) } as CSSProperties}
            >
              <div className="flex items-center gap-3 py-1 pr-1 pl-5">
                <span className="rounded-sm bg-(--hue) px-1.5 py-0.5 font-mono text-[11px] text-white">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-xs text-on-surface-variant">{app.kind[lang]}</span>
                <FavoriteButton id={`craft-${app.slug}`} name={`crocwork ${app.word}`} />
              </div>
              <div className="relative aspect-[8/5] overflow-hidden border-y border-outline-variant bg-[color-mix(in_oklab,var(--hue)_14%,var(--color-surface-container))]">
                {shot ? (
                  <img
                    src={shot}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={800}
                    height={500}
                    className="ch-shot size-full object-cover object-top"
                  />
                ) : (
                  <WindowSketch />
                )}
              </div>
              <div className="flex flex-1 flex-col px-5 pb-5">
                {/* positioned so it paints over the screenshot box above it */}
                <div className="relative z-10 -mt-9 mb-4">
                  <CraftTile app={app} size={64} />
                </div>
                <h3 className="font-display text-2xl font-black tracking-tight">
                  crocwork <span className="text-(--hue)">{app.word}</span>
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-on-surface-variant">
                  {app.description[lang]}
                </p>
                <p className="mt-4 flex flex-wrap gap-1.5 text-on-surface-variant">
                  {app.web && <span className={hueTag}>{COPY.ready[lang]}</span>}
                  {exe && <span className={hueTag}>{COPY.installers[lang]}</span>}
                  {app.web && <span className={`${tag} border-outline-variant`}>Web</span>}
                  {app.web && <span className={`${tag} border-outline-variant`}>PWA</span>}
                  {exe && <span className={`${tag} border-outline-variant`}>Windows</span>}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {app.web && (
                    <CopyButton
                      value={new URL(app.web, location.origin).href}
                      label={COPY.share[lang]}
                    />
                  )}
                  {files ? (
                    <>
                      <a href={files.msi} rel="noreferrer" className={link} onClick={logDownload}>
                        <Download aria-hidden className="size-4" />
                        {COPY.msi[lang]}
                      </a>
                      {files.setup && (
                        <a
                          href={files.setup}
                          rel="noreferrer"
                          className={link}
                          onClick={logDownload}
                        >
                          <Download aria-hidden className="size-4" />
                          {COPY.exe[lang]}
                        </a>
                      )}
                      {files.zip && (
                        <a href={files.zip} rel="noreferrer" className={link} onClick={logDownload}>
                          <Package aria-hidden className="size-4" />
                          {COPY.zip[lang]}
                        </a>
                      )}
                    </>
                  ) : (
                    exe && (
                      <a href={exe} rel="noreferrer" className={link} onClick={logDownload}>
                        <Download aria-hidden className="size-4" />
                        {COPY.exe[lang]}
                      </a>
                    )
                  )}
                </div>
                {light && (
                  <a
                    href={`/apps/${light.slug}/`}
                    className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary"
                  >
                    <Zap aria-hidden className="size-4 text-(--hue)" />
                    {COPY.light[lang]}{" "}
                    <span className="font-medium text-on-surface">{light.name[lang]}</span>
                  </a>
                )}
                {/* each app is its own static build, so a full page load */}
                <a
                  href={explore}
                  className="mt-4 inline-flex min-h-10 items-center justify-between gap-2 border-t border-outline-variant pt-3 text-sm font-medium hover:text-(--hue)"
                >
                  <span className="inline-flex items-center gap-2">
                    {app.web && <Globe aria-hidden className="size-4" />}
                    {app.web ? COPY.web[lang] : `${COPY.explore[lang]} ${app.word}`}
                  </span>
                  <ArrowUpRight aria-hidden className="size-4" />
                </a>
              </div>
            </li>
          );
        })}
        {more && (
          <li className="flex flex-col items-start justify-center gap-4 bg-surface-container-lowest p-6 xl:col-span-3">
            <p className="font-mono text-xs tracking-[0.2em] text-on-surface-variant uppercase">
              Next up
            </p>
            <h3 className="font-display text-2xl font-black">{COPY.moreTitle[lang]}</h3>
            <p className="text-sm text-on-surface-variant">{COPY.moreBody[lang]}</p>
            <a href={more} rel="noreferrer" className={link}>
              <MessagesSquare aria-hidden className="size-4" />
              {COPY.discord[lang]}
            </a>
          </li>
        )}
      </ul>
      <p className="mt-3 text-xs text-on-surface-variant">
        {COPY.pwa[lang]} {COPY.unsigned[lang]}{" "}
        <a href="/craft/guide/" className="font-medium text-primary underline underline-offset-4">
          {COPY.guide[lang]}
        </a>
      </p>
    </>
  );
}

/** Stand-in for apps with no screenshot yet (desktop-only ones): a plain app window in the app's colour. */
function WindowSketch() {
  return (
    <div
      aria-hidden
      className="absolute inset-[8%_8%_0] flex flex-col overflow-hidden rounded-t-lg border border-b-0 border-outline-variant bg-surface-container-lowest shadow-lg"
    >
      <div className="flex h-5 shrink-0 items-center gap-1 border-b border-outline-variant px-2">
        <span className="size-1.5 rounded-full bg-outline-variant" />
        <span className="size-1.5 rounded-full bg-outline-variant" />
        <span className="size-1.5 rounded-full bg-outline-variant" />
      </div>
      <div className="flex flex-1">
        <div className="w-[9%] border-r border-outline-variant" />
        <div className="m-[4%] flex-1 rounded-sm bg-[linear-gradient(160deg,var(--hue),color-mix(in_oklab,var(--hue)_35%,var(--em-ink-975)))]" />
        <div className="w-[18%] border-l border-outline-variant" />
      </div>
    </div>
  );
}
