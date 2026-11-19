import { ArrowUpRight } from "lucide-react";
import { useId, type CSSProperties } from "react";

/** Text runs round a circle that turns slowly, with an icon in the middle (a classic "scroll / contact" badge). */
export default function CircleText({
  text = "CROCWORK • DESIGN • REGISTRY • ",
  speed = 16,
}: {
  text?: string;
  speed?: number;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <style>{`@keyframes circle-text-spin{to{transform:rotate(360deg)}}.circle-text-ring{animation:circle-text-spin var(--t) linear infinite}@media (prefers-reduced-motion:reduce){.circle-text-ring{animation:none}}`}</style>
      <div className="relative grid size-44 place-items-center">
        <svg
          viewBox="0 0 200 200"
          aria-label={text}
          role="img"
          className="circle-text-ring vt-live absolute inset-0 size-full"
          style={{ "--t": `${speed}s` } as CSSProperties}
        >
          <defs>
            <path id={`p${id}`} d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0" />
          </defs>
          <text
            fontSize="15"
            fontWeight="700"
            letterSpacing="3"
            fill="var(--em-ink-100)"
            className="font-mono"
          >
            <textPath href={`#p${id}`}>{text}</textPath>
          </text>
        </svg>
        <span className="grid size-16 place-items-center rounded-full bg-(--em-blue-600) text-(--em-ink-0)">
          <ArrowUpRight aria-hidden className="size-7" />
        </span>
      </div>
    </div>
  );
}
