import { BrandMark, HubSwitcher } from "@empire/ui";
import { subsystems } from "@empire/core/subsystems";
import type { ReactNode } from "react";
import { CommandPalette } from "@/components/command-palette";
import { ScrollKeeper } from "@/components/scroll-keeper";
import { SiteMenu } from "@/components/site-menu";
import { hubUrl } from "@/lib/env";
import { kinds, registry, kindOf, type Kind } from "@/registry/meta";

const menu = [
  ...(Object.keys(kinds) as Kind[]).map((k) => ({ label: kinds[k], href: `/#k=${k}` })),
  { label: "ฟอนต์ไทย", href: "/fonts" },
  { label: "ฟอนต์อังกฤษ", href: "/fonts/en" },
  { label: "React Bits", href: "/react-bits" },
  { label: "เทมเพลตแอป", href: "/templates" },
];

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="vt-top sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <HubSwitcher
            hubUrl={hubUrl}
            apps={subsystems}
            current="design"
            cookieDomain={process.env.NEXT_PUBLIC_COOKIE_DOMAIN}
            iconOnly
            className="size-9 justify-center rounded-md hover:bg-muted"
          />
          {/* plain <a>: Next 16 export puts the (site) RSC payload where Link prefetch does not look (404) */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="flex items-center gap-2 font-heading font-bold tracking-tight">
            <BrandMark className="size-8" />
            <span className="hidden sm:inline">Design Registry</span>
          </a>
          <ul className="ml-4 hidden items-center gap-1 text-sm md:flex">
            {(Object.keys(kinds) as Kind[]).map((k) => (
              <li key={k}>
                <a
                  href={`/#k=${k}`}
                  className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {kinds[k]}
                </a>
              </li>
            ))}
            {/* hover or keyboard focus opens the two font libraries; the link itself goes to Thai */}
            <li className="group relative">
              <a
                href="/fonts"
                aria-haspopup="true"
                className="rounded-md px-3 py-1.5 text-muted-foreground group-focus-within:bg-muted group-focus-within:text-foreground hover:bg-muted hover:text-foreground"
              >
                ฟอนต์
              </a>
              <ul className="invisible absolute top-full left-0 z-40 min-w-40 rounded-md border bg-background p-1 opacity-0 shadow-sm transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <li>
                  <a href="/fonts" className="block rounded-sm px-3 py-2 hover:bg-muted">
                    ฟอนต์ไทย
                  </a>
                </li>
                <li>
                  <a href="/fonts/en" className="block rounded-sm px-3 py-2 hover:bg-muted">
                    ฟอนต์อังกฤษ
                  </a>
                </li>
              </ul>
            </li>
            <li>
              <a
                href="/react-bits"
                className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                React Bits
              </a>
            </li>
            <li>
              <a
                href="/templates"
                className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                เทมเพลตแอป
              </a>
            </li>
          </ul>
          <CommandPalette />
          <ScrollKeeper />
          <SiteMenu items={menu} />
        </nav>
      </header>
      {children}
      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-10 text-sm text-muted-foreground sm:px-6 md:flex-row md:justify-between">
          <p>
            {registry.length} ชิ้น: Exclusive{" "}
            {registry.filter((e) => kindOf(e) === "exclusive").length} · คอมโพเนนต์{" "}
            {registry.filter((e) => kindOf(e) === "component").length} · บล็อก{" "}
            {registry.filter((e) => kindOf(e) === "block").length} · เทมเพลต{" "}
            {registry.filter((e) => kindOf(e) === "template").length}
          </p>
          <p>
            ทุกชิ้นขยับด้วย transform กับ opacity เท่านั้น
            และหยุดนิ่งเมื่อเครื่องตั้งให้ลดการเคลื่อนไหว
          </p>
        </div>
      </footer>
    </>
  );
}
