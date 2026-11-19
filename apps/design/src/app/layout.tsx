import { BrandMark, HubSwitcher } from "@empire/ui";
import { subsystems } from "@empire/core/subsystems";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { hubUrl } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Design Registry", template: "%s · Design Registry" },
  description: "คลังคอมโพเนนต์ที่ขยับได้ของ crocwork ปรับค่าสด ดูโค้ด และคัดลอก prompt ไปสร้างต่อ",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // theme-boot.js sets the shared theme class before paint, so React sees a different class
    <html lang="th" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- must run before first paint */}
        <script src="/theme-boot.js" />
      </head>
      <body className="min-h-dvh bg-background font-sans text-foreground">
        <header className="vt-top sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
            <HubSwitcher
              hubUrl={hubUrl}
              apps={subsystems}
              current="design"
              cookieDomain={process.env.NEXT_PUBLIC_COOKIE_DOMAIN}
              iconOnly
              className="size-9 justify-center rounded-md hover:bg-muted"
            />
            <Link
              href="/"
              className="flex items-center gap-2 font-heading font-bold tracking-tight"
            >
              <BrandMark className="size-8" />
              <span>Design Registry</span>
            </Link>
          </nav>
        </header>
        <Providers>{children}</Providers>
        <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground sm:px-6">
          ทุกชิ้นขยับด้วย transform กับ opacity เท่านั้น
          และหยุดนิ่งเมื่อเครื่องตั้งให้ลดการเคลื่อนไหว
        </footer>
      </body>
    </html>
  );
}
