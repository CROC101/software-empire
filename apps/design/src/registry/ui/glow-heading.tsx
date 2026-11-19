/** A heading resting on night water: its reflection below sways with the ripples and fades with depth. */
export default function GlowHeading({ text = "แสงใต้ผิวน้ำ" }: { text?: string }) {
  const type = "px-2 text-center font-heading text-5xl leading-none font-black sm:text-7xl";
  return (
    <div className="relative flex size-full min-h-56 flex-col items-center justify-center overflow-hidden bg-(--em-ink-975) p-6">
      <style>{`@keyframes glow-heading-ripple{0%,100%{transform:scaleY(-1) scaleX(1) skewX(0)}50%{transform:scaleY(-1) scaleX(1.02) skewX(-4deg)}}.glow-heading-reflect{animation:glow-heading-ripple 7s ease-in-out infinite;mask-image:linear-gradient(to top,#000,transparent 85%)}@media (prefers-reduced-motion:reduce){.glow-heading-reflect{animation:none}}`}</style>
      <h3 className={`${type} relative pb-2 text-(--em-ink-50)`}>{text}</h3>
      <div aria-hidden className="relative w-full">
        <div className="absolute top-0 left-1/2 h-[300%] w-[200vw] -translate-x-1/2 bg-linear-to-b from-(--em-blue-700)/40 to-transparent to-40%" />
        <p className={`${type} glow-heading-reflect vt-live relative pt-2 text-(--em-sky-400)/40`}>
          {text}
        </p>
      </div>
    </div>
  );
}
