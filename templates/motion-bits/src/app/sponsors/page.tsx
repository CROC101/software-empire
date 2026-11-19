import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import Footer from "@/components/layout/Footer";
import { BTN } from "@/components/site/Section";
import SponsorGrid from "@/components/site/SponsorGrid";
import UpdateModal from "@/components/site/UpdateModal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sponsors" };

const MAIL = "mailto:sponsors@example.com";

const TIERS = [
  { name: "Diamond", price: 500, note: "Most visible", perks: ["Largest logo on the docs sidebar", "Largest logo in the README", "Shoutout on social", "Featured on the sponsors page", "Direct line for feedback and requests"] },
  { name: "Platinum", price: 250, perks: ["Larger logo in the README", "Larger logo on the docs sidebar", "Shoutout on social"] },
  { name: "Silver", price: 100, perks: ["Logo in the README", "Logo on the docs sidebar", "Listed on the sponsors page"] },
];

export default function SponsorsPage() {
  return (
    <>
      <UpdateModal />
      <main className="mx-auto w-[calc(100%-48px)] max-w-[1098px] pt-[148px] pb-32 max-tab:w-[calc(100%-32px)] max-sm:pt-[112px] max-sm:pb-24">
        <h1 className="text-[52px] leading-[1.1] font-medium tracking-[-0.04em] text-white max-lg:text-[38px]">Sponsors</h1>
        <p className="mt-4 max-w-[560px] text-[15px] leading-[1.6] text-white/55">
          Motion Bits is free and open source. These teams help keep it that way, and their names sit beside every page of the docs.
        </p>
        <div className="mt-7 flex flex-wrap gap-2.5">
          <Link href="#tiers" className={cn(BTN, "btn-light h-[42px] text-[13.5px]")}>
            Become a sponsor <ArrowRight className="size-4" />
          </Link>
          <a href={MAIL} className={cn(BTN, "btn-dark h-[42px] text-[13.5px]")}>
            Email us
          </a>
        </div>
        <div className="mt-12">
          <SponsorGrid />
        </div>

        <section className="mt-28">
          <h2 className="text-[42px] leading-[1.15] font-medium tracking-[-0.035em] text-white max-lg:text-[30px]">Reach developers while they build</h2>
          <p className="mt-4 max-w-[538px] text-[14.5px] leading-[1.6] text-white/55">
            Your name appears in the README and on every docs page, right where React developers come looking for UI.
          </p>
          <dl className="mt-8 grid gap-3 tab:grid-cols-3">
            {[
              ["500K+", "Monthly visitors"],
              ["52.2K", "GitHub stars"],
              ["217+", "Docs pages that show your name"],
            ].map(([v, l]) => (
              <div key={l} className="card-shell flex flex-col p-1.5">
                <dt className="order-last px-2.5 pt-3.5 pb-2 text-[13px] text-white/50">{l}</dt>
                <dd className="card-well flex h-[125px] items-center justify-center text-[40px] leading-none font-medium tracking-[-0.04em] text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="tiers" className="mt-28 scroll-mt-24 max-tab:mt-[88px]">
          <h2 className="text-[42px] leading-[1.15] font-medium tracking-[-0.035em] text-white max-lg:text-[30px]">Become a sponsor</h2>
          <p className="mt-4 max-w-[538px] text-[14.5px] text-white/55">Monthly plans. Cancel anytime.</p>
          <div className="mt-10 grid gap-3 lg:grid-cols-3">
            {TIERS.map((t, i) => (
              <div key={t.name} className="card-shell flex flex-col">
                <div className="rounded-[11px] bg-[#0b090e] p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-white">{t.name}</h3>
                    {t.note && <span className="text-xs text-white/45">{t.note}</span>}
                  </div>
                  <p className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-[44px] leading-none font-semibold tracking-[-0.04em] text-white">${t.price}</span>
                    <span className="text-[13px] text-white/45">/month</span>
                  </p>
                  <a href={MAIL} className={cn("mt-6 flex h-[43px] items-center justify-center text-[13.5px] font-medium", i === 0 ? "btn-light" : "btn-dark")}>
                    Sponsor as {t.name}
                  </a>
                </div>
                <ul className="flex flex-col gap-3 px-5 pt-5 pb-5">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-center gap-2.5 text-[13.5px] text-white/70">
                      <Check className="size-3.5 text-white/45" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="card-shell mt-3">
            <div className="flex flex-wrap items-center justify-between gap-5 rounded-[11px] bg-[#0b090e] px-7 py-7">
              <div>
                <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-white">Need a different package?</h3>
                <p className="mt-2 text-[13.5px] text-white/55">Questions, or a plan that doesn't fit the tiers above? Email us and we'll work it out.</p>
              </div>
              <a href={MAIL} className={cn(BTN, "btn-dark h-[43px] text-[13.5px]")}>
                Email us <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
