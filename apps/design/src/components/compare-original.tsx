"use client";

import { useState } from "react";
import data from "@/lib/react-bits.json";
import { reactBitsUrl } from "@/lib/react-bits-url";
import type { Entry } from "@/registry/meta";
import { Thumb } from "./preview";

/** where a React Bits title lives on reactbits.dev, or null if the snapshot no longer lists it */
export function originalUrl(title: string): string | null {
  for (const c of data.categories)
    if (c.items.some((it) => it.title === title)) return reactBitsUrl(c.name, title);
  return null;
}

/**
 * Our clean-room Lite next to the React Bits original. Theirs stays on their site: a frame of their
 * page, loaded only on click, plus a link. None of their code is copied here.
 */
export function CompareOriginal({ entry, title }: { entry: Entry; title: string }) {
  const [load, setLoad] = useState(false);
  const url = originalUrl(title);
  if (!url) return null;
  return (
    <section aria-labelledby="compare" className="mt-10">
      <h2 id="compare" className="font-heading text-lg font-semibold">
        เทียบกับต้นฉบับ
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <figure className="overflow-hidden rounded-xl border">
          <div className="h-80">
            <Thumb entry={entry} />
          </div>
          <figcaption className="border-t px-4 py-2.5 text-sm">
            <span className="font-semibold">{entry.name}</span>{" "}
            <span className="text-muted-foreground">Lite · ของเรา เขียนใหม่ทั้งหมด</span>
          </figcaption>
        </figure>
        <figure className="overflow-hidden rounded-xl border">
          <div className="grid h-80 place-items-center bg-(--em-ink-975)">
            {load ? (
              <iframe
                src={url}
                title={`${title} บน reactbits.dev`}
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-popups"
                className="size-full"
              />
            ) : (
              <button
                type="button"
                onClick={() => setLoad(true)}
                className="rounded-md border border-(--em-ink-700) px-3 py-1.5 text-sm text-(--em-ink-100) hover:bg-(--em-ink-900)"
              >
                เปิดหน้าต้นฉบับที่นี่
              </button>
            )}
          </div>
          <figcaption className="flex items-center justify-between gap-2 border-t px-4 py-2.5 text-sm">
            <span>
              <span className="font-semibold">{title}</span>{" "}
              <span className="text-muted-foreground">Original · React Bits</span>
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              reactbits.dev <span aria-hidden>↗</span>
            </a>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
