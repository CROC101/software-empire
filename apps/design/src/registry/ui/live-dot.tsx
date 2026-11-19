const tones = {
  online: { dot: "bg-(--em-teal-400)", label: "ออนไลน์" },
  busy: { dot: "bg-(--em-gold-500)", label: "ไม่ว่าง" },
  offline: { dot: "bg-(--em-ink-500)", label: "ออฟไลน์" },
};

/** A status dot that pings outward while online or busy, and sits still when offline. */
export default function LiveDot({ status = "online" }: { status?: "online" | "busy" | "offline" }) {
  const t = tones[status];
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <style>{`@keyframes live-dot-ping{0%{transform:scale(1);opacity:.7}100%{transform:scale(3);opacity:0}}.live-dot-ring{animation:live-dot-ping 1.6s cubic-bezier(0,0,.2,1) infinite}@media (prefers-reduced-motion:reduce){.live-dot-ring{display:none}}`}</style>
      <div className="flex items-center gap-3 rounded-lg border border-(--em-ink-800) bg-(--em-ink-900) py-3 pr-5 pl-3">
        <div className="relative">
          <div className="grid size-11 place-items-center rounded-full bg-(--em-blue-700) font-heading font-black text-(--em-ink-0)">
            ค
          </div>
          <span className="absolute right-0 bottom-0 grid size-3.5 place-items-center">
            {status !== "offline" && (
              <span className={`live-dot-ring vt-live absolute inset-0 rounded-full ${t.dot}`} />
            )}
            <span
              className={`relative size-3.5 rounded-full border-2 border-(--em-ink-900) ${t.dot}`}
            />
          </span>
        </div>
        <div>
          <p className="font-semibold text-(--em-ink-50)">crocwork</p>
          <p className="text-xs text-(--em-ink-400)">{t.label}</p>
        </div>
      </div>
    </div>
  );
}
