"use client";

/**
 * A beam of light falls from the top of the frame onto a card, with bright dashes running down it
 * and a glow where it lands. Pure CSS; reduced motion leaves the beam lit and still.
 */
export default function BeamFall({ speed = 1.2, width = 3 }: { speed?: number; width?: number }) {
  return (
    <div className="relative grid size-full min-h-72 justify-items-center overflow-hidden bg-(--em-ink-975) px-6 pb-8">
      <style>{`
        @keyframes beam-fall-run { from { transform: translateY(-50%) } to { transform: translateY(0) } }
        @keyframes beam-fall-glow { 50% { opacity: .55 } }
        @media (prefers-reduced-motion: reduce) { .beam-fall-run, .beam-fall-glow { animation: none !important } }
      `}</style>
      <div aria-hidden className="relative h-40 overflow-hidden" style={{ width }}>
        <span className="absolute inset-0 bg-linear-to-b from-transparent to-(--em-sky-500)/70" />
        <span
          className="beam-fall-run vt-live absolute inset-x-0 -top-full h-[200%] bg-[repeating-linear-gradient(to_bottom,transparent_0_28px,var(--em-ink-0)_28px_40px)] opacity-80"
          style={{ animation: `beam-fall-run ${String(1 / speed)}s linear infinite` }}
        />
      </div>
      <div className="relative w-full max-w-xs">
        <span
          aria-hidden
          className="beam-fall-glow vt-live absolute -top-6 left-1/2 h-12 w-40 -translate-x-1/2 rounded-[50%] bg-(--em-sky-400)/40 blur-xl"
          style={{ animation: `beam-fall-glow ${String(1.6 / speed)}s ease-in-out infinite` }}
        />
        <article className="relative rounded-lg border-t border-(--em-sky-400)/60 bg-(--em-ink-900) p-6 text-center">
          <h3 className="font-heading text-2xl font-black text-(--em-ink-50)">ส่งตรงถึงมือ</h3>
          <p className="mt-2 text-sm text-(--em-ink-400)">ทุกงานผ่านการตรวจก่อนถึงคุณ</p>
        </article>
      </div>
    </div>
  );
}
