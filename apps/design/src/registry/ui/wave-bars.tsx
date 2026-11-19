/** Equalizer bars rise and fall in a travelling wave (scaleY only). */
export default function WaveBars({ bars = 5 }: { bars?: number }) {
  const n = Math.min(12, Math.max(3, Math.round(bars)));
  return (
    <div
      className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6"
      role="status"
      aria-label="กำลังเล่นเสียง"
    >
      <style>{`@keyframes wave-bars-beat{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}.wave-bars-bar{animation:wave-bars-beat 1.1s ease-in-out infinite;transform-origin:bottom}@media (prefers-reduced-motion:reduce){.wave-bars-bar{animation:none;transform:scaleY(.6)}}`}</style>
      <div className="flex h-14 items-end gap-1.5">
        {Array.from({ length: n }, (_, i) => (
          <span
            key={i}
            className="wave-bars-bar vt-live h-full w-2 rounded-full bg-linear-to-t from-(--em-blue-600) to-(--em-sky-400)"
            style={{ animationDelay: `${String(-i * 0.12)}s` }}
          />
        ))}
      </div>
    </div>
  );
}
