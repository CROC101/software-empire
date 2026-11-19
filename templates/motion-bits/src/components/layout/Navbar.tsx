"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, Star } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import { openCommandPalette } from "./CommandPalette";

export const NAV_LINKS = [
  { href: "/get-started/introduction/", label: "Docs" },
  { href: "/components/", label: "Components" },
  { href: "/tools/", label: "Tools", tag: "New" },
  { href: "/pro/", label: "Pro" },
  { href: "/sponsors/", label: "Sponsors" },
  { href: "/favorites/", label: "Favorites", favorites: true },
  { href: "/about/", label: "About" },
];

const norm = (p: string) => (p.endsWith("/") ? p : `${p}/`);

export function isActive(pathname: string, href: string) {
  const p = norm(pathname);
  if (href === "/") return p === "/";
  if (href === "/components/") return p.startsWith("/components/");
  return p.startsWith(href);
}

function FavCount({ className }: { className?: string }) {
  const { favorites } = useFavorites();
  if (!favorites.length) return null;
  return (
    <span className={cn("ml-1 rounded-[5px] bg-violet/20 px-1.5 py-px text-[10px] font-semibold text-[#d8b4fe]", className)}>
      {favorites.length}
    </span>
  );
}

export default function Navbar() {
  const pathname = usePathname() || "/";
  const home = norm(pathname) === "/";

  return (
    <header
      className={cn(
        "z-40 w-full",
        home ? "fixed inset-x-0 top-4 px-6 max-lg:px-4 max-tab:top-3" : "sticky top-0 -mb-[60px] bg-ink/80 backdrop-blur-xl",
      )}
    >
      <nav
        aria-label="Main"
        className={cn(
          "mx-auto flex h-14 items-center",
          home
            ? "max-w-[1276px] rounded-2xl border border-white/[0.06] bg-[#0f0c13]/80 shadow-float backdrop-blur-xl"
            : "h-[60px] max-w-none border-b border-white/[0.06]",
        )}
      >
        <div className={cn("flex h-full w-full items-center gap-2", home ? "px-5 max-tab:px-3" : "px-[30px] max-tab:px-4")}>
        <Logo />
        <span className="mx-2 text-lg text-white/40 max-lg:hidden" aria-hidden>
          /
        </span>
        <ul className="flex items-center gap-1 max-lg:hidden">
          {NAV_LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex h-9 items-center rounded-lg px-3 text-[14px] font-medium transition-colors",
                    active ? "bg-white/[0.07] text-white" : "text-white/80 hover:text-white",
                  )}
                >
                  {l.label}
                  {l.tag && (
                    <span className="ml-2 rounded-[5px] bg-white/10 px-1.5 py-px text-[10px] font-semibold text-white/90">{l.tag}</span>
                  )}
                  {l.favorites && <FavCount />}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={openCommandPalette}
            className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-white/[0.05] px-3 text-[13px] text-white/50 transition hover:bg-white/[0.08] hover:text-white/80 max-tab:w-9 max-tab:justify-center max-tab:px-0"
            aria-label="Search components (Ctrl+K)"
          >
            <Search className="size-4" />
            <span className="max-tab:hidden">Search...</span>
            <kbd className="rounded bg-white/10 px-1.5 font-mono text-[11px] text-white/60 max-tab:hidden">⌘K</kbd>
          </button>
          <Link
            href="/favorites/"
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-white/[0.05] px-3 text-[13.5px] font-medium text-white/90 hover:bg-white/[0.08] max-sm:hidden"
            aria-label="Favorites"
          >
            <Star className="size-4" /> 52.2K
          </Link>
          <Link
            href="/pro/"
            className="inline-flex h-9 items-center rounded-[10px] bg-violet px-4 text-[13.5px] font-semibold text-white shadow-[0_6px_20px_-6px_rgba(168,85,247,.8)] transition hover:bg-[#b46ef8]"
          >
            <span className="max-tab:hidden">Get Motion Bits Pro</span>
            <span className="tab:hidden">Get Pro</span>
          </Link>
          <Sheet>
            <SheetTrigger
              className="inline-flex size-9 items-center justify-center rounded-[10px] bg-white/[0.07] text-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-white/10 bg-[#120f17] p-5">
              <SheetTitle className="text-white">
                <Logo />
              </SheetTitle>
              <ul className="mt-4 flex flex-col gap-1">
                <li>
                  <Link href="/" className={cn("flex h-11 items-center rounded-lg px-3 text-[15px]", home ? "bg-white/[0.07] text-white" : "text-white/75")}>
                    Home
                  </Link>
                </li>
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={cn(
                        "flex h-11 items-center rounded-lg px-3 text-[15px]",
                        isActive(pathname, l.href) ? "bg-white/[0.07] text-white" : "text-white/75 hover:text-white",
                      )}
                    >
                      {l.favorites && <Heart className="mr-2 size-4" />}
                      {l.label}
                      {l.tag && <span className="ml-2 rounded bg-white/10 px-1.5 text-[10px] font-semibold">{l.tag}</span>}
                      {l.favorites && <FavCount />}
                    </Link>
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>
        </div>
        </div>
      </nav>
    </header>
  );
}
