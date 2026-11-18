"use client";

import { Activity, LayoutDashboard, PenLine, Power, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/admin/content", label: "เนื้อหา", icon: PenLine },
  { href: "/admin/users", label: "ผู้ใช้", icon: Users },
  { href: "/admin/stats", label: "สถิติ", icon: Activity },
  { href: "/admin/system", label: "ระบบ", icon: Power },
] as const;

/** The back office's rooms; the one you are in is lit. */
export function AdminTabs() {
  const path = usePathname();
  return (
    <nav
      aria-label="หลังบ้าน"
      className="cw-glass flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl p-1"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const on = path === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
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
