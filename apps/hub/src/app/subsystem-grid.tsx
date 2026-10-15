import type { CSSProperties } from "react";
import { appUrl } from "@/lib/apps";
import { subsystems } from "@/lib/subsystems";

export function SubsystemGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {subsystems.map((s, i) => {
        const url = appUrl(s.slug);
        return (
          <li key={s.slug}>
            <div
              style={{ "--tile": s.accent } as CSSProperties}
              className={
                url
                  ? "group relative flex h-full flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm transition-[box-shadow,transform,border-color] focus-within:ring-2 focus-within:ring-ring hover:-translate-y-0.5 hover:border-[var(--tile)] hover:shadow-glow motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  : "relative flex h-full flex-col gap-4 rounded-2xl border border-dashed bg-card/60 p-6"
              }
            >
              <div className="flex items-center justify-between">
                <span
                  aria-hidden
                  className="grid size-11 place-items-center rounded-xl bg-[var(--tile)] font-heading text-lg font-bold text-white"
                >
                  {s.name.charAt(0)}
                </span>
                <span
                  className={
                    url
                      ? "rounded-full bg-success/12 px-2.5 py-1 text-xs font-medium text-success"
                      : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  }
                >
                  {url ? "เปิดใช้งาน" : "เร็ว ๆ นี้"}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground">ระบบย่อย {i + 1}</p>
                <h3 className="font-heading text-lg font-semibold leading-tight">
                  {url ? (
                    // stretched link: the whole card is clickable, the accessible name stays the title
                    <a href={url} className="outline-none after:absolute after:inset-0">
                      {s.name}
                    </a>
                  ) : (
                    s.name
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">{s.summary}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
