"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * Tideline CTA: a closing section where a tide rises to a real level (`level`, 0..1) as it
 * scrolls into view. The surface rolls forever without a seam (the wave mask slides exactly one
 * wavelength per loop), every word under the water is drawn again in the water's colours, and
 * the action floats on the waterline like a buoy, along with anything passed as `floating`.
 *
 * Light: the rise is a transform; the roll is a mask-position loop that pauses off screen and
 * under reduced motion. Styles: `.tlc` in styles.css.
 */
export function TidelineCta({
  eyebrow,
  headline,
  sub,
  level,
  levelLabel,
  details = [],
  action,
  href,
  floating,
  className,
}: {
  eyebrow?: ReactNode;
  headline: ReactNode;
  sub?: ReactNode;
  /** 0..1, how high the water rises. Use a true number. */
  level: number;
  /** Says what the water measures, printed with the copy. */
  levelLabel: ReactNode;
  details?: readonly ReactNode[];
  action: ReactNode;
  href: string;
  /** Rides the waterline next to the buoy (a mascot, a badge). */
  floating?: ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(entry?.isIntersecting);
        setOnScreen(visible);
        if (visible && (entry?.intersectionRatio ?? 0) >= 0.3) setSeen(true);
      },
      { threshold: [0, 0.3] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const face = (
    <div className="tlc__inner">
      {eyebrow && <p className="tlc__eyebrow">{eyebrow}</p>}
      <h2 className="tlc__headline">{headline}</h2>
      {sub && <p className="tlc__sub">{sub}</p>}
      <p className="tlc__level">{levelLabel}</p>
      {details.length > 0 && (
        <ul className="tlc__details">
          {details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <section
      ref={root}
      className={cn("tlc vt-live", className)}
      data-seen={seen || undefined}
      data-rolling={onScreen || undefined}
      style={{ "--tlc-level": Math.min(1, Math.max(0, level)) } as CSSProperties}
    >
      <div className="tlc__face">{face}</div>
      <div className="tlc__tide tlc__tide--back" aria-hidden />
      <div className="tlc__tide" aria-hidden inert>
        <div className="tlc__face tlc__face--wet">{face}</div>
      </div>
      <div className="tlc__float">
        <a href={href} className="tlc__buoy">
          {action}
          <svg viewBox="0 0 16 16" aria-hidden>
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </a>
        {floating && <div className="tlc__rider">{floating}</div>}
      </div>
    </section>
  );
}
