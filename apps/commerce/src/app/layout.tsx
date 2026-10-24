import { BrandMark, Button, HubSwitcher } from "@empire/ui";
import { subsystems } from "@empire/core/subsystems";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { currentUserId, db } from "@/lib/db";
import { env, hubUrl, signInUrl } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: "Empire Commerce", template: "%s · Empire Commerce" },
  description:
    "ตลาดงานฟรีแลนซ์ของ Software Empire: จ้างแล้วโอนตรงเข้าพร้อมเพย์ของผู้ขาย ระบบไม่ถือเงินใคร",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const me = await currentUserId();
  const profile = me
    ? await (await db()).from("profiles").select("display_name").eq("user_id", me).maybeSingle()
    : null;

  return (
    // theme-boot.js sets the shared theme class before paint, so React sees a different class
    <html lang="th" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- must run before first paint */}
        <script src="/theme-boot.js" />
      </head>
      <body className="min-h-dvh font-sans">
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
            <HubSwitcher
              hubUrl={hubUrl}
              apps={subsystems}
              current="commerce"
              cookieDomain={process.env.NEXT_PUBLIC_COOKIE_DOMAIN}
              iconOnly
              className="size-9 justify-center rounded-md hover:bg-muted"
            />
            <Link
              href="/"
              className="flex items-center gap-2 font-heading font-bold tracking-tight"
            >
              <BrandMark className="size-8" />
              <span className="hidden sm:inline">Empire Commerce</span>
            </Link>
            <div className="flex flex-1 items-center gap-1 text-sm">
              <Link href="/services" className="rounded-md px-3 py-2 hover:bg-muted">
                บริการ
              </Link>
              {me && (
                <>
                  <Link href="/orders" className="rounded-md px-3 py-2 hover:bg-muted">
                    คำสั่งซื้อ
                  </Link>
                  <Link href="/sell" className="rounded-md px-3 py-2 hover:bg-muted">
                    ขายงาน
                  </Link>
                </>
              )}
            </div>
            {me ? (
              <span className="rounded-full border bg-card px-3 py-1.5 text-sm">
                {profile?.data?.display_name ?? "บัญชีของฉัน"}
              </span>
            ) : (
              <Button asChild size="sm" variant="aurora">
                <a href={signInUrl("/")}>เข้าสู่ระบบ</a>
              </Button>
            )}
          </nav>
        </header>
        {children}
        <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground sm:px-6">
          ผู้ซื้อโอนเงินตรงเข้าพร้อมเพย์ของผู้ขายแต่ละคน ระบบนี้ไม่รับ ไม่ถือ และไม่โอนเงินของใคร
        </footer>
      </body>
    </html>
  );
}
