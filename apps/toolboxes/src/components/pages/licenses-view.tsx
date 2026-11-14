import { readLang, type Lang } from "@empire/core/lang";
import { SOURCE_URL } from "@/components/pages/apps-view";
import apps from "@/lib/apps.json";
import { CRAFT_APPS } from "@/lib/craft-apps";

const COPY = {
  title: { th: "สัญญาอนุญาต", en: "Licences" },
  lead: {
    th: "แอปใน toolboxes บางส่วนสร้างต่อจากโค้ดโอเพนซอร์ส ไฟล์สัญญาอนุญาตทุกฉบับอยู่ในเว็บนี้ และซอร์สของเราเปิดให้ดูที่ GitHub ของ crocwork",
    en: "Some apps in toolboxes are built on open-source code. Every licence file is kept on this site, and our source is open on crocwork's GitHub.",
  },
  craft: { th: "แอป crocwork ตัวเต็ม", en: "crocwork Pro apps" },
  craftNote: {
    th: "ใช้ได้ทั้ง MIT และ Apache-2.0 เลือกฉบับใดก็ได้",
    en: "Dual licensed: MIT or Apache-2.0, at your option.",
  },
  apps: { th: "แอปทำงานครบชุด", en: "Everyday apps" },
  appsNote: {
    th: "ลิขสิทธิ์ crocwork ส่วนโค้ดต้นทางที่ใช้ MIT มีประกาศครบในไฟล์ประกาศ",
    en: "Copyright crocwork; the MIT notices of the code they came from are in the notices file.",
  },
  agpl: {
    th: "แอปเหล่านี้ใช้ AGPL-3.0 คุณมีสิทธิ์ได้ซอร์สทั้งหมด",
    en: "These apps are AGPL-3.0: you are entitled to their full source.",
  },
  icons: { th: "คลังไอคอน", en: "Icon library" },
  iconsNote: {
    th: "เฉพาะไอคอนที่สัญญาอนุญาตให้แจกต่อ แต่ละไอคอนระบุที่มาในไฟล์ประกาศ",
    en: "Only icons whose licence allows redistribution; each one is credited in the notice.",
  },
  source: { th: "ซอร์สโค้ด", en: "Source code" },
  licence: { th: "สัญญาอนุญาต", en: "Licence" },
  notices: { th: "ประกาศสัญญาอนุญาต", en: "Licence notices" },
} satisfies Record<string, Record<Lang, string>>;

const link = "font-medium text-primary underline underline-offset-4";

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-outline-variant py-8">
      <h2 className="font-display text-2xl font-black">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{note}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** /licenses: every licence file kept on this site, and links to crocwork's own source only. */
export function LicensesView() {
  const lang = readLang(document.cookie);
  const agpl = apps.filter((a) => "licence" in a);
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-on-surface-variant">
        Licenses
      </p>
      <h1 className="mt-3 font-display text-4xl font-black sm:text-5xl">{COPY.title[lang]}</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-on-surface-variant">{COPY.lead[lang]}</p>

      <div className="mt-10">
        <Section title={COPY.craft[lang]} note={COPY.craftNote[lang]}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {CRAFT_APPS.filter((a) => a.repo).map((a) => (
              <li key={a.slug} className="text-sm">
                <span className="font-semibold">crocwork {a.word}</span>
                <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {a.web && (
                    <>
                      <a href={`${a.web}LICENSE-MIT`} className={link}>
                        MIT
                      </a>
                      <a href={`${a.web}LICENSE-APACHE`} className={link}>
                        Apache-2.0
                      </a>
                    </>
                  )}
                  <a href={`https://github.com/${a.repo ?? ""}`} rel="noreferrer" className={link}>
                    {COPY.source[lang]}
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={COPY.apps[lang]} note={COPY.appsNote[lang]}>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a href="/apps/LICENSE" className={link}>
              {COPY.licence[lang]}
            </a>
            <a href="/apps/THIRD_PARTY_NOTICES.txt" className={link}>
              {COPY.notices[lang]}
            </a>
          </p>
          <p className="mt-6 text-sm text-on-surface-variant">
            {COPY.agpl[lang]}{" "}
            <a href={SOURCE_URL} rel="noreferrer" className={link}>
              {COPY.source[lang]}
            </a>
          </p>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {agpl.map((a) => (
              <li key={a.slug}>
                <a
                  href={`/apps/${a.slug}/LICENSE`}
                  className="inline-flex min-h-10 items-center rounded-lg border border-outline-variant px-3 hover:bg-surface-container"
                >
                  {a.name[lang]} · AGPL-3.0
                </a>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={COPY.icons[lang]} note={COPY.iconsNote[lang]}>
          <a href="/icons/NOTICE.txt" className={`${link} text-sm`}>
            {COPY.notices[lang]}
          </a>
        </Section>
      </div>
    </main>
  );
}
