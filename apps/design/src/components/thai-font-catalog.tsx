"use client";

import { NimbusNavbar, type NimbusFx } from "@empire/ui";
import {
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Download,
  Languages,
  PenTool,
  Search,
  Shapes,
  SlidersHorizontal,
  Smile,
  Tags,
  X,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { InView } from "@/components/in-view";
import { useNimbus } from "@/components/library-state";
import { RescueNote } from "@/components/rescue-note";
import {
  LICENCES,
  PAGE,
  designers,
  downloadUrl,
  emptyState,
  facets,
  imageUrl,
  licenceCounts,
  licenceOf,
  parseIndex,
  postUrl,
  readState,
  searchThai,
  tagCounts,
  writeState,
  years,
  type ThaiFont,
  type ThaiIndex,
  type ThaiState,
} from "@/lib/thai-fonts";

const chip =
  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background";
const field =
  "h-10 rounded-md border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";
// one water-drop item per filter group; the phone bar opens one group at a time
const groupIcon: Record<string, [React.ReactNode, NimbusFx]> = {
  แบบตัวอักษร: [<PenTool key="i" aria-hidden />, "wave"],
  รูปทรงและน้ำหนัก: [<Shapes key="i" aria-hidden />, "spin"],
  อารมณ์: [<Smile key="i" aria-hidden />, "pop"],
  เหมาะกับงาน: [<Briefcase key="i" aria-hidden />, "drop"],
  กลิ่นอายภาษา: [<Languages key="i" aria-hidden />, "glow"],
};

const link =
  "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring";

/** The f0nt.com index with search, licence, tag, year and designer filters; state lives in the URL. */
export function ThaiFontCatalog() {
  const [index, setIndex] = useState<ThaiIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [state, setState] = useState<ThaiState>(emptyState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // the URL is read once the list arrives (after hydration, so server and client HTML match);
    // anything typed while it loaded wins over the URL
    const fromUrl = () => {
      setState((s) => (s === emptyState ? readState(location.search) : s));
      setReady(true);
    };
    fetch("/data/f0nt.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((raw: unknown) => {
        fromUrl();
        const parsed = parseIndex(raw);
        if (parsed) setIndex(parsed);
        else setFailed(true);
      })
      .catch(() => {
        fromUrl();
        setFailed(true);
      });
  }, []);

  // replaceState keeps reload and back on the same filters and the same number of cards
  useEffect(() => {
    if (!ready) return;
    const next = `${location.pathname}${writeState(state)}${location.hash}`;
    if (next !== `${location.pathname}${location.search}${location.hash}`)
      history.replaceState(history.state, "", next);
  }, [state, ready]);

  const q = useDeferredValue(state.q);
  const view = useMemo(() => ({ ...state, q }), [state, q]);
  const { items: list, rescue } = useMemo(
    () => (index ? searchThai(index, view) : { items: [], rescue: null }),
    [index, view],
  );
  const { phone, tone } = useNimbus();
  const [pane, setPane] = useState(0);
  const counts = useMemo(() => (index ? tagCounts(index, view) : new Map()), [index, view]);
  const lic = useMemo(() => (index ? licenceCounts(index, view) : null), [index, view]);
  const groups = useMemo(() => (index ? facets(index) : []), [index]);
  const yearList = useMemo(() => (index ? years(index) : []), [index]);
  const people = useMemo(() => (index ? designers(index) : []), [index]);

  const set = (patch: Partial<ThaiState>) => setState((s) => ({ ...s, n: PAGE, ...patch }));
  const toggleTag = (id: number) =>
    set({ t: state.t.includes(id) ? state.t.filter((x) => x !== id) : [...state.t, id] });
  const toggleLicence = (k: string) =>
    set({
      l: state.l.includes(k) ? state.l.replace(k, "") : (state.l + k).split("").sort().join(""),
    });
  const active = state.l.length + state.t.length + (state.y ? 1 : 0) + (state.a ? 1 : 0);

  if (failed)
    return (
      <p className="border-t py-10 text-muted-foreground">
        โหลดรายชื่อฟอนต์ไม่สำเร็จ ลองรีเฟรชหน้านี้อีกครั้ง หรือเปิด{" "}
        <a href="https://www.f0nt.com/" className="underline underline-offset-4">
          f0nt.com
        </a>{" "}
        โดยตรง
      </p>
    );

  const sections: { label: string; icon: React.ReactNode; fx: NimbusFx; body: React.ReactNode }[] =
    [
      {
        label: "สัญญาอนุญาต",
        icon: <BadgeCheck aria-hidden />,
        fx: "glow",
        body: (
          <div className="flex flex-col gap-2">
            {LICENCES.map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={state.l.includes(k)}
                  onChange={() => toggleLicence(k)}
                  className="size-4 accent-(--em-blue-600)"
                />
                <span className="flex-1">{label}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{lic?.[k] ?? ""}</span>
              </label>
            ))}
          </div>
        ),
      },
      {
        label: "ปีและผู้ออกแบบ",
        icon: <CalendarDays aria-hidden />,
        fx: "pop",
        body: (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              ปีที่ลง
              <select
                value={state.y}
                onChange={(e) => set({ y: e.target.value })}
                className={`${field} font-normal`}
              >
                <option value="">ทุกปี</option>
                {yearList.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              ผู้ออกแบบ
              <select
                value={state.a || ""}
                onChange={(e) => set({ a: Number(e.target.value) || 0 })}
                className={`${field} min-w-0 font-normal`}
              >
                <option value="">ทุกคน</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.count})
                  </option>
                ))}
              </select>
            </label>
          </div>
        ),
      },
      ...groups.flatMap((g) => {
        const shown = g.tags.filter((t) => state.t.includes(t.id) || (counts.get(t.id) ?? 0) > 0);
        if (!shown.length) return [];
        const [icon, fx] = groupIcon[g.label] ?? [<Tags key="i" aria-hidden />, "wave" as const];
        return [
          {
            label: g.label,
            icon,
            fx,
            body: (
              <div className="flex flex-wrap gap-2">
                {shown.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={state.t.includes(t.id)}
                    onClick={() => toggleTag(t.id)}
                    className={chip}
                  >
                    {t.name}
                    <span className="text-xs opacity-60 tabular-nums">{counts.get(t.id) ?? 0}</span>
                  </button>
                ))}
              </div>
            ),
          },
        ];
      }),
    ];
  // a group can empty out under the other picks; fall back to the closed bar instead of a stale pane
  const open = pane > 0 ? sections[pane - 1] : undefined;

  return (
    <div className="lg:grid lg:grid-cols-[17rem_1fr] lg:gap-10">
      <aside className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pr-2 pb-6">
          <div className="flex flex-col gap-8">
            {sections.map((x) => (
              <fieldset key={x.label}>
                <legend className="mb-3 text-sm font-medium">{x.label}</legend>
                {x.body}
              </fieldset>
            ))}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="vt-top sticky top-16 z-20 -mx-4 flex flex-wrap items-center gap-2 border-b bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <label className="relative min-w-0 flex-1 basis-56">
            <span className="sr-only">ค้นหาฟอนต์</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={state.q}
              onChange={(e) => set({ q: e.target.value.slice(0, 60) })}
              placeholder="ชื่อฟอนต์ ผู้ออกแบบ หรือแท็ก"
              className={`${field} w-full pl-9`}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only">เรียงตาม</span>
            <select
              value={state.sort}
              onChange={(e) => set({ sort: e.target.value as ThaiState["sort"] })}
              className={field}
            >
              <option value="new">ใหม่ล่าสุด</option>
              <option value="old">เก่าสุด</option>
              <option value="az">ก-ฮ</option>
            </select>
          </label>
          {index && (
            <div className="-mx-4 -my-1 basis-full overflow-x-auto px-4 py-3.5 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:hidden">
              {/* water-drop bar of the filter groups (the old drawer sat inside this blurred bar, whose backdrop-filter trapped its fixed panel, so it never showed on phones) */}
              <div className="mx-auto w-max">
                <NimbusNavbar
                  key={sections.length}
                  label="ตัวกรอง"
                  items={[
                    {
                      label: active ? `ตัวกรอง ${active}` : "ตัวกรอง",
                      icon: <SlidersHorizontal aria-hidden />,
                      fx: "drop",
                    },
                    ...sections.map(({ label, icon, fx }) => ({ label, icon, fx })),
                  ]}
                  active={open ? pane : 0}
                  compact={phone}
                  tone={tone}
                  onChange={setPane}
                />
              </div>
            </div>
          )}
          {open && (
            <fieldset className="max-h-[45dvh] basis-full overflow-y-auto pb-2 lg:hidden">
              <legend className="mb-3 flex w-full items-center justify-between text-sm font-medium">
                {open.label}
                <button
                  type="button"
                  onClick={() => setPane(0)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X aria-label="ปิดตัวกรอง" className="size-4" />
                </button>
              </legend>
              {open.body}
            </fieldset>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 py-4">
          <p className="mr-2 text-sm text-muted-foreground tabular-nums" aria-live="polite">
            {index ? `${list.length.toLocaleString("th")} ฟอนต์` : "กำลังโหลดรายชื่อฟอนต์"}
          </p>
          {state.l &&
            LICENCES.filter(([k]) => state.l.includes(k)).map(([k, , short]) => (
              <button key={k} type="button" onClick={() => toggleLicence(k)} className={chip}>
                {short}
                <X aria-label="เอาออก" className="size-3.5" />
              </button>
            ))}
          {state.t.map((id) => (
            <button key={id} type="button" onClick={() => toggleTag(id)} className={chip}>
              {(index?.tags[id] ?? [id])[0]}
              <X aria-label="เอาออก" className="size-3.5" />
            </button>
          ))}
          {state.y && (
            <button type="button" onClick={() => set({ y: "" })} className={chip}>
              ปี {state.y}
              <X aria-label="เอาออก" className="size-3.5" />
            </button>
          )}
          {state.a > 0 && (
            <button type="button" onClick={() => set({ a: 0 })} className={chip}>
              {index?.authors[state.a] ?? "ผู้ออกแบบ"}
              <X aria-label="เอาออก" className="size-3.5" />
            </button>
          )}
          {(active > 0 || state.q) && (
            <button
              type="button"
              onClick={() => setState(emptyState)}
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              ล้างทั้งหมด
            </button>
          )}
        </div>

        {rescue && (
          <div className="mb-6">
            <RescueNote rescue={rescue} q={state.q} />
          </div>
        )}

        <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {index &&
            list
              .slice(0, state.n)
              .map((f) => (
                <FontCard
                  key={f.i}
                  font={f}
                  designer={index.authors[f.a] ?? ""}
                  onDesigner={() => set({ a: f.a })}
                />
              ))}
        </ul>

        {index && list.length === 0 && (
          <p className="py-10 text-muted-foreground">
            ไม่มีฟอนต์ที่ตรงกับตัวกรองนี้ ลองเอาบางตัวออก
          </p>
        )}
        {index && list.length > state.n && (
          <div className="mt-10 flex justify-center">
            <InView>
              <AutoMore onMore={() => setState((s) => ({ ...s, n: s.n + PAGE }))} />
            </InView>
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, n: s.n + PAGE }))}
              className={link}
            >
              แสดงเพิ่ม ({(list.length - state.n).toLocaleString("th")})
            </button>
          </div>
        )}
        {index && (
          <p className="mt-12 text-xs text-muted-foreground">
            ข้อมูลจาก f0nt.com อัปเดตล่าสุด {index.fetched} ปุ่มดาวน์โหลดพาไปที่ไฟล์ของ f0nt.com
            โดยตรง การดาวน์โหลดถือว่ายอมรับเงื่อนไขของผู้ออกแบบ
            ฟอนต์ส่วนตัวและเดโมห้ามใช้ในงานที่มีรายได้ ถ้าไม่ได้ขออนุญาต
          </p>
        )}
      </div>
    </div>
  );
}

/** Mounted by InView when the end of the list nears the screen: asks for the next page once. */
function AutoMore({ onMore }: { onMore: () => void }) {
  useEffect(() => {
    onMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  }, []);
  return null;
}

function FontCard({
  font,
  designer,
  onDesigner,
}: {
  font: ThaiFont;
  designer: string;
  onDesigner: () => void;
}) {
  const img = imageUrl(font);
  const lic = licenceOf(font);
  return (
    <li className="flex min-w-0 flex-col gap-3">
      <a
        href={postUrl(font)}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-square overflow-hidden rounded-md border bg-muted focus-visible:outline-2 focus-visible:outline-ring"
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element -- third-party picture, static export
          <img
            src={img}
            alt={`ตัวอย่างฟอนต์ ${font.n}`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            width={300}
            height={300}
            className="size-full object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center p-4 text-center font-heading text-2xl font-black text-muted-foreground">
            {font.n}
          </span>
        )}
      </a>
      <div className="min-w-0">
        <h2 className="font-heading text-lg leading-snug font-black break-words">{font.n}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {designer && (
            <button
              type="button"
              onClick={onDesigner}
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              {designer}
            </button>
          )}
          {designer && " · "}
          <time dateTime={font.d}>{font.d}</time>
        </p>
        <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
          {lic.split("").map((c) => (
            <span
              key={c}
              className={
                c === "c"
                  ? "rounded-sm bg-(--em-blue-600)/10 px-1.5 py-0.5 text-(--em-blue-700) dark:text-(--em-sky-400)"
                  : "rounded-sm bg-muted px-1.5 py-0.5 text-muted-foreground"
              }
            >
              {LICENCES.find(([k]) => k === c)?.[2]}
            </span>
          ))}
        </p>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        {font.dl.map((dl, i) => (
          <a
            key={dl}
            href={downloadUrl(dl)}
            // f0nt.com answers 404 to file requests whose Referer is another site
            rel="nofollow noopener noreferrer"
            referrerPolicy="no-referrer"
            className={
              i === 0 ? `${link} bg-foreground text-background hover:bg-foreground/85` : link
            }
          >
            <Download aria-hidden className="size-4" />
            {i === 0 ? "ดาวน์โหลด" : `ไฟล์ ${i + 1}`}
          </a>
        ))}
        <a
          href={postUrl(font)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          หน้าต้นฉบับ
          <ArrowUpRight aria-hidden className="size-4" />
        </a>
      </div>
    </li>
  );
}
