/** Animated 4-bar visualizer shown next to the playing track. */
export default function EqualizerBars({ paused, className = '' }: { paused?: boolean; className?: string }) {
  return (
    <span aria-label="Now playing" className={`inline-flex h-[14px] items-end gap-[2px] ${className}`}>
      {[0, 0.25, 0.5, 0.15].map((d, i) => (
        <span
          key={i}
          className="eq-bar block h-full w-[3px] rounded-xs bg-green"
          style={{ animationDelay: `${d}s`, animationPlayState: paused ? 'paused' : 'running' }}
        />
      ))}
    </span>
  );
}
