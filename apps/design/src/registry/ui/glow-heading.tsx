/** A heading filled with the water gradient, with a soft light breathing behind it. */
export default function GlowHeading({ text = "แสงใต้ผิวน้ำ" }: { text?: string }) {
  return (
    <div className="relative grid size-full min-h-56 place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <style>{`@keyframes glow-heading-breathe{0%,100%{transform:scale(.85);opacity:.35}50%{transform:scale(1.1);opacity:.7}}.glow-heading-halo{animation:glow-heading-breathe 5s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.glow-heading-halo{animation:none;opacity:.45}}`}</style>
      <div
        aria-hidden
        className="glow-heading-halo vt-live absolute h-32 w-[70%] rounded-full bg-(--em-blue-500) blur-3xl"
      />
      <h3 className="relative bg-linear-to-b from-(--em-sky-400) via-(--em-blue-500) to-(--em-blue-700) bg-clip-text pb-2 text-center font-heading text-5xl font-black text-transparent sm:text-7xl">
        {text}
      </h3>
    </div>
  );
}
