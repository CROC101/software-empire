import { HubSwitcher } from "@empire/ui";
import { subsystems } from "@empire/core/subsystems";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import CrocBot from "@/components/CrocBot";
import "./globals.css";

// every page talks to Firebase on load; render per request so builds (CI has no Firebase env)
// never try to initialise it
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CrocByte · crocwork.studio",
  description: "รับจ้างงาน · ระบบสมาชิก VIP และอันดับลูกค้า",
  icons: { icon: "/3b4679f0ac3b7c69684f7683595ab6c8.jpg" },
};

const HUB = process.env.NEXT_PUBLIC_HUB_URL ?? "http://localhost:3000";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // theme-boot.js applies the shared theme before paint, so React sees a different class
    <html lang="th" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- must run before first paint */}
        <script src="/theme-boot.js" />
      </head>
      <body className="font-sans antialiased">
        {children}
        {/* back to the portfolio hub / other apps; also carries the shared theme + sky controls */}
        <div className="vt-top fixed bottom-6 left-6 z-[9998]">
          <HubSwitcher
            hubUrl={HUB}
            apps={subsystems}
            current="crocbyte"
            iconOnly
            // CrocByte draws its own underwater / snow scenes, driven by the same shared setting
            ambience={false}
            cookieDomain={process.env.NEXT_PUBLIC_COOKIE_DOMAIN}
            className="size-12 justify-center rounded-full bg-[var(--em-blue-600)] text-white shadow-lg"
          />
        </div>
        <CrocBot />
      </body>
    </html>
  );
}
