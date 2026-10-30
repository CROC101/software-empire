import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * A link drawn like a plan: on hover or keyboard focus a dashed frame draws itself round it, side
 * by side, corner dots run out to meet it, and a faint hatch fills the margin. Colours follow
 * `currentColor`, so it sits on a dark band or a light page alike.
 *
 * After 21st.dev "dot border button" (MengTo/threeui): the same choreography, rebuilt as plain CSS
 * (`.bpb` in styles.css) — no iframe, no Tailwind CDN, transform / opacity only (the original
 * moved the dots by top / left), no letter-spacing on hover (Thai comes apart), reduced motion
 * shows the finished frame.
 */
export function BlueprintButton({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a href={href} className={cn("bpb", className)}>
      <span aria-hidden className="bpb-line bpb-top" />
      <span aria-hidden className="bpb-line bpb-right" />
      <span aria-hidden className="bpb-line bpb-bottom" />
      <span aria-hidden className="bpb-line bpb-left" />
      <span aria-hidden className="bpb-dot bpb-tl" />
      <span aria-hidden className="bpb-dot bpb-tr" />
      <span aria-hidden className="bpb-dot bpb-br" />
      <span aria-hidden className="bpb-dot bpb-bl" />
      <span className="bpb-label">{children}</span>
    </a>
  );
}
