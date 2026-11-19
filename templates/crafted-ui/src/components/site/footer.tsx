import Link from "next/link";
import { BRAND } from "@/components/site/logo";

const LIB = "/community/components/";

const COLUMNS: { title: string; links: [string, string][] }[] = [
  { title: "Product", links: [["Library", LIB], [`${BRAND} AI`, "/c/aurora-mesh-background/"], ["Design Bug Bot", "/pricing/"], ["CLI & MCP", "/c/border-beam-button/"], ["Pricing", "/pricing/"]] },
  { title: "Library", links: [["Components", LIB], ["Templates", LIB], ["Themes", LIB], ["Apps", LIB], ["Icons", LIB]] },
  { title: "Resources", links: [["What's new", "/c/floating-command-island/"], ["Publish", "/pricing/"]] },
  { title: "Company", links: [["Contact", "/"], ["Privacy", "/"], ["Terms", "/"], ["X (Twitter)", "/"], ["GitHub", "/"]] },
];

const LIBRARIES = ["Aceternity UI", "Magic UI", "shadcn/ui", "Origin UI", "Geist", "Kokonut UI", "8bitcn", "Kibo UI", "ReUI", "HextaUI"];

export const FOOTER_CATEGORIES =
  "Accordions,AI Chats,Alerts,Animated Heroes,Announcements,Avatars,Backgrounds,Badges,Borders,Buttons,Calendars,Calls to Action,Cards,Carousels,Charts & Data Viz,Checkboxes,Clients,Comparisons,Cursors,Dashboards,Date Pickers,Dialogs / Modals,Docks,Dropdowns,Empty States,FAQs,Features,File Trees,File Uploads,Footers,Forms,Galleries,Globes,Gradients,Grids & Bento,Heroes,Hooks,Icons,Images,Inputs,Links,Lists,Maps,Marquees,Menus,Navigation Menus,Notifications,Numbers,Onboarding,Paginations,Popovers,Pricing Sections,Profiles,Progress,Radio Groups,Scroll Areas,Search Bars,Selects,Shaders,Sidebars,Sign Ins,Sign ups,Sliders,Spinner Loaders,Stats & KPIs,Steppers,Tables,Tabs,Tags,Team Sections,Testimonials,Text Areas,Texts,Timelines,Toasts,Toggles,Tooltips,Videos".split(",");

/** Pixel-grid mark drawn in the brand blue. */
function PixelMark() {
  const rows = ["....####", "....####", "..######", "..######", "######..", "######..", "##......", "##......"];
  return (
    <svg viewBox="0 0 8 8" className="size-14 text-brand" aria-hidden>
      {rows.flatMap((r, y) => [...r].map((ch, x) => (ch === "#" ? <rect key={`${x}-${y}`} x={x + 0.08} y={y + 0.08} width={0.84} height={0.84} fill="currentColor" /> : null)))}
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] text-[14px]">
      <div className="mx-auto max-w-6xl"><div className="site-col pt-10 pb-10 md:pt-[50px] md:pb-16">
        <div className="grid grid-cols-2 gap-y-8 md:gap-y-10 md:grid-cols-[208px_1fr_1fr_1fr_1fr_1.6fr]">
          <div className="col-span-2 md:col-span-1">
            <PixelMark />
            <p className="mt-5 text-[13px] text-dim">© 2026 {BRAND.toLowerCase()}</p>
            <p className="mt-4 flex items-center gap-2 text-[13px] text-dim">
              <span className="flex size-4 items-center justify-center rounded-[3px] bg-[#f26522] text-[10px] font-bold text-white">Y</span> Backed by YC
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-[10px] text-[13px] text-dim">{col.title}</p>
              {col.links.map(([label, href]) => (
                <Link key={label} href={href} className="block py-[5px] text-ink-soft transition-colors hover:text-ink">{label}</Link>
              ))}
            </div>
          ))}
          <div className="col-span-2 max-md:hidden md:col-span-1">
            <p className="mb-[10px] text-[13px] text-dim">Libraries</p>
            <div className="grid grid-cols-2 gap-x-6">
              {LIBRARIES.map((l) => (
                <Link key={l} href="/community/components/" className="block py-[5px] text-ink-soft transition-colors hover:text-ink">{l}</Link>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-8 text-[13px] text-dim md:mt-[50px]">Components by category</p>
        <div className="mt-3 flex gap-x-[14px] overflow-x-auto whitespace-nowrap pb-1 [scrollbar-width:none] text-[13px] text-ink-soft">
          {FOOTER_CATEGORIES.map((c) => (
            <Link key={c} href="/community/components/" className="hover:text-ink">{c}</Link>
          ))}
        </div>
      </div></div>
    </footer>
  );
}
