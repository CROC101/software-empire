import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import DocsShell, { DocH2, DocP, DocTitle } from "@/components/site/DocsShell";
import { registry } from "@/data/registry";

export const metadata: Metadata = { title: "About" };

const SHORTCUTS = [
  { keys: ["⌘ / Ctrl", "K"], what: "Open search from any page" },
  { keys: ["R"], what: "Replay the animation in a playground" },
  { keys: ["↑", "↓"], what: "Move through search results" },
  { keys: ["Enter"], what: "Open the highlighted result" },
  { keys: ["Esc"], what: "Close search or a dialog" },
];

const PRINCIPLES = [
  { title: "Source, not a package", desc: "Each component is one file you copy in. No runtime library, no version lock." },
  { title: "Only what it needs", desc: "Canvas effects use the browser alone. Motion pieces lean on one animation library, nothing else." },
  { title: "Respectful motion", desc: "Animations pause off screen and stay calm for people who ask for reduced motion." },
];

// Rough, hand-measured figures for the free library (minified + gzipped, mid-range laptop).
const BENCH: Record<string, [string, string, string]> = {
  "blur-text": ["1.4 KB", "60", "Text reveal"],
  "split-text-reveal": ["1.6 KB", "60", "Text reveal"],
  "shiny-metallic-text": ["0.9 KB", "60", "CSS only"],
  "decrypted-matrix-text": ["1.2 KB", "60", "Timer based"],
  "magnet-wrapper": ["0.8 KB", "60", "Pointer"],
  "click-spark-canvas": ["1.3 KB", "60", "Canvas"],
  "tilted-3d-card": ["1.1 KB", "60", "Pointer"],
  "pixel-transition-card": ["1.5 KB", "60", "Canvas"],
  "particles-constellation-bg": ["1.9 KB", "58", "Canvas"],
  "aurora-waves-bg": ["1.0 KB", "60", "CSS + rAF"],
};

export default function AboutPage() {
  return (
    <>
      <DocsShell>
        <DocTitle>About Motion Bits</DocTitle>
        <DocP className="mt-6">
          Motion Bits is a free set of animated React pieces built around one idea: zero bloat. You copy the code, you own it, and your bundle only carries
          what you actually use.
        </DocP>

        <DocH2 id="philosophy">Philosophy</DocH2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <li key={p.title} className="card-shell px-4 py-4">
              <h3 className="text-[14.5px] font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-[13.5px] leading-[1.55] text-white/55">{p.desc}</p>
            </li>
          ))}
        </ul>

        <DocH2 id="shortcuts">Keyboard shortcuts</DocH2>
        <dl className="card-shell divide-y divide-white/[0.07]">
          {SHORTCUTS.map((s) => (
            <div key={s.what} className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-[14px] text-white/70">{s.what}</dt>
              <dd className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="min-w-7 rounded-md bg-raise px-2 py-1 text-center font-mono text-xs text-white/80 shadow-hair">
                    {k}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>

        <DocH2 id="benchmark">Bundle &amp; Performance Benchmark</DocH2>
        <DocP>Approximate figures. Watch the live FPS badge in each playground for numbers on your own device.</DocP>
        <div className="mt-5 overflow-x-auto rounded-card shadow-hair">
          <table className="w-full min-w-[560px] border-collapse text-left text-[13.5px]">
            <caption className="sr-only">Size and frame rate per component</caption>
            <thead className="bg-raise text-white/70">
              <tr>
                {["Component", "Size (gzip)", "Typical FPS", "Technique", "Dependencies"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registry.map((r) => {
                const [size, fps, tech] = BENCH[r.slug] ?? ["—", "—", "—"];
                return (
                  <tr key={r.slug} className="border-t border-white/[0.07]">
                    <th scope="row" className="px-4 py-3 font-medium text-white">
                      {r.name}
                    </th>
                    <td className="px-4 py-3 font-mono text-[12.5px] text-white/75">{size}</td>
                    <td className="px-4 py-3 font-mono text-[12.5px] text-emerald-300">{fps}</td>
                    <td className="px-4 py-3 text-white/60">{tech}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-white/50">{r.dependencies.join(", ") || "none"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DocsShell>
      <Footer />
    </>
  );
}
