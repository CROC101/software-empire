import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CookieNotice } from "./cookie-notice";
import { Sky } from "./sky";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Software Empire", template: "%s · Software Empire" },
  description: "Core Hub — ศูนย์กลาง SSO และ portfolio ของระบบย่อยทั้ง 7",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // theme-boot.js sets the shared theme class before paint, so React sees a different class
    // data-scroll-behavior: Next turns smooth scrolling off during route changes, on in-page anchors
    <html lang="th" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- must run before first paint */}
        <script src="/theme-boot.js" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- the first-visit intro, decided before paint */}
        <script src="/intro-boot.js" />
      </head>
      <body className="min-h-dvh">
        {children}
        <Sky />
        <CookieNotice cookieDomain={process.env.NEXT_PUBLIC_COOKIE_DOMAIN} />
      </body>
    </html>
  );
}
