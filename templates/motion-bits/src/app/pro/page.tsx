import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import Footer from "@/components/layout/Footer";
import Cta from "@/components/site/Cta";
import Faq from "@/components/site/Faq";
import ProCard from "@/components/site/ProCard";
import ProShowcase from "@/components/site/ProShowcase";
import { BTN, Section, SectionHead } from "@/components/site/Section";
import Testimonials from "@/components/site/Testimonials";
import UpdateModal from "@/components/site/UpdateModal";
import { registry } from "@/data/registry";
import { PRO_ITEMS } from "@/data/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pro" };

const PH = "[&_h2]:text-[40px] max-lg:[&_h2]:text-[28px]";
const SP = "pt-[88px] pb-24 max-tab:pt-16 max-tab:pb-[68px] max-tab:[&>div]:px-6";

const PLANS = [
  { name: "Free", price: "$0", unit: "forever", blurb: "The library on this site", cta: "Already yours" },
  { name: "Starter", price: "$129", unit: "one-time", blurb: "Every Pro component", cta: "Get Starter" },
  { name: "Pro", price: "$249", unit: "one-time", blurb: "Components, sections, app UI and the agent kit", cta: "Get Pro" },
  { name: "Ultimate", price: "$349", unit: "one-time", blurb: "Everything, including every template", cta: "Get Everything", popular: true },
];

type Cell = string | boolean;
const ROWS: { name: string; desc: string; cells: Cell[] }[] = [
  { name: "Components", desc: "Free on this site, more with Pro", cells: [`${registry.length}`, "+255", "+255", "+255"] },
  { name: "Page sections", desc: "From heroes to footers", cells: [false, false, "400", "400"] },
  { name: "App UI", desc: "Dashboards, tables, chat, forms and auth", cells: [false, false, "300", "300"] },
  { name: "Agent Kit", desc: "Teaches your AI agent design taste", cells: ["1", "2", "35", "35"] },
  { name: "Page builders", desc: "Compose pages from blocks, then export the code", cells: ["Try", "Try", true, true] },
  { name: "Templates", desc: "Complete Next.js sites, ready to deploy", cells: ["1", "1", "1", "18"] },
  { name: "Priority support", desc: "Your emails go to the front of the queue", cells: [false, false, false, true] },
];

function CellView({ v }: { v: Cell }) {
  if (v === true) return <Check className="size-4 text-white" aria-label="Included" />;
  if (v === false) return <Minus className="size-4 text-white/25" aria-label="Not included" />;
  return <span>{v}</span>;
}

export default function ProPage() {
  return (
    <>
      <UpdateModal />
      <main>
        <section className="bg-ink-deep pt-[190px] text-center tab:max-lg:pt-[150px] max-tab:pt-[130px]">
          <div className="mx-auto max-w-[1324px] px-6 pb-24">
            <h1 className="mx-auto max-w-[760px] text-[60px] leading-[1.05] font-medium tracking-[-0.045em] text-white max-lg:text-[34px]">
              The complete React toolkit for crafting memorable UI
            </h1>
            <p className="mx-auto mt-6 max-w-[560px] text-[16px] leading-[1.6] text-white/60 max-tab:text-[15px]">
              The free library stays free. Pro takes you from single effects to complete pages, product UI, templates and an agent kit, all delivered as
              source you own.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-2.5">
              <Link href="#pricing" className={cn(BTN, "btn-light")}>
                Get Motion Bits Pro <ArrowRight className="size-4" />
              </Link>
              <Link href="/components/" className={cn(BTN, "btn-dark")}>
                Browse the catalogue
              </Link>
            </div>
            <ProShowcase />
          </div>
        </section>

        <Section className={SP}>
          <SectionHead className={PH} title="Five libraries in one" sub="Every piece installs as source you own, ready to edit and ship." />
          <div className="grid gap-3 tab:grid-cols-2">
            {PRO_ITEMS.slice(0, 2).map((p) => (
              <ProCard key={p.title} {...p} tall />
            ))}
          </div>
          <div className="mt-3 grid gap-3 tab:grid-cols-2 lg:grid-cols-3">
            {PRO_ITEMS.slice(2).map((p) => (
              <ProCard key={p.title} {...p} />
            ))}
          </div>
        </Section>

        <Section dark id="pricing" className={cn(SP, "scroll-mt-16")}>
          <SectionHead
            className={PH}
            title="Build the whole product, not just the hero."
            sub="Free components make one section stand out. Pro covers the rest. Pay once, keep every update."
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <caption className="sr-only">Plans compared</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-[30%]" />
                  {PLANS.map((p) => (
                    <th
                      key={p.name}
                      scope="col"
                      className={cn("px-5 pt-6 pb-6 align-top font-normal", p.popular && "rounded-t-2xl border-x border-t border-white/10 bg-white/[0.035]")}
                    >
                      <div className="flex items-center gap-2 text-[15px] font-semibold text-white">
                        {p.name}
                        {p.popular && <span className="rounded-md bg-violet/20 px-1.5 py-0.5 text-[10.5px] font-semibold text-[#d8b4fe]">Most popular</span>}
                      </div>
                      <p className="mt-3 flex items-baseline gap-1.5">
                        <span className="text-[34px] leading-none font-semibold tracking-[-0.04em] text-white">{p.price}</span>
                        <span className="text-[12.5px] text-white/45">{p.unit}</span>
                      </p>
                      <p className="mt-2 min-h-[40px] text-[13px] leading-[1.5] text-white/50">{p.blurb}</p>
                      {p.name === "Free" ? (
                        <span className="mt-4 flex h-10 items-center justify-center rounded-[10px] text-[13px] text-white/40 shadow-hair">{p.cta}</span>
                      ) : (
                        <Link
                          href="/sponsors/"
                          className={cn("mt-4 flex h-10 items-center justify-center text-[13px] font-medium", p.popular ? "btn-light" : "btn-dark")}
                        >
                          {p.cta}
                        </Link>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, ri) => (
                  <tr key={r.name} className="border-t border-white/[0.07]">
                    <th scope="row" className="py-5 pr-6 font-normal tab:max-lg:py-[25px] max-tab:py-[29px]">
                      <span className="block text-[14px] font-semibold text-white">{r.name}</span>
                      <span className="mt-1 block text-[13px] text-white/50">{r.desc}</span>
                    </th>
                    {r.cells.map((c, i) => (
                      <td
                        key={i}
                        className={cn(
                          "px-5 py-5 text-[15px] font-medium text-white/85 tab:max-lg:py-[25px] max-tab:py-[29px]",
                          PLANS[i].popular && "border-x border-white/10 bg-white/[0.035]",
                          PLANS[i].popular && ri === ROWS.length - 1 && "rounded-b-2xl border-b",
                        )}
                      >
                        <CellView v={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section className={SP}>
          <SectionHead
            className={PH}
            title="Try the workflow before you buy"
            sub="Grab a template and an agent skill, no checkout needed. To judge the full library, play with the live previews."
          />
          <div className="grid gap-3 tab:grid-cols-2">
            {[
              { kind: "Free template", name: "Portfolio", desc: "A complete personal portfolio, animated and ready to deploy.", light: true },
              { kind: "Free agent skill", name: "Terminal Dark", desc: "Teaches your agent to build dev-tool pages that look like real software." },
            ].map((c) => (
              <article key={c.name} className="card-shell p-[7px]">
                <div className={cn("flex h-[345px] items-center justify-center rounded-[11px] max-lg:h-[240px]", c.light ? "bg-[#f4f4f5]" : "bg-[#1f1d24]")}>
                  {c.light ? (
                    <div className="w-[70%] text-left text-[#111]">
                      <p className="text-[11px]">Hey, I'm Sam</p>
                      <p className="mt-1 text-[24px] leading-[1.1] font-medium tracking-[-0.03em]">Design engineer &amp; motion nerd</p>
                      <div className="mt-4 h-2 w-2/3 rounded bg-black/10" />
                    </div>
                  ) : (
                    <pre className="font-mono text-[12.5px] leading-[1.8] text-emerald-300/80">{"$ skill add terminal-dark\n✓ ready"}</pre>
                  )}
                </div>
                <div className="max-w-[427px] px-5 pt-6 pb-5">
                  <p className="text-[13px] text-white/50">{c.kind}</p>
                  <h3 className="mt-2 text-[20px] font-medium tracking-[-0.02em] text-white">{c.name}</h3>
                  <p className="mt-2 text-[14px] leading-[1.6] text-white/55">{c.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section dark className="pt-20 pb-[100px] max-tab:pt-16 max-tab:pb-[68px]">
          <SectionHead className={PH} title="Loved by developers" />
          <Testimonials />
        </Section>

        <Section className={SP}>
          <div className="grid gap-10 lg:grid-cols-[1fr_700px]">
            <div>
              <h2 className="text-[40px] leading-[1.15] font-medium tracking-[-0.035em] text-white max-lg:text-[28px]">Questions, answered</h2>
              <p className="mt-4 max-w-[310px] text-[14.5px] leading-[1.6] text-white/55">Plans, licenses and how Pro fits with the free library.</p>
            </div>
            <Faq />
          </div>
        </Section>
        <section className="card-shell mx-auto mt-[156px] mb-[140px] w-[calc(100%-48px)] max-w-[1276px] p-1.5">
          <Cta title="Own the whole library." className="py-[82px] max-tab:py-[38px]" />
        </section>
      </main>
      <Footer />
    </>
  );
}
