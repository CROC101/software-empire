import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSettings } from "@/lib/site";
import { CookieNotice } from "./cookie-notice";
import { Sky } from "./sky";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Software Empire", template: "%s · Software Empire" },
  description: "Core Hub — ศูนย์กลาง SSO และ portfolio ของระบบย่อยทั้ง 7",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // the admins' banner (hub /admin/system); cached until they save
  const { announcement } = await getSettings();
  return (
    // theme-boot.js sets the shared theme class before paint, so React sees a different class
    // data-scroll-behavior: Next turns smooth scrolling off during route changes, on in-page anchors
    <html lang="th" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- must run before first paint */}
        <script src="/theme-boot.js" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- the first-visit intro, decided before paint */}
        <script src="/intro-boot.js" />
        {/* body text font: fetched with the HTML instead of after the CSS */}
        <link
          rel="preload"
          href="/fonts/NotoSansThai-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-dvh">
        {announcement && (
          <p
            role="note"
            className="whitespace-pre-line bg-[var(--em-blue-600)] px-4 py-2 text-center text-sm font-semibold text-[var(--em-ink-0)]"
          >
            {announcement}
          </p>
        )}
        {children}
        <Sky />
        <CookieNotice cookieDomain={process.env.NEXT_PUBLIC_COOKIE_DOMAIN} />
      </body>
    </html>
  );
}
