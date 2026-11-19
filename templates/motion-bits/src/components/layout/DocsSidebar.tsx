"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { registry } from "@/data/registry";
import { CATEGORIES } from "@/types/component-registry";
import { cn } from "@/lib/utils";

const START = [
  { href: "/get-started/introduction/", label: "Introduction" },
  { href: "/components/", label: "All components" },
  { href: "/favorites/", label: "Favorites" },
  { href: "/about/", label: "About & shortcuts" },
];

export default function DocsSidebar({ className }: { className?: string }) {
  const pathname = usePathname() || "/";
  const here = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const linkClass = (active: boolean) =>
    cn(
      "flex h-8 items-center gap-2 rounded-lg px-2.5 text-[13.5px] transition-colors",
      active ? "bg-white/[0.07] font-medium text-white" : "text-white/55 hover:text-white",
    );

  return (
    <aside
      className={cn(
        "sticky top-0 h-dvh w-[256px] shrink-0 overflow-y-auto border-r border-white/[0.05] px-4 pt-[76px] pb-10 max-lg:hidden",
        className,
      )}
      aria-label="Docs navigation"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-white/35" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter components..."
          aria-label="Filter components"
          className="h-9 rounded-[10px] bg-white/[0.04] pl-8 text-[13px]"
        />
      </div>

      {!query && (
        <nav className="mt-2.5 pt-3.5">
          <h4 className="mb-1.5 px-2.5 text-xs font-medium text-white/35">Get Started</h4>
          {START.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(here === l.href)} aria-current={here === l.href ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
      )}

      {CATEGORIES.map((cat) => {
        const items = registry.filter((r) => r.category === cat && (!query || r.name.toLowerCase().includes(query)));
        if (!items.length) return null;
        return (
          <nav key={cat} className="mt-6" aria-label={cat}>
            <h4 className="mb-1.5 px-2.5 text-xs font-medium text-white/35">{cat}</h4>
            {items.map((r) => {
              const href = `/components/${r.slug}/`;
              const active = here === href;
              return (
                <Link key={r.slug} href={href} className={linkClass(active)} aria-current={active ? "page" : undefined}>
                  <span className="truncate">{r.name}</span>
                  {r.badge && (
                    <span
                      className={cn(
                        "ml-auto rounded-[5px] px-1.5 py-px text-[9.5px] font-semibold tracking-wide",
                        r.badge === "NEW" ? "bg-cyan/15 text-cyan" : "bg-violet/15 text-[#c084fc]",
                      )}
                    >
                      {r.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        );
      })}
      {query && !registry.some((r) => r.name.toLowerCase().includes(query)) && (
        <p className="mt-6 px-2.5 text-[13px] text-white/40">Nothing matches “{q}”.</p>
      )}
    </aside>
  );
}
