import Link from "next/link";
import { FOOTER_COLUMNS } from "./nav";
import { LanguageMenu } from "./LanguageMenu";

export function SiteFooter() {
  return (
    <footer>
      <section className="bg-surface pb-[15px] pt-[30px]">
        <div className="mx-auto grid max-w-grid grid-cols-2 gap-y-[20px] md:grid-cols-4">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="flex justify-center">
              <ul className="min-w-[150px]">
                <li className="mb-[10px] text-lg font-bold text-ink">{col.title}</li>
                {col.links.map((l) => (
                  <li key={l.label} className="h-[28px]">
                    <Link href={l.href} className="text-sm text-brand-text hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-[10px] flex max-w-grid items-center gap-[8px] px-[63px] text-md font-bold text-ink">
          Language: <LanguageMenu up />
        </div>
      </section>
      <div className="bg-obsidian">
        <div className="mx-auto flex min-h-[72px] max-w-grid flex-wrap items-center justify-center gap-x-[60px] gap-y-3 px-4 py-2">
          <div className="flex gap-[3px]">
            <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X" className="flex h-[27px] w-[46px] items-center justify-center">
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#4a4a4a] text-xs font-bold text-black">X</span>
            </a>
            <a href="https://discord.com" target="_blank" rel="noreferrer" aria-label="Discord" className="flex h-[27px] w-[46px] items-center justify-center">
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#4a4a4a] text-xs font-bold text-black">D</span>
            </a>
          </div>
          <p className="text-xs text-muted">© StreamHub demo, 2026</p>
          <span className="flex h-[31px] w-[88px] items-center justify-center border-2 border-white text-xs font-bold text-white">SFW · ALL</span>
          <Link href="/information/terms" className="flex h-[54px] w-[76px] items-center justify-center bg-brand-text px-1 text-center text-xs font-bold leading-tight text-black">
            Notice to Users
          </Link>
        </div>
      </div>
    </footer>
  );
}
