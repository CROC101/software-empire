"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MAIN_NAV } from "./nav";
import { SPRING } from "./TopHeader";

export function CategoryNavBar() {
  const path = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <nav aria-label="Sections" className="bg-bar">
      <ul className="no-scrollbar mx-auto flex h-[42px] max-w-site overflow-x-auto lg:overflow-visible">
        {MAIN_NAV.map((item) => (
          <li
            key={item.href}
            className="relative min-w-[110px] flex-1"
            onMouseEnter={() => item.menu && setOpen(item.href)}
            onMouseLeave={() => setOpen(null)}
          >
            <Link
              href={item.href}
              className={`flex h-[42px] items-center justify-center gap-[5px] whitespace-nowrap text-2xs font-bold uppercase hover:text-brand ${
                isActive(item.href) ? "text-brand" : "text-white"
              }`}
            >
              {item.label}
              {item.menu && (
                <svg width="8" height="5" viewBox="0 0 8 5" aria-hidden="true" className="fill-current">
                  <path d="M0 0h8L4 5z" />
                </svg>
              )}
            </Link>
            <AnimatePresence>
              {open === item.href && item.menu && (
                <motion.ul
                  initial={{ opacity: 0, y: -8, scaleY: 0.92 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={SPRING}
                  style={{ originY: 0 }}
                  className="absolute left-1/2 top-[42px] z-50 hidden w-[220px] -translate-x-1/2 overflow-hidden rounded-b-[3px] border border-hairline bg-surface-2 py-1 lg:block"
                >
                  {item.menu.map((m) => (
                    <li key={m.href + m.label}>
                      <Link href={m.href} onClick={() => setOpen(null)} className="block px-4 py-2 text-sm text-ink hover:bg-pill-hover hover:text-brand">
                        {m.label}
                      </Link>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </nav>
  );
}
