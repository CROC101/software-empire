"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { TopHeader } from "./TopHeader";
import { CategoryNavBar } from "./CategoryNavBar";
import { MobileDrawer } from "./MobileDrawer";
import { SiteFooter } from "./SiteFooter";
import { WelcomeGate } from "./WelcomeGate";
import { CookieBanner } from "./CookieBanner";

/** Pages that never show the welcome gate (matches the original: its report form opens directly). */
const UNGATED = ["/content-removal"];

export function AppShell({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const path = usePathname();
  const gated = !UNGATED.some((p) => path.startsWith(p));
  return (
    <>
      {gated && <WelcomeGate />}
      {/* Header stays rendered under the opaque gate (like the original); only the body is hidden. */}
      <header className="sticky top-[-22px] z-40">
        <TopHeader onMenu={() => setDrawer(true)} />
        <CategoryNavBar />
      </header>
      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} />
      <div className={gated ? "gated-content" : undefined}>
        <main className="min-h-[60vh]">{children}</main>
        <SiteFooter />
        {/* Inside the gated wrapper so it stays hidden while the welcome gate is up. */}
        <CookieBanner />
      </div>
    </>
  );
}
