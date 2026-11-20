"use client";

import { NimbusNavbar, useTokenColors, type NimbusNavItem } from "@empire/ui";
import { ArrowUpRight, Download, Search, Type } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { InView } from "@/components/in-view";
import { siteUrl } from "@/lib/env";
import {
  defaultStyle,
  faceCss,
  faceName,
  faceSrc,
  filterFonts,
  fontFamilies,
  fontUrl,
  fontZip,
  styleLabel,
  topTags,
  type FontFamily,
} from "@/lib/fonts";

const SAMPLE = "Sphinx of black quartz, judge my vow";
const tags = topTags(fontFamilies, 10);
const tagItems: NimbusNavItem[] = [
  { label: "ทุกแบบ", fx: "none" },
  ...tags.map((t) => ({ label: t, fx: "none" as const })),
];

/** FontFace objects already added to the page, so a card coming back on screen reuses its load. */
const added = new Set<string>();

function Sample({
  family,
  file,
  text,
  size,
}: {
  family: FontFamily;
  file: string;
  text: string;
  size: number;
}) {
  const style = family.styles.find((s) => s.file === file) ?? defaultStyle(family);
  const name = faceName(family, style);
  useEffect(() => {
    if (added.has(name)) return;
    added.add(name);
    const face = new FontFace(name, faceSrc(family, style));
    document.fonts.add(face);
    face.load().catch(() => {
      // a missing file leaves the fallback face in place
    });
  }, [family, style, name]);
  return (
    <p
      className="leading-[1.15] break-words"
      style={{ fontFamily: `"${name}", var(--font-sans)`, fontSize: size }}
    >
      {text || family.name}
    </p>
  );
}

function FontCard({ family, text, size }: { family: FontFamily; text: string; size: number }) {
  const [file, setFile] = useState(() => defaultStyle(family).file);
  const style = family.styles.find((s) => s.file === file) ?? defaultStyle(family);
  const link =
    "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring";
  return (
    <li className="flex min-w-0 flex-col gap-4 border-t py-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-lg font-black">{family.name}</h2>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {family.styles.length} สไตล์
        </span>
      </div>
      <InView className="overflow-hidden">
        <Sample family={family} file={style.file} text={text} size={size} />
      </InView>
      <div className="flex flex-wrap items-center gap-2">
        {family.styles.length > 1 && (
          <label className="inline-flex items-center rounded-md border bg-card text-sm focus-within:ring-2 focus-within:ring-ring">
            <span className="sr-only">สไตล์ของ {family.name}</span>
            <select
              value={style.file}
              onChange={(e) => {
                setFile(e.target.value);
              }}
              className="max-w-44 bg-transparent px-3 py-1.5 outline-none"
            >
              {family.styles.map((s) => (
                <option key={s.file} value={s.file}>
                  {styleLabel(family, s)}
                </option>
              ))}
            </select>
          </label>
        )}
        <a
          href={fontZip(family)}
          download
          className={`${link} bg-foreground text-background hover:bg-foreground/85`}
        >
          <Download aria-hidden className="size-4" />
          ทั้งชุด .zip
        </a>
        {style.files.map((k) => (
          <a key={k} href={fontUrl(family, style, k)} download className={link}>
            {k.toUpperCase()}
          </a>
        ))}
        <CopyButton text={faceCss(family, style, siteUrl)} label="CSS" />
      </div>
      <p className="text-xs text-muted-foreground">
        {family.licence.join(" + ") || "สัญญาอนุญาตดูที่ต้นฉบับ"}
        {family.authors.length > 0 && ` · ${family.authors.join(", ")}`}
        {family.source && (
          <>
            {" · "}
            <a
              href={family.source}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 underline underline-offset-4 hover:text-foreground"
            >
              ต้นฉบับ
              <ArrowUpRight aria-hidden className="size-3" />
            </a>
          </>
        )}
      </p>
    </li>
  );
}

/** Every font with one editable line of text, a size, search and the most used tags. */
export function FontLibrary() {
  const [text, setText] = useState(SAMPLE);
  const [size, setSize] = useState(44);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("all");
  const shown = useMemo(() => filterFonts(fontFamilies, q, tag), [q, tag]);
  const bg = useTokenColors(["--background"])?.[0];
  const tone = bg && parseInt(bg.slice(1, 3), 16) < 128 ? "dark" : "light";

  return (
    <section aria-label="ฟอนต์ทั้งหมด">
      <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <div className="mx-auto w-max">
          <NimbusNavbar
            label="แบบตัวอักษร"
            items={tagItems}
            active={tag === "all" ? 0 : tags.indexOf(tag) + 1}
            tone={tone}
            onChange={(i) => {
              setTag(tags[i - 1] ?? "all");
            }}
          />
        </div>
      </div>

      <div className="vt-top sticky top-16 z-20 -mx-4 mt-6 border-b bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex min-w-0 flex-[2] items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <Type aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <span className="sr-only">ข้อความตัวอย่าง</span>
            <input
              value={text}
              maxLength={120}
              onChange={(e) => {
                setText(e.target.value);
              }}
              placeholder="พิมพ์คำที่อยากเห็น"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <label className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="shrink-0">ขนาด</span>
            <input
              type="range"
              min={16}
              max={120}
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
              }}
              className="w-full accent-(--em-blue-600) md:w-32"
            />
            <span className="w-12 font-mono text-xs tabular-nums">{size}px</span>
          </label>
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <span className="sr-only">ค้นหาฟอนต์</span>
            <input
              type="search"
              value={q}
              maxLength={60}
              onChange={(e) => {
                setQ(e.target.value);
              }}
              placeholder="ชื่อฟอนต์ ผู้ออกแบบ"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>
      </div>

      <p className="mt-6 font-mono text-xs text-muted-foreground tabular-nums" aria-live="polite">
        {shown.length} ฟอนต์
      </p>
      {shown.length ? (
        <ul className="grid gap-x-10 md:grid-cols-2">
          {shown.map((f) => (
            <FontCard key={f.slug} family={f} text={text} size={size} />
          ))}
        </ul>
      ) : (
        <p className="py-16 text-center text-muted-foreground">ไม่พบฟอนต์ที่ตรงกับคำค้น</p>
      )}
    </section>
  );
}
