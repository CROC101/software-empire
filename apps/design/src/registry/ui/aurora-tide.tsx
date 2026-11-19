import type { CSSProperties, ReactNode } from "react";

// one sum-of-sines waterline, 1200 wide; both sines repeat every 600, so sliding by half loops seamlessly
const wave = (() => {
  let d = "M0 0V16";
  for (let x = 0; x <= 1200; x += 20)
    d += `L${String(x)} ${(16 + 5 * Math.sin((x / 300) * Math.PI * 2) + 2 * Math.sin((x / 150) * Math.PI * 2 + 1)).toFixed(1)}`;
  return `${d}V0Z`;
})();

// light shafts fall from the moon at the top right, slanting down to the left
const shafts = [
  { left: "62%", width: "16%", delay: 0 },
  { left: "74%", width: "9%", delay: -3 },
  { left: "48%", width: "7%", delay: -6 },
  { left: "84%", width: "5%", delay: -2 },
];

/** Under the surface at night: a lapping waterline above, moonlight shafts swaying down through dark water. */
export function AuroraTide({
  title = "แสงใต้น้ำ",
  speed = 16,
  blur = 80,
  intensity = 0.65,
  surface = true,
  children,
}: {
  title?: string;
  /** seconds for one sway of the light */
  speed?: number;
  /** softness of the shafts' edges */
  blur?: number;
  intensity?: number;
  /** the lapping waterline along the top */
  surface?: boolean;
  /** replaces the title, so a page hero can sit on the same water */
  children?: ReactNode;
}) {
  return (
    <div
      className="relative isolate flex size-full min-h-56 items-center justify-center overflow-hidden bg-linear-to-b from-(--em-blue-700) to-(--em-ink-975)"
      style={{ "--t": `${String(speed)}s`, "--a": String(intensity) } as CSSProperties}
    >
      <style>{`@keyframes aurora-tide-sway{0%,100%{transform:rotate(16deg) scaleX(1);opacity:var(--a)}50%{transform:rotate(22deg) scaleX(1.25);opacity:calc(var(--a)*.45)}}@keyframes aurora-tide-lap{to{transform:translateX(-50%)}}.aurora-tide-shaft{animation:aurora-tide-sway var(--t) ease-in-out infinite}.aurora-tide-lap{animation:aurora-tide-lap 7s linear infinite}.aurora-tide-lap.slow{animation-duration:11s;animation-direction:reverse}@media (prefers-reduced-motion:reduce){.aurora-tide-shaft,.aurora-tide-lap{animation:none}}`}</style>
      {shafts.map((s) => (
        <span
          key={s.left}
          aria-hidden
          className="aurora-tide-shaft vt-live absolute -top-[10%] -z-10 h-[130%] origin-top bg-linear-to-b from-(--em-sky-400) to-transparent to-80%"
          style={{
            left: s.left,
            width: s.width,
            opacity: intensity,
            filter: `blur(${String(Math.round(blur / 5))}px)`,
            animationDelay: `${String(s.delay)}s`,
          }}
        />
      ))}
      {surface && (
        <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-6 overflow-hidden">
          {(["", "slow"] as const).map((k) => (
            <svg
              key={k}
              viewBox="0 0 1200 24"
              preserveAspectRatio="none"
              className={`aurora-tide-lap vt-live absolute top-0 left-0 h-full w-[200%] ${k}`}
            >
              <path d={wave} className={k ? "fill-(--em-sky-500)/25" : "fill-(--em-sky-400)/35"} />
            </svg>
          ))}
        </div>
      )}
      {children ?? (
        <h3 className="px-6 text-center font-heading text-4xl font-black text-(--em-ink-50) sm:text-5xl">
          {title}
        </h3>
      )}
    </div>
  );
}

export default AuroraTide;
