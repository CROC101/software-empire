import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn, HubSwitcher, SunMoonThemeToggle } from "@empire/ui";
import { contactEmail, contacts, subsystems } from "@empire/core/subsystems";
import { readLang, type Lang } from "@empire/core/lang";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { Link, Outlet, ScrollRestoration, useLocation } from "react-router";
import { CommandPalette, openSearch } from "@/components/shell/command-palette";
import { env } from "@/lib/env";
import { CRAFT_APPS, LAUNCHER } from "@/lib/craft-apps";
import { signInUrl, signOut, useSession } from "@/lib/session";
import { FavoritesSync } from "@/lib/tools/favorites-sync";

type Item = { label: string; to: string };
type NavItem = Item | { label: string; menu: Item[] };

const DISCORD = contacts.find((c) => c.label === "Discord")?.href ?? env.hubUrl;
const GITHUB = "https://github.com/CROC101";

// Bar layout after the template: Home, a dropdown, plain links, then "Apps" after a rule.
const NAV: NavItem[] = [
  { label: "Home", to: "/" },
  {
    label: "Craft",
    menu: [
      { label: "Lineup", to: "/#lineup" },
      { label: "Guide", to: "/craft/guide/" },
      { label: "Launcher", to: LAUNCHER },
      { label: "Licenses", to: "/licenses" },
    ],
  },
  { label: "Tools", to: "/tools" },
  { label: "Icons", to: "/icons" },
  { label: "Favorites", to: "/favorites" },
  { label: "History", to: "/history" },
];
const APPS: Item = { label: "Apps", to: "/apps" };

const isOn = (path: string, item: NavItem): boolean =>
  "menu" in item
    ? item.menu.some((m) => m.to === path)
    : item.to === "/"
      ? path === "/"
      : item.to === "/tools"
        ? path.startsWith("/tools") || path.startsWith("/category/")
        : path.startsWith(item.to);

/** SPA routes go through the router; hash links, other builds and outside sites load normally. */
function L({
  to,
  className,
  children,
  ...rest
}: Item & { className?: string; children: ReactNode; role?: string }) {
  if (/^\/(?!craft\/)[^#]*$/.test(to))
    return (
      <Link to={to} className={className} {...rest}>
        {children}
      </Link>
    );
  const ext = /^https?:/.test(to);
  return (
    <a
      href={to}
      className={className}
      {...(ext ? { target: "_blank", rel: "noreferrer" } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}

/** The crocwork mark: an angular croc jaw "C". */
export function CrocMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 34"
      role="img"
      aria-label="crocwork"
      className={cn("fill-current", className)}
    >
      <path d="M20 0 L40 0 L33 9 L23 9 L15 25 L33 25 L40 34 L10 34 L0 25 L12 3 Z" />
    </svg>
  );
}

const mono = "font-mono text-[11px] font-medium tracking-[0.14em] uppercase";
const cell =
  "flex w-12 items-center justify-center border-l border-border text-muted-foreground hover:text-foreground";

export function AppShell() {
  const { pathname } = useLocation();
  // menus remember the page they opened on, so moving to another page closes them
  const [drop, setDrop] = useState({ label: "", at: "" });
  const [mobileAt, setMobileAt] = useState("");
  const open = drop.at === pathname ? drop.label : "";
  const mobile = mobileAt === pathname;
  const ref = useRef<HTMLDivElement>(null);
  const { user, ready } = useSession();

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setDrop({ label: "", at: "" });
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setDrop({ label: "", at: "" });
      setMobileAt("");
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const signIn = signInUrl(new URL(pathname, env.siteUrl).href);
  const account = !ready ? null : user ? (
    <button type="button" onClick={() => void signOut()}>
      Sign out
    </button>
  ) : (
    <a href={signIn}>Sign in</a>
  );
  const pill = (label: string, on: boolean) => (
    <span
      className={cn("-mx-1.5 px-1.5 py-[3px]", on && "bg-foreground font-bold text-background")}
    >
      {label}
    </span>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-card focus:px-4 focus:py-2"
      >
        ข้ามไปเนื้อหา
      </a>
      <div ref={ref} className="vt-top sticky top-0 z-50">
        <header className="flex h-[49px] items-stretch justify-between border-b border-border bg-background/95 backdrop-blur-md">
          <div className="flex items-stretch">
            <Link
              to="/"
              aria-label="crocwork home"
              className="flex w-[70px] items-center justify-center border-r border-border text-foreground"
            >
              <CrocMark className="h-6 w-[29px]" />
            </Link>
            <nav aria-label="Main" className="hidden items-stretch min-[1100px]:flex">
              {NAV.map((it) =>
                "menu" in it ? (
                  <div
                    key={it.label}
                    className="relative flex"
                    onMouseEnter={() => setDrop({ label: it.label, at: pathname })}
                    onMouseLeave={() => setDrop({ label: "", at: "" })}
                  >
                    <button
                      type="button"
                      aria-expanded={open === it.label}
                      aria-haspopup="true"
                      // hover already opened it, so a mouse click keeps it open; Enter/Space (detail 0) toggles
                      onClick={(e) =>
                        setDrop({
                          label: open === it.label && e.detail === 0 ? "" : it.label,
                          at: pathname,
                        })
                      }
                      className={cn(
                        mono,
                        "flex h-12 items-center gap-1.5 px-4 transition-colors hover:text-foreground",
                        isOn(pathname, it) ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {pill(it.label, isOn(pathname, it))}
                      <ChevronDown
                        aria-hidden
                        className={cn(
                          "size-3 transition-transform",
                          open === it.label && "rotate-180",
                        )}
                      />
                    </button>
                    <div
                      role="menu"
                      className={cn(
                        "absolute top-12 left-0 min-w-[202px] border border-t-0 border-border bg-background transition duration-150",
                        open === it.label
                          ? "translate-y-0 opacity-100"
                          : "pointer-events-none -translate-y-1 opacity-0",
                      )}
                    >
                      {it.menu.map((m) => (
                        <L
                          key={m.label}
                          {...m}
                          role="menuitem"
                          className={cn(
                            mono,
                            "block px-[18px] py-3 text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          {m.label}
                        </L>
                      ))}
                    </div>
                  </div>
                ) : (
                  <L
                    key={it.label}
                    {...it}
                    className={cn(
                      mono,
                      "flex h-12 items-center px-4 transition-colors hover:text-foreground",
                      isOn(pathname, it) ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {pill(it.label, isOn(pathname, it))}
                  </L>
                ),
              )}
              <div className="ml-1.5 flex border-l border-border pl-1.5">
                <L
                  {...APPS}
                  className={cn(
                    mono,
                    "flex h-12 items-center px-4 hover:text-foreground",
                    isOn(pathname, APPS) ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {pill(APPS.label, isOn(pathname, APPS))}
                </L>
              </div>
            </nav>
          </div>
          <div className="flex items-stretch">
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search (Ctrl+K)"
              aria-keyshortcuts="Control+K"
              className={cn(cell, "w-auto gap-2 px-3")}
            >
              <Search aria-hidden className="size-4" />
              <kbd className={cn(mono, "hidden text-[10px] lg:inline")}>Ctrl K</kbd>
            </button>
            <a
              href={env.hubUrl}
              className={cn(
                mono,
                "hidden items-center px-[18px] text-muted-foreground hover:text-foreground sm:flex",
              )}
            >
              Hub
            </a>
            <a
              href={DISCORD}
              target="_blank"
              rel="noreferrer"
              aria-label="Discord"
              className={cn(cell, "hidden sm:flex")}
            >
              <DiscordIcon />
            </a>
            <span className={cell}>
              <SunMoonThemeToggle cookieDomain={import.meta.env.VITE_COOKIE_DOMAIN} size={32} />
            </span>
            <span className={cell}>
              <HubSwitcher
                hubUrl={env.hubUrl}
                apps={subsystems}
                current="toolboxes"
                cookieDomain={import.meta.env.VITE_COOKIE_DOMAIN}
                iconOnly
                className="size-9 justify-center"
              />
            </span>
            <span
              className={cn(
                mono,
                "hidden w-[120px] items-stretch bg-foreground font-bold tracking-[0.12em] text-background sm:flex [&>*]:flex [&>*]:w-full [&>*]:items-center [&>*]:justify-center",
              )}
            >
              {account}
            </span>
            <button
              type="button"
              aria-label={mobile ? "Close main menu" : "Open main menu"}
              aria-expanded={mobile}
              onClick={() => setMobileAt(mobile ? "" : pathname)}
              className={cn(cell, "min-[1100px]:hidden")}
            >
              {mobile ? (
                <X aria-hidden className="size-4" />
              ) : (
                <Menu aria-hidden className="size-4" />
              )}
            </button>
          </div>
        </header>
        <div
          aria-hidden={!mobile}
          inert={!mobile}
          // a link to the page already open (a #section) must still close the sheet
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setMobileAt("");
          }}
          className={cn(
            "fixed inset-x-0 top-[49px] max-h-[calc(100dvh-49px)] overflow-auto bg-background shadow-xl transition duration-200 min-[1100px]:hidden",
            mobile ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0",
          )}
        >
          <div className="px-3">
            {NAV.map((it) =>
              "menu" in it ? (
                <div key={it.label}>
                  <p className={cn(mono, "px-1 pt-3.5 pb-1 text-muted-foreground/70")}>
                    {it.label}
                  </p>
                  {it.menu.map((m) => (
                    <L
                      key={m.label}
                      {...m}
                      className={cn(mono, "block py-3.5 pr-1.5 pl-[26px] text-muted-foreground")}
                    >
                      {m.label}
                    </L>
                  ))}
                </div>
              ) : (
                <L
                  key={it.label}
                  {...it}
                  className={cn(mono, "block px-1.5 py-3.5 text-muted-foreground")}
                >
                  {pill(it.label, isOn(pathname, it))}
                </L>
              ),
            )}
          </div>
          <L
            {...APPS}
            className={cn(
              mono,
              "block border-t border-border px-[18px] py-3.5 text-muted-foreground",
            )}
          >
            {APPS.label}
          </L>
          <div
            className={cn(
              mono,
              "flex h-11 bg-foreground font-bold tracking-[0.12em] text-background [&>*]:flex [&>*]:w-full [&>*]:items-center [&>*]:justify-center",
            )}
          >
            {account}
          </div>
          <div
            className={cn(mono, "grid grid-cols-2 border-b border-border text-muted-foreground")}
          >
            <a href={env.hubUrl} className="flex h-[42px] items-center justify-center">
              Hub
            </a>
            <a
              href={DISCORD}
              target="_blank"
              rel="noreferrer"
              className="flex h-[42px] items-center justify-center border-l border-border"
            >
              Discord
            </a>
          </div>
        </div>
      </div>
      <div id="content" className="flex-1">
        <Outlet />
      </div>
      <SiteFooter />
      <FavoritesSync />
      <CommandPalette />
      {/* new page = top; back/forward and reload = where you were */}
      <ScrollRestoration />
    </div>
  );
}

const ABOUT = {
  th: "เครื่องมือเปิดซอร์สที่ใช้งานได้จริง: แอปสร้างสรรค์ชุด crocwork และกล่องเครื่องมือที่ทำงานในเบราว์เซอร์ของคุณ",
  en: "Capable open source tools: the crocwork craft apps and a toolbox that runs in your browser.",
} satisfies Record<Lang, string>;

const FOOTER: { title: string; links: Item[] }[] = [
  {
    title: "Craft apps",
    links: [
      { label: "All craft apps", to: "/#lineup" },
      ...CRAFT_APPS.map((a) => ({ label: `crocwork ${a.word}`, to: `/#app-${a.slug}` })),
    ],
  },
  {
    title: "Toolboxes",
    links: [
      { label: "Tools", to: "/tools" },
      { label: "Apps", to: "/apps" },
      { label: "Icons", to: "/icons" },
      { label: "Favorites", to: "/favorites" },
      { label: "History", to: "/history" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Guide", to: "/craft/guide/" },
      { label: "Launcher", to: LAUNCHER },
      { label: "Licenses", to: "/licenses" },
      { label: "crocwork hub", to: env.hubUrl },
    ],
  },
  {
    title: "Community",
    links: [
      ...contacts.map((c) => ({ label: c.label, to: c.href })),
      { label: "GitHub", to: GITHUB },
    ],
  },
];

/** Footer after the template: brand cell + four link columns on hairlines, then the legal row. */
function SiteFooter() {
  const [lang] = useState<Lang>(() => readLang(document.cookie));
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl xl:border-x xl:border-border">
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-[minmax(0,425px)_repeat(4,1fr)]">
          <div className="bg-background p-6 sm:p-10 sm:pb-8">
            <Link to="/" aria-label="crocwork" className="inline-block text-foreground">
              <CrocMark className="h-8 w-[38px]" />
            </Link>
            <p className="mt-4 max-w-80 leading-relaxed text-muted-foreground">{ABOUT[lang]}</p>
            <a
              href={`mailto:${contactEmail}`}
              className={cn(mono, "mt-6 inline-block text-muted-foreground/70")}
            >
              {contactEmail}
            </a>
          </div>
          {FOOTER.map((c) => (
            <nav key={c.title} aria-label={c.title} className="bg-background p-6 sm:p-8">
              <h2 className={cn(mono, "mb-3.5 text-muted-foreground/70")}>{c.title}</h2>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <L {...l} className="leading-5 text-muted-foreground hover:text-foreground">
                      {l.label}
                    </L>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div
          className={cn(
            mono,
            "flex justify-between gap-4 border-t border-border px-6 py-4 text-muted-foreground/70 sm:px-10",
          )}
        >
          <p>© {new Date().getFullYear()} crocwork</p>
          <p>Free and open source</p>
        </div>
      </div>
    </footer>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
      <path d="M19.3 5.3A16.6 16.6 0 0 0 15.2 4l-.5 1a15.4 15.4 0 0 0-5.4 0l-.5-1a16.6 16.6 0 0 0-4.1 1.3C2.1 9.2 1.4 13 1.8 16.8A16.7 16.7 0 0 0 6.8 19.3l1.1-1.7c-.6-.2-1.2-.5-1.7-.9l.4-.3a11.9 11.9 0 0 0 10.8 0l.4.3c-.5.4-1.1.7-1.7.9l1.1 1.7a16.6 16.6 0 0 0 5-2.5c.5-4.4-.8-8.2-2.9-11.5ZM8.7 14.5c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
    </svg>
  );
}
