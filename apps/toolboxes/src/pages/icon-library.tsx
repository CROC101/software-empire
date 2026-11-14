import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Search } from "lucide-react";
import { readLang, type Lang } from "@empire/core/lang";

// public/icons is built by tools/icons.mjs: [slug, title, hex, licence, collection, categories, aliases]
type Row = [string, string, string, string, string, string, string];
type Text = Record<Lang, string>;

const COLLECTIONS: { key: string; name: Text }[] = [
  { key: "brands", name: { th: "แบรนด์", en: "Brands" } },
  { key: "auth-badges", name: { th: "ปุ่มล็อกอิน", en: "Sign-in badges" } },
  { key: "azure", name: { th: "Azure", en: "Azure" } },
  { key: "gcp", name: { th: "Google Cloud", en: "Google Cloud" } },
  { key: "k8s", name: { th: "Kubernetes", en: "Kubernetes" } },
  { key: "flags", name: { th: "ธงชาติ", en: "Flags" } },
  { key: "community", name: { th: "ชุมชน", en: "Community" } },
];

const COPY = {
  title: { th: "คลังไอคอน", en: "Icon library" },
  intro: {
    th: "โลโก้แบรนด์ ไอคอนคลาวด์ และธงชาติเป็น SVG กดเพื่อคัดลอกหรือดาวน์โหลด",
    en: "Brand logos, cloud icons and flags as SVG. Pick one to copy or download it.",
  },
  search: { th: "ค้นหาไอคอน", en: "Search icons" },
  all: { th: "ทั้งหมด", en: "All" },
  more: { th: "แสดงเพิ่ม", en: "Show more" },
  none: { th: "ไม่พบไอคอนที่ตรงกับคำค้น", en: "No icons match." },
  copy: { th: "คัดลอก SVG", en: "Copy SVG" },
  copied: { th: "คัดลอกแล้ว", en: "Copied" },
  download: { th: "ดาวน์โหลด", en: "Download" },
  licence: { th: "สัญญาอนุญาต", en: "Licence" },
  loading: { th: "กำลังโหลดไอคอน…", en: "Loading icons…" },
  trademark: {
    th: "ชื่อและโลโก้เป็นเครื่องหมายการค้าของเจ้าของแต่ละแบรนด์ ใช้เพื่ออ้างถึงแบรนด์นั้นเท่านั้น crocwork ไม่ได้เกี่ยวข้องหรือได้รับการรับรองจากแบรนด์ใด",
    en: "Names and logos are trademarks of their owners. Use them only to refer to that brand. crocwork is not affiliated with or endorsed by any of them.",
  },
  notice: { th: "ที่มาและสัญญาอนุญาต", en: "Sources and licences" },
} satisfies Record<string, Text>;

const PAGE = 120;
const chip = (on: boolean) =>
  `inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-sm whitespace-nowrap ${on ? "border-primary-container bg-primary-container text-on-primary" : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container"}`;

export function matches(row: Row, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [row[0], row[1], row[6], row[5]].some((f) => f.toLowerCase().includes(q));
}

export default function IconLibrary() {
  const [lang] = useState<Lang>(() => readLang(document.cookie));
  const [rows, setRows] = useState<Row[] | null>(null);
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState<string>();
  const [limit, setLimit] = useState(PAGE);
  const [picked, setPicked] = useState<Row>();
  const [copied, setCopied] = useState(false);
  const deferred = useDeferredValue(query);

  useEffect(() => {
    void fetch("/icons/index.json")
      .then((r) => r.json() as Promise<Row[]>)
      .then(setRows);
  }, []);

  const shown = useMemo(
    () => (rows ?? []).filter((r) => (!collection || r[4] === collection) && matches(r, deferred)),
    [rows, collection, deferred],
  );

  const copy = async (slug: string) => {
    const svg = await fetch(`/icons/${slug}.svg`).then((r) => r.text());
    await navigator.clipboard.writeText(svg);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main lang={lang} className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <p className="font-mono text-xs tracking-[0.2em] text-on-surface-variant uppercase">
          crocwork icons
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">{COPY.title[lang]}</h1>
        <p className="mt-2 max-w-2xl text-on-surface-variant">{COPY.intro[lang]}</p>

        <label className="mt-6 flex min-h-12 max-w-xl items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 focus-within:border-primary">
          <Search aria-hidden className="size-4 text-on-surface-variant" />
          <span className="sr-only">{COPY.search[lang]}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder={`${COPY.search[lang]} ${rows ? rows.length.toLocaleString() : ""}`}
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
        </label>

        <nav className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <button
            type="button"
            aria-pressed={!collection}
            onClick={() => setCollection(undefined)}
            className={chip(!collection)}
          >
            {COPY.all[lang]}
          </button>
          {COLLECTIONS.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={collection === c.key}
              onClick={() => {
                setCollection(c.key);
                setLimit(PAGE);
              }}
              className={chip(collection === c.key)}
            >
              {c.name[lang]}
            </button>
          ))}
        </nav>

        {picked && (
          <section
            aria-live="polite"
            className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4"
          >
            <img
              src={`/icons/${picked[0]}.svg`}
              alt=""
              className="size-20 rounded-xl bg-white p-3"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">{picked[1]}</h2>
              <p className="font-mono text-xs text-on-surface-variant">
                {picked[0]}.svg{picked[2] && ` · #${picked[2]}`} · {COPY.licence[lang]} {picked[3]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copy(picked[0])}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary-container px-4 text-sm text-on-primary"
            >
              {copied ? (
                <Check aria-hidden className="size-4" />
              ) : (
                <Copy aria-hidden className="size-4" />
              )}
              {copied ? COPY.copied[lang] : COPY.copy[lang]}
            </button>
            <a
              href={`/icons/${picked[0]}.svg`}
              download
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-outline-variant px-4 text-sm hover:bg-surface-container"
            >
              <Download aria-hidden className="size-4" />
              {COPY.download[lang]}
            </a>
          </section>
        )}

        {!rows ? (
          <p role="status" className="mt-8 text-on-surface-variant">
            {COPY.loading[lang]}
          </p>
        ) : shown.length === 0 ? (
          <p className="mt-8 text-on-surface-variant">{COPY.none[lang]}</p>
        ) : (
          <ul className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
            {shown.slice(0, limit).map((r) => (
              <li key={r[0]}>
                <button
                  type="button"
                  aria-pressed={picked?.[0] === r[0]}
                  onClick={() => setPicked(r)}
                  className="lift flex w-full flex-col items-center gap-2 rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-3 aria-pressed:border-primary"
                >
                  <img
                    src={`/icons/${r[0]}.svg`}
                    alt=""
                    loading="lazy"
                    className="size-10 object-contain"
                  />
                  <span className="line-clamp-1 w-full text-center text-xs">{r[1]}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {shown.length > limit && (
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE)}
            className="mt-6 min-h-11 rounded-lg border border-outline-variant px-6 text-sm hover:bg-surface-container"
          >
            {COPY.more[lang]} ({(shown.length - limit).toLocaleString()})
          </button>
        )}

        <p className="mt-10 max-w-3xl text-sm text-on-surface-variant">
          {COPY.trademark[lang]} ·{" "}
          <a
            href="/icons/NOTICE.txt"
            className="font-medium text-primary underline underline-offset-4"
          >
            {COPY.notice[lang]}
          </a>
        </p>
      </div>
    </main>
  );
}
