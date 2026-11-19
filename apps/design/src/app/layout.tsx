import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Design Registry", template: "%s · Design Registry" },
  description:
    "คลังคอมโพเนนต์ บล็อก และเทมเพลตเว็บที่ขยับได้ของ crocwork ปรับค่าสด ดูโค้ด และคัดลอก prompt ไปสร้างต่อ",
};

/** Bare shell: the site chrome lives in (site)/layout.tsx so /p/<slug> can show a part full screen. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // theme-boot.js sets the shared theme class before paint, so React sees a different class
    <html lang="th" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- must run before first paint */}
        <script src="/theme-boot.js" />
      </head>
      <body className="min-h-dvh bg-background font-sans text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
