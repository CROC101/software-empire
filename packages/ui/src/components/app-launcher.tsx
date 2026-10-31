"use client";

import { Grip, Search } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/cn";

/**
 * App launcher: a Google-style nine-dot button that opens a glass panel to get anywhere fast.
 * A search box on top filters everything at once; below it, jump links to every part of the page
 * (in page order), the studio's apps (open ones link, others show dimmed) and a few useful links.
 * Ctrl/⌘ K or "/" opens it from anywhere; Enter takes the first match.
 *
 * It follows the reader: the section crossing the middle of the screen is "now" (one
 * IntersectionObserver, no scroll handlers). The closed button fills with water to that point of
 * the page, a ring shows the same, and the panel opens on that section, lit and scrolled to.
 *
 * Native popover: light dismiss, Escape and focus return come from the browser. When the page
 * has several launchers (desktop and phone headers), only the visible one answers the shortcut.
 * Styles: `.lgn-*` in styles.css.
 */

export type LauncherApp = {
  slug: string;
  name: string;
  href: string;
  icon: React.ReactNode;
  /** A palette token for the tile, e.g. "var(--em-violet-600)". */
  accent: string;
  /** Not open yet: shown dimmed, not a link. */
  soon?: boolean;
};

export type LauncherLink = {
  href: string;
  label: string;
  icon?: React.ReactNode;
  /** Extra words that should find it, e.g. "price ราคา". */
  keywords?: string;
};

const match = (q: string, ...text: (string | undefined)[]) =>
  !q || text.some((t) => t?.toLowerCase().includes(q));

export function AppLauncher({
  apps,
  sections = [],
  links = [],
  label,
  soonLabel,
  labels = {},
  className,
}: {
  apps: readonly LauncherApp[];
  /** Parts of the current page, in order, e.g. { href: "#faq", label: "คำถาม" }. */
  sections?: readonly LauncherLink[];
  /** Other useful links (contact, source code…). */
  links?: readonly LauncherLink[];
  /** Name of the button and the panel, e.g. "ทางลัด". */
  label: string;
  soonLabel: string;
  labels?: {
    search?: string;
    sections?: string;
    apps?: string;
    links?: string;
    empty?: string;
    /** Before the current section's name, e.g. "ตอนนี้อยู่ที่". */
    now?: string;
  };
  className?: string;
}) {
  const id = `lgn-apps-${React.useId().replace(/:/g, "")}`;
  const panel = React.useRef<HTMLDivElement>(null);
  const input = React.useRef<HTMLInputElement>(null);
  const [q, setQ] = React.useState("");
  const [now, setNow] = React.useState<string>();
  const query = q.trim().toLowerCase();
  const hrefs = sections.map((s) => s.href).join(" ");

  // the section crossing the middle of the screen is the one being read
  React.useEffect(() => {
    const owner = new Map<Element, string>();
    for (const href of hrefs.split(" ")) {
      const el = href.startsWith("#") ? document.getElementById(href.slice(1)) : null;
      if (el) owner.set(el, href);
    }
    if (!owner.size) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setNow(owner.get(e.target));
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const el of owner.keys()) io.observe(el);
    return () => {
      io.disconnect();
    };
  }, [hrefs]);

  React.useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLElement &&
        (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      const combo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (!combo && (e.key !== "/" || typing)) return;
      // the launcher in the hidden header (desktop vs phone) stays out of it
      const button = document.querySelector<HTMLElement>(`[popovertarget="${id}"]`);
      if (!button?.offsetParent) return;
      e.preventDefault();
      el.togglePopover();
    };
    const onToggle = (e: Event) => {
      if ((e as ToggleEvent).newState === "open") {
        setQ("");
        input.current?.focus();
        // open on the current section: centre it in the list (the list only, never the page)
        const scroller = el.querySelector<HTMLElement>(".lgn-scroll");
        const item = el.querySelector<HTMLElement>('[aria-current="location"]');
        if (scroller && item) {
          const delta = item.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
          scroller.scrollTop += delta - scroller.clientHeight / 2 + item.offsetHeight / 2;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    el.addEventListener("toggle", onToggle);
    return () => {
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("toggle", onToggle);
    };
  }, [id]);

  const close = () => panel.current?.hidePopover();
  const shownSections = sections.filter((s) => match(query, s.label, s.keywords, s.href));
  const shownApps = apps.filter((a) => match(query, a.name, a.slug));
  const shownLinks = links.filter((l) => match(query, l.label, l.keywords));
  const none = !shownSections.length && !shownApps.length && !shownLinks.length;
  const at = sections.findIndex((s) => s.href === now);
  const current = sections[at];
  // how far down the page, 0..1, by section (the water level in the button)
  const progress = at < 0 ? 0 : (at + 1) / sections.length;

  // Thai headings: never letter-spaced or set in mono
  const head = (text?: string) =>
    text && (
      <p className="mb-1.5 mt-3 px-1 text-xs font-bold text-muted-foreground first:mt-0">{text}</p>
    );

  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        aria-label={current ? `${label} · ${labels.now ?? ""} ${current.label}` : label}
        title={current ? `${current.label} (Ctrl K)` : `${label} (Ctrl K)`}
        className={cn("lgn-launch", className)}
        style={{ "--lgn-p": progress } as React.CSSProperties}
      >
        <span aria-hidden className="lgn-fill" />
        <svg aria-hidden viewBox="0 0 36 36" className="lgn-ring">
          <circle cx="18" cy="18" r="16.5" pathLength="1" />
        </svg>
        <Grip aria-hidden className="relative size-[18px]" strokeWidth={2.4} />
      </button>
      <div ref={panel} id={id} popover="auto" className="lgn-apps" aria-label={label}>
        <form
          role="search"
          className="lgn-search"
          onSubmit={(e) => {
            e.preventDefault();
            // Enter: the first thing that matches
            const first = panel.current?.querySelector<HTMLAnchorElement>("a.lgn-hit");
            first?.click();
          }}
        >
          <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
            }}
            placeholder={labels.search ?? label}
            aria-label={labels.search ?? label}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="lgn-kbd">Ctrl K</kbd>
        </form>

        {current && !query && (
          <a
            href={current.href}
            onClick={close}
            className="lgn-now"
            style={{ "--lgn-p": progress } as React.CSSProperties}
          >
            <span className="lgn-now-text">
              <span className="text-muted-foreground">{labels.now}</span>{" "}
              <span className="font-bold">{current.label}</span>
            </span>
            <span className="lgn-now-count">
              {at + 1}/{sections.length}
            </span>
            <span aria-hidden className="lgn-now-bar" />
          </a>
        )}

        <div className="lgn-scroll">
          {shownSections.length > 0 && (
            <>
              {head(labels.sections)}
              <ul className="grid grid-cols-2 gap-1">
                {shownSections.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      onClick={close}
                      aria-current={s.href === now ? "location" : undefined}
                      className="lgn-hit lgn-row"
                    >
                      <span aria-hidden className="lgn-ico">
                        {s.icon}
                      </span>
                      <span className="truncate">{s.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          {shownApps.length > 0 && (
            <>
              {head(labels.apps)}
              <ul className="grid grid-cols-4 gap-1">
                {shownApps.map((app) => {
                  const tile = (
                    <>
                      <span
                        aria-hidden
                        className="grid size-11 place-items-center rounded-2xl text-white shadow-md [&_svg]:size-5"
                        style={{
                          background: `linear-gradient(145deg, color-mix(in oklab, ${app.accent} 80%, white), ${app.accent})`,
                        }}
                      >
                        {app.icon}
                      </span>
                      <span className="line-clamp-1 text-[11px] font-semibold">{app.name}</span>
                      {app.soon && (
                        <span className="-mt-1 text-[9px] text-muted-foreground">{soonLabel}</span>
                      )}
                    </>
                  );
                  return (
                    <li key={app.slug}>
                      {app.soon ? (
                        <span aria-disabled className="lgn-app opacity-45">
                          {tile}
                        </span>
                      ) : (
                        <a href={app.href} className="lgn-hit lgn-app">
                          {tile}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {shownLinks.length > 0 && (
            <>
              {head(labels.links)}
              <ul className="flex flex-col gap-0.5">
                {shownLinks.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} onClick={close} className="lgn-hit lgn-row">
                      <span aria-hidden className="lgn-ico">
                        {l.icon}
                      </span>
                      <span className="truncate">{l.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          {none && (
            <p className="px-1 py-6 text-center text-sm text-muted-foreground">{labels.empty}</p>
          )}
        </div>
      </div>
    </>
  );
}
