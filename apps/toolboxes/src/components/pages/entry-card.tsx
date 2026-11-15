import type { ReactNode } from "react";
import { Link } from "react-router";
import { FavoriteButton } from "@/components/tools/tool-card";
import { KIND_LABEL, type Entry } from "@/lib/catalog";
import type { Lang } from "@empire/core/lang";

/** A card for any catalogue entry (tool, app, craft app, page) with its star. */
export function EntryCard({ entry, lang, note }: { entry: Entry; lang: Lang; note?: ReactNode }) {
  const body = (
    <>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-fixed text-primary">
        <entry.icon aria-hidden className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold leading-snug text-on-surface">{entry.name}</span>
        <span className="mt-1 flex flex-wrap gap-1.5 text-xs text-on-surface-variant">
          <span className="rounded border border-outline-variant px-1.5">
            {KIND_LABEL[entry.kind][lang]}
          </span>
          <span>{entry.group}</span>
          {note}
        </span>
      </span>
    </>
  );
  const cls = "flex min-h-20 flex-1 items-center gap-3 rounded-2xl p-4 pr-12";
  return (
    <div className="lift relative flex h-full rounded-2xl border border-outline-variant/70 bg-surface-container-lowest">
      {/* /apps and /craft are separate builds: a full page load */}
      {entry.full ? (
        <a href={entry.href} className={cls}>
          {body}
        </a>
      ) : (
        <Link to={entry.href} className={cls}>
          {body}
        </Link>
      )}
      {entry.kind !== "page" && (
        <FavoriteButton id={entry.id} name={entry.name} className="absolute top-2 right-2" />
      )}
    </div>
  );
}

export function EntryGrid({ children }: { children: ReactNode }) {
  return <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{children}</ul>;
}
