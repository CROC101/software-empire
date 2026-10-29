"use client";

import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Icon folder: a glass folder with icon tiles fanned out of it. Pops in when it scrolls into
 * view; hover, tap or Enter spreads the tiles wider, hovering a tile lifts it and lights its tag.
 * The tab outlines are drawn to the real card size. Colours follow the theme through our
 * semantic tokens (--foreground / --background); tiles take a token gradient each.
 *
 * After "Icon Folder" (21st.dev, MIT): tokens instead of the dark/light hex themes, any
 * ReactNode as a tile, a body line under the tags.
 */
export type FolderIcon = {
  node: React.ReactNode;
  /** Tile background, e.g. "linear-gradient(135deg, var(--em-blue-500), var(--em-blue-700))". */
  background: string;
  /** Shown over the tile on hover; a tag with the same text lights up. */
  label?: string;
};

export type IconFolderProps = {
  title: string;
  tags?: readonly string[];
  icons: readonly FolderIcon[];
  /** Small print under the tags. */
  body?: string;
  /** Horizontal distance between fanned tiles, px. */
  spread?: number;
  className?: string;
};

const FG = "var(--foreground)";
const mixFg = (pct: number) =>
  `color-mix(in oklab, var(--foreground) ${String(pct)}%, transparent)`;
const mixBg = (pct: number) =>
  `color-mix(in oklab, var(--background) ${String(pct)}%, transparent)`;
const EASE = "cubic-bezier(.2,.8,.2,1)";

/* folder outlines: the front pocket has its tab on the left, the back plate on the right */
const pathL = (w: number, h: number, r: number, d: number, tw: number, s: number) =>
  `M0 ${String(r)}A${String(r)} ${String(r)} 0 0 1 ${String(r)} 0L${String(tw)} 0C${String(tw + s * 0.55)} 0 ${String(tw + s * 0.45)} ${String(d)} ${String(tw + s)} ${String(d)}L${String(w - r)} ${String(d)}A${String(r)} ${String(r)} 0 0 1 ${String(w)} ${String(d + r)}L${String(w)} ${String(h - r)}A${String(r)} ${String(r)} 0 0 1 ${String(w - r)} ${String(h)}L${String(r)} ${String(h)}A${String(r)} ${String(r)} 0 0 1 0 ${String(h - r)}Z`;
const pathR = (w: number, h: number, r: number, d: number, tw: number, s: number) => {
  const x = w - tw;
  return `M0 ${String(d + r)}A${String(r)} ${String(r)} 0 0 1 ${String(r)} ${String(d)}L${String(x - s)} ${String(d)}C${String(x - s * 0.45)} ${String(d)} ${String(x - s * 0.55)} 0 ${String(x)} 0L${String(w - r)} 0A${String(r)} ${String(r)} 0 0 1 ${String(w)} ${String(r)}L${String(w)} ${String(h - r)}A${String(r)} ${String(r)} 0 0 1 ${String(w - r)} ${String(h)}L${String(r)} ${String(h)}A${String(r)} ${String(r)} 0 0 1 0 ${String(h - r)}Z`;
};

function useShape(
  ref: React.RefObject<HTMLDivElement | null>,
  make: (w: number, h: number) => string,
) {
  const [d, setD] = React.useState("");
  const makeRef = React.useRef(make);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setD(makeRef.current(el.offsetWidth, el.offsetHeight));
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [ref]);
  return d;
}

export function IconFolder({
  title,
  tags = [],
  icons,
  body,
  spread = 62,
  className,
}: IconFolderProps) {
  const gid = React.useId().replace(/:/g, "");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const frontRef = React.useRef<HTMLDivElement>(null);
  const backRef = React.useRef<HTMLDivElement>(null);
  const [shown, setShown] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const [hi, setHi] = React.useState<number | null>(null);
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
    };
  }, []);

  const frontD = useShape(frontRef, (w, h) => pathL(w, h, 20, 22, Math.round(w * 0.42), 40));
  const backD = useShape(backRef, (w, h) => pathR(w, h, 20, 22, Math.round(w * 0.4), 40));

  const n = icons.length;
  const rs = n > 1 ? 25 / (n - 1) : 0; // degrees of tilt per step
  const wide = open || hover;
  const show = shown || reduced;
  const lit = hi === null ? undefined : icons[hi]?.label;
  const toggle = () => {
    setOpen((o) => !o);
  };

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-label={`${title}: ${tags.join(", ")}`}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setHover(true);
      }}
      onPointerLeave={() => {
        setHover(false);
        setHi(null);
      }}
      className={cn(
        "relative isolate h-[300px] w-full max-w-[420px] cursor-pointer select-none outline-none [-webkit-tap-highlight-color:transparent] focus-visible:rounded-3xl focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4",
        className,
      )}
      style={{
        color: FG,
        outlineColor: mixFg(40),
        zIndex: wide ? 2 : undefined,
        opacity: show ? 1 : 0,
        transform: show
          ? wide
            ? "translateY(-6px) scale(1.02)"
            : "none"
          : "translateY(34px) scale(.92)",
        transition: reduced ? "none" : `transform .9s ${EASE}, opacity .6s ease`,
      }}
    >
      {/* soft glow behind the folder */}
      <div
        className="pointer-events-none absolute top-10 right-[8%] left-[8%] -z-10 h-[200px] rounded-full opacity-80 blur-[18px]"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--em-blue-500) 16%, transparent), transparent)",
        }}
      />

      {/* back plate */}
      <div
        ref={backRef}
        className="absolute inset-x-0 top-[14px] bottom-0"
        style={{
          background: `linear-gradient(180deg, ${mixFg(6)}, ${mixFg(2)} 60%)`,
          clipPath: backD ? `path('${backD}')` : undefined,
        }}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          <path d={backD} fill="none" stroke={mixFg(10)} strokeWidth="2" />
        </svg>
      </div>

      {/* fanned tiles */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {icons.map((icon, i) => {
          const k = i - (n - 1) / 2;
          const gap = wide ? spread * 1.15 : spread;
          const y = k * k * 9 - (wide ? 4 : 0);
          const rot = k * rs * (wide ? 1.2 : 1);
          return (
            <div
              key={i}
              className="absolute top-[42px] left-1/2 -ml-[46px] size-[92px] rounded-[24px] [backface-visibility:hidden]"
              style={{
                zIndex: hi === i ? 5 : undefined,
                opacity: show ? 1 : 0,
                transform: show
                  ? `translate3d(${String(k * gap)}px, ${String(y)}px, 0) rotate(${String(rot)}deg)`
                  : `translate3d(${String(k * spread * 0.6)}px, 80px, 0)`,
                transition: reduced
                  ? "none"
                  : `transform ${wide ? "0.6s" : "0.9s"} ${EASE}, opacity .5s`,
                transitionDelay: reduced
                  ? "0s"
                  : wide
                    ? `${String(i * 0.04)}s`
                    : `${String(0.35 + i * 0.08)}s`,
              }}
            >
              <div
                className="pointer-events-auto relative h-full w-full rounded-[inherit]"
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setHi(i);
                }}
                onPointerLeave={() => {
                  setHi((h) => (h === i ? null : h));
                }}
                style={{
                  transform:
                    hi === i
                      ? `translateY(-26px) rotate(${String(-rot)}deg) scale(1.1)`
                      : hi !== null
                        ? "scale(.96)"
                        : "none",
                  filter: hi !== null && hi !== i ? "saturate(.75) brightness(.9)" : "none",
                  transition: reduced ? "none" : `transform .45s ${EASE}, filter .3s ease`,
                }}
              >
                <div
                  className="grid h-full w-full place-items-center overflow-hidden rounded-[inherit] text-white [&_svg]:size-[42%]"
                  style={{
                    background: icon.background,
                    boxShadow: `0 18px 40px ${mixFg(22)}, 0 0 0 1px ${mixFg(10)}, inset 0 1px 0 rgb(255 255 255 / 0.25)`,
                  }}
                >
                  {icon.node}
                </div>
                {icon.label && (
                  <span
                    className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 rounded-full border px-2.5 py-1 text-xs leading-4 font-medium whitespace-nowrap backdrop-blur-[8px]"
                    style={{
                      background: mixBg(85),
                      borderColor: mixFg(10),
                      opacity: hi === i ? 1 : 0,
                      transform: `translateX(-50%) translateY(${hi === i ? "0" : "6px"})`,
                      transition: reduced ? "none" : `opacity .25s ease, transform .35s ${EASE}`,
                    }}
                  >
                    {icon.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* glass front pocket */}
      <div
        ref={frontRef}
        className="absolute inset-x-0 bottom-0 h-[190px] overflow-hidden backdrop-blur-[18px] backdrop-saturate-150"
        style={{
          background: `linear-gradient(160deg, ${mixBg(92)}, ${mixBg(55)} 55%), ${mixFg(4)}`,
          clipPath: frontD ? `path('${frontD}')` : undefined,
          transform: wide ? "translateY(6px)" : "none",
          transition: reduced ? "none" : `transform .6s ${EASE}`,
        }}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          <defs>
            <linearGradient id={`edge-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={mixFg(28)} />
              <stop offset=".35" stopColor={mixFg(10)} />
              <stop offset="1" stopColor={mixFg(4)} />
            </linearGradient>
          </defs>
          <path d={frontD} fill="none" stroke={`url(#edge-${gid})`} strokeWidth="2" />
        </svg>

        <h3 className="m-0 px-[18px] pt-[34px] text-xl leading-[26px] font-black tracking-tight">
          {title}
        </h3>
        {tags.length > 0 && (
          <div className="mx-[18px] mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="h-6 rounded-full border px-2.5 py-0.5 text-xs leading-5 whitespace-nowrap backdrop-blur-[7px]"
                style={{
                  background: mixBg(70),
                  borderColor: lit === tag ? "var(--em-blue-500)" : mixFg(12),
                  color: lit === tag ? FG : "var(--muted-foreground)",
                  transition: "border-color .25s ease, color .25s ease",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {body && (
          <p
            className="mx-[18px] mt-3 line-clamp-2 pr-24 text-xs leading-5"
            style={{ color: "var(--muted-foreground)" }}
          >
            {body}
          </p>
        )}

        <span
          className="absolute right-3.5 bottom-3.5 flex h-[34px] items-center gap-1.5 rounded-full border px-1.5"
          style={{ background: mixBg(80), borderColor: mixFg(10) }}
          aria-hidden
        >
          {icons.map((icon, i) => (
            <span
              key={i}
              className="grid size-[22px] place-items-center overflow-hidden rounded-[7px] text-white [&_svg]:size-[60%]"
              style={{ background: icon.background }}
            >
              {icon.node}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
