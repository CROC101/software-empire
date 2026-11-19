import Link from "next/link";
import { ArrowRight, ArrowUpRight, AudioLines, Image as ImageIcon, Palette, Shapes, Video } from "lucide-react";
import BlurText from "@/components/reactbits/BlurText";
import DecryptedMatrixText from "@/components/reactbits/DecryptedMatrixText";
import MagnetWrapper from "@/components/reactbits/MagnetWrapper";
import ParticlesConstellationBg from "@/components/reactbits/ParticlesConstellationBg";
import PixelTransitionCard from "@/components/reactbits/PixelTransitionCard";
import ShinyMetallicText from "@/components/reactbits/ShinyMetallicText";
import Footer from "@/components/layout/Footer";
import Cta from "@/components/site/Cta";
import Faq from "@/components/site/Faq";
import ProCard from "@/components/site/ProCard";
import SponsorGrid from "@/components/site/SponsorGrid";
import Testimonials from "@/components/site/Testimonials";
import HeroStage from "@/components/site/HeroStage";
import { BentoCard, BTN, Section, SectionHead } from "@/components/site/Section";
import { categorySlug, getComponent, registry } from "@/data/registry";
import { sources } from "@/data/sources.generated";
import { PRO_ITEMS, TOOLS } from "@/data/site";
import { CATEGORIES } from "@/types/component-registry";
import { cn } from "@/lib/utils";

const TOOL_ICONS = [Palette, Video, Shapes, ImageIcon, AudioLines];

function Showcase({ slug, children, wellClass, className }: { slug: string; children: React.ReactNode; wellClass: string; className?: string }) {
  const c = getComponent(slug)!;
  return (
    <article className={cn("card-shell flex min-w-0 flex-col", className)}>
      <div className={cn("card-well relative flex items-center justify-center overflow-hidden", wellClass)}>{children}</div>
      <div className="flex items-center gap-3 px-3 pt-[17px] pb-3">
        <h3 className="text-[14.5px] font-semibold text-white">{c.name}</h3>
        <span className="text-xs text-white/40 max-sm:hidden">{c.category}</span>
        <Link href={`/components/${slug}/`} className="ml-auto inline-flex items-center gap-1 text-[13px] text-white/55 hover:text-white">
          Open Playground <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}

export default function Home() {
  const chips = registry.map((r) => r.name);
  const auroraLines = sources.AuroraWavesBg.ts.split("\n").slice(0, 11);

  return (
    <main>
      {/* Hero */}
      <section>
        <div className="mx-auto max-w-[1728px] pt-[117px] pr-8 pb-[72px] pl-11 max-lg:px-[22px] max-lg:pt-[100px] max-lg:pb-12">
          <header className="mb-[38px] flex flex-wrap items-end justify-between gap-x-10 gap-y-6 max-lg:flex-col max-lg:items-stretch max-lg:gap-y-4">
            <div className="max-lg:contents">
              <Link
                href="/tools/"
                className="inline-flex items-center gap-2 rounded-[10px] bg-white/[0.04] p-1 pr-3 text-[13px] font-medium text-white shadow-hair max-lg:hidden"
              >
                <span className="rounded-md bg-white px-2 py-0.5 text-xs text-ink">New</span>
                Center Stage <ArrowRight className="size-3.5 text-white/50" />
              </Link>
              <BlurText
                as="h1"
                text="Animated React components for websites people remember."
                delay={60}
                className="mt-6 max-w-[620px] text-[42px] max-lg:mt-0 leading-[1.1] font-medium tracking-[-0.035em] text-white max-lg:text-[34px] max-sm:text-[29px]"
              />
              <div className="mt-[34px] flex flex-wrap gap-2.5 max-lg:order-last max-lg:mt-1 max-lg:flex-col">
                <Link href="/components/" className={cn(BTN, "btn-light max-lg:w-full")}>
                  Browse components <ArrowRight className="size-4" />
                </Link>
                <Link href="/favorites/" className={cn(BTN, "btn-dark max-lg:w-full")}>
                  View favorites
                </Link>
              </div>
            </div>
            <p className="max-w-[400px] pb-1 text-[16px] leading-[1.6] text-white/60 max-tab:text-[15px]">
              {registry.length} animated components and backgrounds for React. Tune them live, then copy the code.
            </p>
          </header>
          <HeroStage />
        </div>
      </section>

      {/* What's inside */}
      <Section>
        <SectionHead title="What's inside" />
        <div className="tab:max-lg:grid tab:max-lg:grid-cols-2 tab:max-lg:gap-4">
        <div className="grid grid-cols-1 gap-4 tab:max-lg:contents lg:grid-cols-[600px_1fr_1.33fr]">
          <BentoCard
            title={`${registry.length} Components`}
            desc="Backgrounds, text effects, animations and interactive UI. The pieces you'd build by hand, already done."
            visual={
              <div className="flex h-full flex-col justify-center gap-2.5 [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
                {[0, 1].map((row) => (
                  <div key={row} className="flex w-max gap-2.5" style={{ animation: `marquee-left ${row ? 34 : 26}s linear infinite ${row ? "reverse" : ""}` }}>
                    {[...chips, ...chips].map((n, i) => (
                      <span key={i} className="rounded-lg bg-white/[0.06] px-3.5 py-2 text-xs2 font-medium text-white/60 shadow-hair">
                        {n}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            }
          />
          <BentoCard
            title="Visual Editors"
            desc="Five free tools to play with components and create assets for your work."
            visual={
              <div className="flex h-full items-center justify-center gap-2">
                {TOOL_ICONS.map((I, i) => (
                  <span key={i} className="flex size-10 items-center justify-center rounded-[10px] bg-raise text-white/70 shadow-hair">
                    <I className="size-4" />
                  </span>
                ))}
              </div>
            }
          />
          <BentoCard
            title="Well Organized"
            desc="Four clear categories, so you never scroll a wall of unrelated things. Jump straight in:"
            visual={
              <div className="grid h-full grid-cols-2 gap-2 p-3">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c}
                    href={`/components/?category=${categorySlug(c)}`}
                    className="flex items-center justify-between rounded-[10px] bg-white/[0.04] px-3 text-[13px] font-medium text-white/80 shadow-hair transition hover:bg-white/[0.08] hover:text-white"
                  >
                    {c}
                    <ArrowUpRight className="size-3.5 text-white/40" />
                  </Link>
                ))}
              </div>
            }
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 tab:max-lg:contents lg:grid-cols-[415px_1fr_307px]">
          <BentoCard
            title="Pick Your Stack"
            desc="JavaScript or TypeScript, CSS or Tailwind. Every component comes in all four flavours."
            visual={
              <ul className="flex h-full flex-col justify-center gap-1.5 p-3">
                {["JS + CSS", "TS + CSS", "JS + Tailwind", "TS + Tailwind"].map((s, i) => (
                  <li key={s} className={cn("flex h-8 items-center gap-3 rounded-lg px-3 text-[12px]", i === 0 ? "bg-white/[0.06] text-white" : "text-white/30")}>
                    <span className="size-1.5 rounded-full bg-current" />
                    {s}
                    <span className="ml-auto h-1 w-3/5 rounded bg-white/[0.05]" />
                  </li>
                ))}
              </ul>
            }
          />
          <BentoCard
            title="AI-Ready"
            desc="Every component copies as a prompt. Describe what you need, drop it in, ship."
            visual={
              <div className="m-2.5 h-[calc(100%-20px)] rounded-[9px] bg-white/[0.03] p-2.5">
                <p className="flex items-center gap-1.5 text-[11px] text-white/40">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="size-1.5 rounded-full bg-white/20" />
                    ))}
                  </span>
                  Editor
                </p>
                <p className="mt-3 rounded-md bg-black/30 px-2 py-2 text-[11px] text-white/70">
                  $ add a glowing aurora behind the hero <span className="animate-[blink_1s_step-end_infinite]">|</span>
                </p>
              </div>
            }
          />
          <BentoCard
            title="Growing Fast"
            desc="A fast-growing open source library with a busy community."
            visual={
              <div className="relative h-full p-5">
                <p className="text-[11px] text-white/40">GitHub Stars</p>
                <p className="mt-1 text-[48px] leading-none font-medium tracking-[-0.04em] text-white/60">52.2K</p>
                <svg viewBox="0 0 300 80" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-20 w-full" aria-hidden>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="rgba(255,255,255,.18)" />
                      <stop offset="1" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                  </defs>
                  <path d="M0 78 L40 70 L80 60 L120 52 L150 46 L180 40 L210 30 L250 20 L300 8 L300 80 L0 80Z" fill="url(#g)" />
                  <path d="M0 78 L40 70 L80 60 L120 52 L150 46 L180 40 L210 30 L250 20 L300 8" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="1.5" />
                </svg>
              </div>
            }
          />
        </div>
        </div>
      </Section>

      {/* Featured live components */}
      <Section dark>
        <SectionHead title="See them in action" />
        <div className="grid grid-cols-1 gap-3 tab:grid-cols-2 lg:grid-cols-[1.41fr_1fr]">
          <Showcase slug="particles-constellation-bg" wellClass="h-[314px] max-tab:h-[254px]">
            <ParticlesConstellationBg particleCount={110} />
          </Showcase>
          <Showcase slug="decrypted-matrix-text" wellClass="h-[314px] max-tab:h-[254px]">
            <DecryptedMatrixText text="Decrypting..." fontSize={34} animateOn="hover" />
          </Showcase>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 tab:grid-cols-2 lg:grid-cols-[416fr_523fr_309fr]">
          <Showcase slug="shiny-metallic-text" wellClass="h-[192px]">
            <ShinyMetallicText text="Motion Bits" fontSize={52} />
          </Showcase>
          <Showcase slug="pixel-transition-card" wellClass="h-[192px]">
            <PixelTransitionCard width={300} height={190} gridSize={10} />
          </Showcase>
          <Showcase slug="magnet-wrapper" wellClass="h-[192px]" className="tab:max-lg:col-span-2">
            <MagnetWrapper padding={80} label="Pull me closer" />
          </Showcase>
        </div>
      </Section>

      {/* One command */}
      <Section className="pt-28 pb-28 max-tab:pt-20 max-tab:pb-20">
        <div className="grid items-end gap-12 lg:grid-cols-[1fr_1.15fr]">
          <div className="lg:pb-24">
            <h2 className="max-w-[360px] text-[37.44px] leading-[1.12] font-medium tracking-[-0.035em] text-white max-tab:text-[30px]">
              One command, and the code is yours.
            </h2>
            <p className="mt-6 max-w-[430px] text-[15px] leading-[1.6] text-white/55">
              The CLI copies the component source into your Vite, Next.js, Astro or Remix project. No wrapper library and no runtime dependency.
            </p>
            <Link href="/get-started/introduction/" className={cn(BTN, "btn-dark mt-9")}>
              Installation guide <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="relative min-w-0">
            <div className="card-shell mx-auto max-w-[437px] lg:-translate-x-24">
              <p className="py-1.5 text-center text-xs2 text-white/50">Terminal</p>
              <pre className="card-well overflow-x-auto p-4 font-mono text-[12px] leading-[1.8] text-white/70">
                <span className="text-white/40">$</span> npx shadcn@latest add @motion-bits/AuroraWavesBg-TS-TW{"\n"}✓ Checking registry.{"\n"}✓ Created 1 file:{"\n"}  - components/AuroraWavesBg.tsx
              </pre>
            </div>
            <div className="card-shell mt-4 min-w-0 shadow-float">
              <p className="py-1.5 text-center text-xs2 text-white/50">AuroraWavesBg.tsx</p>
              <ol className="card-well overflow-x-auto py-3 font-mono text-[12.5px] leading-[1.75]">
                {auroraLines.map((l, i) => (
                  <li key={i} className="flex gap-5 px-4 whitespace-pre text-white/75">
                    <span className="w-5 shrink-0 text-right text-white/30 select-none">{i + 1}</span>
                    {l || " "}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </Section>

      {/* Pro */}
      <Section dark className="pt-24 pb-[104px] max-tab:pt-[76px] max-tab:pb-[82px]">
        <SectionHead
          title="Build the whole product, not just the hero."
          sub="Page sections, app UI, full templates and agent skills, all as source you own."
          action={
            <Link href="/pro/" className={cn(BTN, "btn-light")}>
              Get Motion Bits Pro <ArrowRight className="size-4" />
            </Link>
          }
        />
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

      {/* Tools */}
      <Section className="pt-24 pb-[104px] max-tab:pt-[72px] max-tab:pb-20">
        <SectionHead title="Five free tools, in your browser." />
        <div className="tab:max-lg:grid tab:max-lg:grid-cols-2 tab:max-lg:gap-3">
        <div className="grid gap-3 tab:max-lg:contents lg:grid-cols-2">
          {TOOLS.slice(0, 2).map((t, i) => (
            <ToolCard key={t.name} {...t} Icon={TOOL_ICONS[i]} tall wide={i === 0} />
          ))}
        </div>
        <div className="mt-3 grid gap-3 tab:max-lg:contents lg:grid-cols-3">
          {TOOLS.slice(2).map((t, i) => (
            <ToolCard key={t.name} {...t} Icon={TOOL_ICONS[i + 2]} />
          ))}
        </div>
        </div>
      </Section>

      {/* Sponsors */}
      <Section className="pt-24 pb-[104px] max-tab:pt-[76px] max-tab:pb-[82px]">
        <SectionHead
          title="Sponsors"
          sub="Motion Bits stays free thanks to these teams."
          action={
            <Link href="/sponsors/" className={cn(BTN, "btn-dark")}>
              Become a sponsor <ArrowRight className="size-4" />
            </Link>
          }
        />
        <SponsorGrid />
      </Section>

      {/* Testimonials */}
      <Section className="pb-10 max-lg:pb-6 max-tab:pt-[60px]">
        <SectionHead title="Loved by developers" />
        <Testimonials />
      </Section>

      {/* FAQ */}
      <Section className="pt-24 pb-28 max-tab:pt-[72px] max-tab:pb-[88px]">
        <div className="grid gap-10 lg:grid-cols-[1fr_700px]">
          <div>
            <h2 className="text-[37.44px] leading-[1.15] font-medium tracking-[-0.035em] text-white max-tab:text-[30px]">Questions, answered</h2>
            <p className="mt-4 max-w-[310px] text-[14.5px] leading-[1.6] text-white/55">What's free, what's in Pro and how the pieces fit together.</p>
          </div>
          <Faq />
        </div>
      </Section>

      <Footer
        cta={<Cta />}
      />
    </main>
  );
}

function ToolCard({ name, desc, hue, Icon, tall, wide }: (typeof TOOLS)[number] & { Icon: typeof Palette; tall?: boolean; wide?: boolean }) {
  return (
    <Link href="/tools/" className={cn("card-shell group flex flex-col", wide && "tab:max-lg:col-span-2")}>
      <div
        className={cn("card-well flex items-center justify-center", tall ? "h-[228px]" : "h-[278px] max-tab:h-[200px]", wide ? "tab:max-lg:h-[355px]" : "tab:max-lg:h-[235px]")}
        style={{ background: `radial-gradient(60% 70% at 50% 50%, ${hue[0]}33, transparent 70%), #0b090e` }}
      >
        <span className="flex size-24 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/85 shadow-float">
          <Icon className="size-10" strokeWidth={1.2} />
        </span>
      </div>
      <div className="flex gap-3 px-3 pt-[22px] pb-4">
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-white">{name}</h3>
          <p className="mt-2 max-w-[400px] text-[13.5px] leading-[1.55] text-white/55">{desc}</p>
        </div>
        <ArrowUpRight className="size-4 text-white/40 transition group-hover:text-white" />
      </div>
    </Link>
  );
}
