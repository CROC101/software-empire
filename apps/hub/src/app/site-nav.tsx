"use client";

import { AppLauncher, NimbusNavbar, useTokenColors } from "@empire/ui";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PAGES } from "@/lib/pages";

/**
 * The header's water pill: the drop sits on the current page, its water tone follows the
 * theme, and the nine-dot app launcher sits at the end of the pill.
 */
export function SiteNav({
  launcher,
  initialTheme,
  className,
}: {
  launcher: React.ComponentProps<typeof AppLauncher>;
  /** The theme the server read from the cookie, used until the page colours can be read. */
  initialTheme?: "light" | "dark";
  className?: string;
}) {
  const pathname = usePathname();
  const current = Math.max(
    0,
    PAGES.findIndex((p) => (p.href === "/" ? pathname === "/" : pathname.startsWith(p.href))),
  );
  const [active, setActive] = useState(current);
  const bg = useTokenColors(["--background"])?.[0];
  const dark = bg ? parseInt(bg.slice(1, 3), 16) < 128 : initialTheme === "dark";

  return (
    <NimbusNavbar
      label="หน้าต่าง ๆ ของเว็บ"
      items={PAGES}
      active={active}
      onChange={setActive}
      tone={dark ? "dark" : "light"}
      trailing={<AppLauncher {...launcher} />}
      className={className}
    />
  );
}
