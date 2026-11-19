import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AudioLines, Image as ImageIcon, Layers, MousePointer2, Palette, Shapes, Type, Video } from "lucide-react";
import SplitTextReveal from "@/components/reactbits/SplitTextReveal";
import { CopyButton } from "@/components/playground/CodeBlock";
import DocsShell, { DocH2, DocP, DocTitle, RowCard } from "@/components/site/DocsShell";
import FlavourPicker from "@/components/site/FlavourPicker";
import { BTN } from "@/components/site/Section";
import UpdateModal from "@/components/site/UpdateModal";
import { byCategory, categorySlug } from "@/data/registry";
import { TOOLS } from "@/data/site";
import { CATEGORIES, type Category } from "@/types/component-registry";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Introduction" };

const CAT_INFO: Record<Category, { desc: string; Icon: typeof Type }> = {
  "Text Animations": { desc: "Scroll reveals, curved and circular text, ascii and glitch distortion, one line at a time, scramble, morph, float, blur, glow and shine for headlines.", Icon: Type },
  Animations: { desc: "Ghost cursor trails, electric border glows, elastic micro hover effects and click sparks for any button, nav or menu item.", Icon: MousePointer2 },
  Components: { desc: "A carousel, a slider, infinite galleries, folder and flap cards, depth cards you tilt through and holo glass cards with the motion built in.", Icon: Layers },
  Backgrounds: { desc: "Gradient, light, liquid, dither, dot grid and particle field backgrounds that loop behind heroes, images, videos and full pages.", Icon: ImageIcon },
};
const TOOL_ICONS = [Palette, Video, Shapes, ImageIcon, AudioLines];

const MARKDOWN = `# Introduction

Motion Bits is a free library of animated React components you copy into your project.

1. Find a component
2. Tune its props in the live preview
3. Install it with one command, or copy the source
`;

export default function IntroductionPage() {
  return (
    <>
      <UpdateModal />
      <DocsShell className="pt-0 pb-0 max-tab:pt-0">
        <div className="mx-auto max-w-[675px] pt-[92px] pb-[100px] max-lg:pt-24">
        <DocTitle action={<CopyButton text={MARKDOWN} label="Copy as Markdown" />}>Introduction</DocTitle>
        <DocP className="text-[16px]">
          Motion Bits is a free, open library of animated React components and backgrounds that you copy into your project and make your own. Tune any of them
          in a live preview, then install the exact version your project uses.
        </DocP>

        <ol className="mt-10 grid gap-3 tab:grid-cols-3">
          {[
            { n: 1, t: "Find a component", d: "Browse four categories or search for the effect you have in mind." },
            { n: 2, t: "Make it yours", d: "Tune props in the live preview. The code follows along." },
            { n: 3, t: "Add it to your project", d: "Install the version you use with one command, or copy the source." },
          ].map((s) => (
            <li key={s.n} className="card-shell flex flex-col">
              <div className="card-well flex h-[110px] items-center justify-center overflow-hidden px-3">
                {s.n === 1 && <span className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-[12.5px] text-white/70">split te|</span>}
                {s.n === 2 && <SplitTextReveal text="Make it yours" fontSize={22} />}
                {s.n === 3 && <code className="truncate font-mono text-[10.5px] text-white/65">$ npx shadcn@latest add …</code>}
              </div>
              <div className="px-3 pt-3 pb-3">
                <p className="text-[11.5px] text-white/40">Step {s.n}</p>
                <h2 className="mt-1 text-[15px] font-semibold text-white">{s.t}</h2>
                <p className="mt-1 text-[13px] leading-[1.5] text-white/55">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-2.5">
          <Link href="/components/" className={cn(BTN, "btn-light h-[42px] text-[13.5px]")}>
            Browse components <ArrowRight className="size-4" />
          </Link>
          <Link href="#flavours" className={cn(BTN, "btn-dark h-[42px] text-[13.5px]")}>
            Installation guide
          </Link>
        </div>

        <DocH2>What's inside</DocH2>
        <DocP>Every component belongs to one of four categories, and the catalogue is updated as new pieces land. Open one to browse it.</DocP>
        <div className="mt-6 flex flex-col gap-2">
          {CATEGORIES.map((c) => {
            const { desc, Icon } = CAT_INFO[c];
            return <RowCard key={c} href={`/components/?category=${categorySlug(c)}`} icon={<Icon className="size-4" />} title={c} count={byCategory(c).length} desc={desc} />;
          })}
        </div>

        <DocH2 id="flavours">Four flavours of every component</DocH2>
        <DocP>Each component comes in JavaScript or TypeScript, styled with plain CSS or Tailwind. Pick yours below and the command follows it.</DocP>
        <FlavourPicker />

        <DocH2>Built for AI workflows</DocH2>
        <DocP>Every component is plain, readable source, which makes it easy for coding agents to work with. A few extras help:</DocP>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-[1.68] text-white/60 marker:text-white/40">
          <li>
            <b className="text-white">Copy code</b> on every component copies the configured source or the install command.
          </li>
          <li>
            <b className="text-white">Copy as Markdown</b> on docs pages, this one included, for pasting into a chat.
          </li>
          <li>
            <b className="text-white">Usage tab</b> shows the few lines of import code that follow the props you tuned.
          </li>
          <li>
            <b className="text-white">MCP</b> lets your agent search the catalogue, check the props and install components for you.
          </li>
        </ul>

        <DocH2>Free tools</DocH2>
        <DocP>Five browser tools, free to use.</DocP>
        <div className="mt-6 flex flex-col gap-2">
          {TOOLS.map((t, i) => {
            const Icon = TOOL_ICONS[i];
            return <RowCard key={t.name} href="/tools/" icon={<Icon className="size-4" />} title={t.name} desc={t.desc} />;
          })}
        </div>

        <DocH2>Principles</DocH2>
        <DocP>Four ideas shape every component:</DocP>
        <div className="mt-4 grid gap-3 tab:grid-cols-2">
          {[
            ["You own the code", "Components land in your project as source files, so you can change anything."],
            ["Props first", "The details you'd want to adjust are exposed as props, so most tweaks need no code edits."],
            ["Nothing to depend on", "There's no package to install. Each component lists only its own dependencies."],
            ["Your stack", "JavaScript or TypeScript, plain CSS or Tailwind. All four flavours share the same props."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-[14px] bg-[#18151d] p-4 shadow-hair">
              <h3 className="text-[15px] font-semibold text-white">{t}</h3>
              <p className="mt-1.5 text-[13.5px] leading-[1.55] text-white/55">{d}</p>
            </div>
          ))}
        </div>

        <DocH2>Use motion with care</DocH2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-[1.68] text-white/60 marker:text-white/40">
          <li>
            <b className="text-white">Two or three per page.</b> Effects compete for attention and for the GPU.
          </li>
          <li>
            <b className="text-white">Plan for mobile.</b> Swap heavy effects for lighter ones on small screens.
          </li>
          <li>
            <b className="text-white">Test on real devices.</b> Your machine is probably faster than your users'.
          </li>
        </ul>

        <DocH2>License</DocH2>
        <DocP>
          Free for personal and commercial work. Use the components in any app, site or client project; just don't sell or redistribute the components
          themselves.
        </DocP>

        <DocH2>Keep exploring</DocH2>
        <div className="mt-4 flex flex-col gap-2">
          <RowCard href="/components/" icon={<Layers className="size-4" />} title="All components" desc="Browse the full catalogue with live previews." />
          <RowCard href="/about/" icon={<Type className="size-4" />} title="About & shortcuts" desc="The zero-bloat philosophy, keyboard shortcuts and bundle sizes." />
          <RowCard href="/pro/" icon={<Shapes className="size-4" />} title="The whole product" desc="Pro adds page sections, app UI blocks, templates and an agent kit." />
        </div>
        <div className="mt-16 flex justify-end">
          <Link href="/components/" className={cn(BTN, "btn-dark h-[38px] text-[13px]")}>
            Components <ArrowRight className="size-4" />
          </Link>
        </div>
              </div>
      </DocsShell>
    </>
  );
}
