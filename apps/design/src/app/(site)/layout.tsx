import { BrandMark, HubSwitcher } from "@empire/ui";
import { subsystems } from "@empire/core/subsystems";
import type { ReactNode } from "react";
import { CommandPalette } from "@/components/command-palette";
import { SiteMenu } from "@/components/site-menu";
import { hubUrl } from "@/lib/env";
import { kinds, registry, kindOf, type Kind } from "@/registry/meta";

const menu = [
  ...(Object.keys(kinds) as Kind[]).map((k) => ({ label: kinds[k], href: `/#k=${k}` })),
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
          <SiteMenu items={menu} />
        </nav>
      </header>
      {children}
      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-10 text-sm text-muted-foreground sm:px-6 md:flex-row md:justify-between">
          <p>
            {registry.length} ชิ้น: คอมโพเนนต์{" "}
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
