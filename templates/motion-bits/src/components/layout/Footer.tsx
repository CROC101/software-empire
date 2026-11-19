import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "./Logo";

const COLUMNS = [
  { title: "Community", links: [["About", "/about/"], ["Favorites", "/favorites/"], ["Sponsors", "/sponsors/"]] },
  { title: "Product", links: [["Docs", "/get-started/introduction/"], ["Tools", "/tools/"], ["Showcase", "/components/"], ["Sponsors", "/sponsors/"]] },
  { title: "Pro", links: [["What's in Pro", "/pro/"], ["Components", "/components/"], ["Blocks", "/pro/"], ["Templates", "/pro/"]] },
];

export default function Footer({ cta }: { cta?: ReactNode }) {
  return (
    <footer className={cta ? "pt-10 pb-14 max-lg:pt-6 max-lg:pb-8" : "pb-6"}>
      <div className="container-site">
      <div className="relative overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#18161f] shadow-hair">
        {cta && <div className="p-[7px] pb-0">{cta}</div>}
        <div className="flex flex-wrap justify-between gap-10 px-10 pt-10 pb-6 max-tab:px-6">
          <div>
            <Logo size="lg" />
            <p className="mt-4 text-[13px] leading-[1.55] text-white/60">
              Animated React components.
              <br />
              Open source. Fully customizable.
            </p>
            <p className="mt-14 flex flex-wrap gap-x-2 text-[12.5px] text-white/55 max-tab:mt-8">
              <span>© 2026 Motion Bits</span>
              <span aria-hidden>·</span>
              <span>Built with care</span>
              <span aria-hidden>·</span>
              <Link href="/about/" className="text-white/75 hover:text-white">
                License
              </Link>
            </p>
          </div>
          <nav aria-label="Footer" className="flex gap-16 max-lg:gap-8">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <h3 className="text-[12.5px] font-semibold text-white">{c.title}</h3>
                <ul className="mt-5 flex flex-col gap-[13px]">
                  {c.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-[13px] text-white/60 hover:text-white">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div
          aria-hidden
          className="h-[170px] w-full tab:max-lg:h-[110px] max-tab:h-[70px]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,.22) 1.2px, transparent 1.6px)",
            backgroundSize: "9px 9px",
            maskImage: "linear-gradient(to bottom, transparent, black 70%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 70%)",
          }}
        />
      </div>
      </div>
    </footer>
  );
}
