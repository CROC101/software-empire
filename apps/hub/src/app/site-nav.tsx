"use client";

import {
  AppLauncher,
  NimbusNavbar,
  useTokenColors,
  type LauncherApp,
  type NimbusFx,
} from "@empire/ui";
import { Briefcase, HelpCircle, LayoutGrid, UserRound, Workflow } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// each link plays its own little scene when tapped
const NAV: { href: string; label: string; icon: React.ReactNode; fx: NimbusFx }[] = [
  { href: "#about", label: "เกี่ยวกับ", icon: <UserRound aria-hidden />, fx: "wave" },
  { href: "#subsystems", label: "ผลงาน", icon: <LayoutGrid aria-hidden />, fx: "spin" },
  { href: "#services", label: "รับทำอะไร", icon: <Briefcase aria-hidden />, fx: "pop" },
  { href: "#how", label: "ทำงานยังไง", icon: <Workflow aria-hidden />, fx: "glow" },
  { href: "#faq", label: "คำถาม", icon: <HelpCircle aria-hidden />, fx: "drop" },
];

/**
 * The header's water pill: the drop follows the section on screen (or the link you tap), its
 * water tone follows the theme, and the nine-dot app launcher sits at the end of the pill.
 */
export function SiteNav({
  launcher,
  className,
}: {
  launcher: { label: string; soonLabel: string; apps: LauncherApp[] };
  className?: string;
}) {
  const [active, setActive] = useState(0);
  // after a tap the page glides past the sections in between; hold the spy until it lands,
  // or the drop would chase every section it passes and stutter
  const lockedUntil = useRef(0);
  const bg = useTokenColors(["--background"])?.[0];
  const dark = bg ? parseInt(bg.slice(1, 3), 16) < 128 : false;

  // scroll spy: the section crossing the band 35–45% down the screen is the current one
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || performance.now() < lockedUntil.current) continue;
          const i = NAV.findIndex((n) => n.href === `#${e.target.id}`);
          if (i >= 0) setActive(i);
        }
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    for (const { href } of NAV) {
      const el = document.getElementById(href.slice(1));
      if (el) io.observe(el);
    }
    // the glide has landed: let the spy follow the page again
    const release = () => {
      lockedUntil.current = 0;
    };
    window.addEventListener("scrollend", release);
    return () => {
      io.disconnect();
      window.removeEventListener("scrollend", release);
    };
  }, []);

  return (
    <NimbusNavbar
      label="ส่วนต่าง ๆ ของหน้า"
      items={NAV}
      active={active}
      onChange={(i) => {
        // long glides on long pages; scrollend releases it sooner (and in browsers without it, this does)
        lockedUntil.current = performance.now() + 2500;
        setActive(i);
      }}
      tone={dark ? "dark" : "light"}
      trailing={<AppLauncher {...launcher} />}
      className={className}
    />
  );
}
