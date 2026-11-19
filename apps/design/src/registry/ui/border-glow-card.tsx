import { Zap } from "lucide-react";
import type { CSSProperties } from "react";

/**
 * A beam of light runs round the card's edge. The beam is a rotating conic square much larger
 * than the card, clipped to a 1px frame: rotation only, no animated gradients.
 */
export default function BorderGlowCard({ speed = 4 }: { speed?: number }) {
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <style>{`@keyframes border-glow-card-spin{to{transform:translate(-50%,-50%) rotate(360deg)}}.border-glow-card-beam{animation:border-glow-card-spin var(--t) linear infinite}@media (prefers-reduced-motion:reduce){.border-glow-card-beam{animation:none}}`}</style>
      <div className="relative w-72 overflow-hidden rounded-xl p-px">
        <span
          aria-hidden
          className="border-glow-card-beam vt-live absolute top-1/2 left-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0_70%,var(--em-sky-400)_85%,var(--em-blue-500)_92%,transparent_100%)]"
          style={{ "--t": `${speed}s` } as CSSProperties}
        />
        <div className="relative rounded-[calc(0.75rem-1px)] bg-(--em-ink-900) p-6">
          <Zap aria-hidden className="size-6 text-(--em-sky-400)" />
          <h3 className="mt-6 font-heading text-xl font-black text-(--em-ink-50)">
            แพ็กเกจเร็วพิเศษ
          </h3>
          <p className="mt-1 text-sm text-(--em-ink-300)">
            ขอบมีแสงวิ่งรอบตลอดเวลา ใช้กับของที่อยากให้คนเห็นก่อน
          </p>
        </div>
      </div>
    </div>
  );
}
