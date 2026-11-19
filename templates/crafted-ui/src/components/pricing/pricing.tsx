"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/components/site/logo";
import { cn } from "@/lib/utils";

const spring = { type: "spring", stiffness: 400, damping: 30 } as const;
const CREDITS = [{ n: "500", q: 20, y: 15 }, { n: "1,000", q: 36, y: 27 }, { n: "2,000", q: 64, y: 48 }];
const STATS = [["11,967+", "Components", "Live, each with its code", "/community/components/"], ["361", "Templates", "Whole sites to start from", "/community/components/"], ["992", "Themes", "Re-skin your whole app", "/community/components/"], ["28,915", "Icons", "Searched by meaning", "/community/components/"], ["649", "Shaders", "Tune live, copy the code", "/community/components/"], ["138", "Apps", "Open source, with demos", "/community/components/"]];
const AVATAR_HUES = [12, 48, 200, 280, 330, 160];

function Seg<T extends string>({ value, options, onChange, id }: { value: T; options: [T, string][]; onChange: (v: T) => void; id: string }) {
  return (
    <div className="relative flex w-fit rounded-[10px] bg-white/[0.05] p-0.5">
      {options.map(([v, label]) => (
        <button key={v} type="button" onClick={() => onChange(v)} className={cn("relative z-10 h-8 px-3 text-[13px] font-medium transition-colors", value === v ? "text-ink" : "text-dim")}>
          {value === v && <motion.span layoutId={id} transition={spring} className="absolute inset-0 -z-10 rounded-lg bg-white/10" />}
          {label}
        </button>
      ))}
    </div>
  );
}

function Price({ now, was, unit }: { now: string; was?: string; unit: string }) {
  return (
    <p className="mt-6 flex items-baseline gap-2">
      <span className="text-[40px] font-semibold tracking-[-0.04em]">{now}</span>
      {was && <span className="text-[17px] text-dim line-through">{was}</span>}
      <span className="text-[14px] text-dim">{unit}</span>
    </p>
  );
}

function Features({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-2.5 border-t border-white/[0.06] pt-6 text-[14px] text-ink-soft">
      {items.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-dim" />{f}</li>)}
    </ul>
  );
}

const ROWS: [string, string, (string | boolean)[]][] = [
  ["Library", "Browse components, templates and themes", [true, true, true, true]],
  ["Library", "Copy components", ["2 a day", "Unlimited", "Unlimited", "Unlimited"]],
  ["Library", "Premium templates", [false, true, true, true]],
  ["Library", "CLI & MCP install", [true, true, true, true]],
  ["Library", "Bookmarks and collections", [true, true, true, true]],
  ["Library", "Commercial license", [false, true, true, true]],
  ["Library", "Figma files", [false, true, true, true]],
  ["Library", "Early access to new drops", [false, false, true, true]],
  [`${BRAND} AI`, "AI credits a month", ["5", "—", "500 – 2,000", "Shared pool"]],
  [`${BRAND} AI`, "Generate new components", [false, false, true, true]],
  [`${BRAND} AI`, "Edit components with AI", [false, false, true, true]],
  [`${BRAND} AI`, "Credits roll over", [false, false, true, true]],
  [`${BRAND} AI`, "Pick your model", [false, false, true, true]],
  ["Design Bug Bot", "Reviews on pull requests", [false, false, true, true]],
  ["Design Bug Bot", "Repositories", ["—", "—", "3", "Unlimited"]],
  ["Design Bug Bot", "Visual diff screenshots", [false, false, true, true]],
  ["Design Bug Bot", "Checks on every push", [false, false, true, true]],
  ["Support", "Community", [true, true, true, true]],
  ["Support", "Priority email", [false, false, true, true]],
  ["Support", "Shared billing & seats", [false, false, false, true]],
];

export function Pricing() {
  const [cycle, setCycle] = useState<"q" | "y">("y");
  const [credit, setCredit] = useState(0);
  const [seats, setSeats] = useState(3);
  const yearly = cycle === "y";
  const team = (yearly ? 7.5 : 10) * seats;

  return (
    <>
      <section className="site-col pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="display max-w-[600px] text-[40px] md:text-[45px] lg:text-hero">Pixel-perfect UI, one plan away</h1>
            <p className="mt-5 max-w-[470px] text-[17px] text-dim">One plan opens the whole library. Add {BRAND} AI to generate what is missing and review every PR.</p>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex -space-x-2">{AVATAR_HUES.map((h) => <span key={h} className="size-7 rounded-full ring-2 ring-page" style={{ background: `linear-gradient(135deg,hsl(${h} 80% 60%),hsl(${h + 40} 70% 40%))` }} />)}</div>
              <p className="text-[14px] text-dim">13,490 people supporting us</p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end"><Seg id="cycle" value={cycle} onChange={setCycle} options={[["q", "Quarterly"], ["y", "Yearly -25%"]]} /><p className="text-[13px] text-dim">Prices are per month, billed quarterly or yearly.</p></div>
        </div>

        <div className="mt-10 grid gap-3 lg:grid-cols-3">
          <article className="flex flex-col rounded-[20px] bg-panel p-[18px] lg:p-6">
            <h2 className="text-[19px] font-semibold">Builder</h2>
            <p className="text-[14px] text-dim">For individuals</p>
            <Price now={yearly ? "$6" : "$8"} was={yearly ? "$8" : undefined} unit="a month" />
            <div className="h-[28px]" />
            <Button className="mt-6 h-10 rounded-[10px] bg-white text-black hover:bg-white/90" render={<Link href="/community/components/" />} nativeButton={false}>Get Builder plan</Button>
            <Features items={["Unlimited component installs", "All premium templates & themes", "CLI & MCP install", "Commercial license", "Bookmarks and collections", "New drops every week", "Cancel anytime"]} />
          </article>

          <article className="relative flex flex-col rounded-[20px] bg-panel p-[18px] lg:p-6 ring-2 ring-brand">
            <span className="absolute top-6 right-6 rounded-full bg-brand px-2.5 py-0.5 text-[12px] font-medium">Popular</span>
            <h2 className="text-[19px] font-semibold">Builder + AI</h2>
            <p className="text-[14px] text-dim">Build with AI. Review every PR</p>
            <Price now={`$${yearly ? CREDITS[credit].y : CREDITS[credit].q}`} was={yearly ? `$${CREDITS[credit].q}` : undefined} unit="a month" />
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-dim">Credits</span>
              <Seg id="credits" value={String(credit)} onChange={(v) => setCredit(Number(v))} options={CREDITS.map((c, i) => [String(i), c.n])} />
            </div>
            <Button className="mt-6 h-10 rounded-[10px]" render={<Link href="/c/aurora-mesh-background/" />} nativeButton={false}>Get Builder + AI plan</Button>
            <Features items={["Everything in Builder", `Up to ${CREDITS[credit].n} AI credits monthly`, "Design Bug Bot on 3 repos", "Priority email support", "Generate components from a prompt", "Edit with top AI models", "Top up after you use them all"]} />
          </article>

          <article className="flex flex-col rounded-[20px] bg-panel p-[18px] lg:p-6">
            <h2 className="text-[19px] font-semibold">Team</h2>
            <p className="text-[14px] text-dim">For agencies and businesses, 2 to 50 seats</p>
            <Price now={`$${yearly ? "7.50" : "10"}`} was={yearly ? "$10" : undefined} unit="a seat / month" />
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-dim">Seats</span>
              <div className="flex items-center rounded-[10px] bg-white/[0.05]">
                <button type="button" aria-label="Fewer seats" disabled={seats <= 2} onClick={() => setSeats((s) => s - 1)} className="flex size-7 items-center justify-center disabled:opacity-30"><Minus className="size-3.5" /></button>
                <span className="w-8 text-center text-[13px] tabular-nums">{seats}</span>
                <button type="button" aria-label="More seats" disabled={seats >= 50} onClick={() => setSeats((s) => s + 1)} className="flex size-7 items-center justify-center disabled:opacity-30"><Plus className="size-3.5" /></button>
              </div>
              <span className="text-[13px] text-dim">${team.toFixed(2)} / month</span>
            </div>
            <Button className="mt-6 h-10 rounded-[10px] bg-white text-black hover:bg-white/90" render={<Link href="/community/components/" />} nativeButton={false}>Get Team plan</Button>
            <Features items={["Everything in Builder + AI", "Shared AI credit pool", "Unlimited Bug Bot repos", "Centralized billing & seat controls", "Shared bookmarks", "Admin roles for up to 100 seats", "Invoices for your company"]} />
          </article>
        </div>

        <div className="mt-3 flex flex-col gap-4 rounded-[20px] bg-panel p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[19px] font-semibold">Free</h2>
            <p className="text-[14px] text-dim">Browse the whole library, copy 2 components a day and try {BRAND} AI with 5 credits.</p>
          </div>
          <Button variant="secondary" className="h-10 rounded-[10px] bg-chip px-4 text-ink" render={<Link href="/community/components/" />} nativeButton={false}>Start for free</Button>
        </div>
        <p className="mt-6 text-center text-[14px] text-dim">Used by 4,736,063 builders, from indie makers to big teams.<br />Cancel anytime and keep access to the end of your billing period.</p>
      </section>

      <section className="site-col pt-4 pb-[72px] lg:pb-[115px]">
        <h2 className="display text-[28px] md:text-[37.44px] lg:text-[46px]">Every plan opens all of it</h2>
        <p className="mt-3 text-[16px] text-dim">The whole library, from $6 a month</p>
        <div className="mt-10 grid grid-cols-2 overflow-hidden rounded-[16px] border border-white/[0.08] md:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-white/[0.08]">
          {STATS.map(([n, l, d, href]) => (
            <Link key={l} href={href} className="flex min-h-[161px] flex-col p-5 transition-colors hover:bg-white/[0.03]">
              <span className="text-[32px] font-semibold tracking-[-0.04em]">{n}</span>
              <span className="mt-1 text-[15px] font-medium">{l}</span>
              <span className="mt-1 text-[14px] text-dim">{d}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="site-col pt-10 pb-[72px] md:pt-14 lg:pb-[115px]">
        <h2 className="display text-[28px] md:text-[37.44px] lg:text-[46px]">Compare plans</h2>
        <p className="mt-3 text-[16px] text-dim">Every plan, side by side</p>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[14px]">
            <thead>
              <tr>
                <th className="w-[30%]" />
                {[["Free", "$0 forever"], ["Builder", `$${yearly ? 6 : 8} a month`], ["Builder + AI", `from $${yearly ? 15 : 20} a month`], ["Team", `$${yearly ? "7.50" : 10} a seat / month`]].map(([n, p], i) => (
                  <th key={n} className={cn("px-4 pt-5 pb-4 align-top font-medium", i === 2 && "rounded-t-[16px] bg-brand/10")}>
                    {n}<p className="font-normal text-dim">{p}</p>
                    <Button size="sm" variant="secondary" className={cn("mt-3 w-full rounded-lg bg-chip text-ink", i === 2 && "bg-brand text-white hover:bg-brand/90")} render={<Link href="/community/components/" />} nativeButton={false}>Get started</Button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([group, label, vals], r) => (
                <Fragment key={label}>
                  {group !== ROWS[r - 1]?.[0] && (
                    <tr><td colSpan={5} className="pt-8 pb-2 text-[13px] font-medium text-dim">{group}</td></tr>
                  )}
                  <tr className="border-t border-white/[0.06]">
                    <td className="py-3 pr-4 text-ink-soft">{label}</td>
                    {vals.map((v, i) => (
                      <td key={i} className={cn("px-4 py-3", i === 2 && "bg-brand/10")}>
                        {v === true ? <span className="relative block size-1.5 rounded-full bg-brand"><span className="sr-only">Included</span></span> : v === false ? <span className="relative text-white/30">–<span className="sr-only">Not included</span></span> : v}
                      </td>
                    ))}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
