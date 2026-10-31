"use client";

import { LayoutDashboard, PenLine } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/admin/content", label: "เนื้อหา", icon: PenLine },
] as const;

/** The back office's two rooms; the one you are in is lit. */
export function AdminTabs() {
  const path = usePathname();
  return (
    <nav aria-label="หลังบ้าน" className="cw-glass flex w-fit gap-1 rounded-xl p-1">
      {TABS.map(({ href, label, icon: Icon }) => {
        const on = path === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              on ? "cw-btn-blue" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
