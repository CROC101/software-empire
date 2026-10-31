/**
 * The site's reveal engine (FadeContent, TideReveal). Presets after React Bits' FadeContent, tuned
 * for เผ่าน้ำ and rebuilt on the Web Animations API: opacity, transform and filter only, so the
 * browser runs them on the compositor and they stay smooth while the page is busy. No gsap, no
 * ScrollTrigger, no SVG noise filters (FadeContent's dissolve / mist / pixel re-render an SVG
 * filter on the main thread every frame; `mist` here is a blur-and-drift that costs nothing).
 *
 * An element is "armed" (`.fade-armed`: opacity 0) until it plays; when the animation ends it is
 * cancelled, so no filter, transform or layer lingers on the page.
 */

export type FadeEffect = "tide" | "focus" | "develop" | "mist" | "fade";
export type StaggerFrom = "start" | "end" | "center" | "edges" | "random";

// out-expo-ish: quick to arrive, a long soft landing
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const LOOKS: Record<
  FadeEffect,
  { ms: number; frames: (blur: number, from: number) => Keyframe[] }
> = {
  // rises out of the water: a short lift, the blur of water clearing, opacity first
  tide: {
    ms: 1000,
    frames: (b, o) => [
      { opacity: o, transform: "translate3d(0, 18px, 0)", filter: `blur(${String(5 + b)}px)` },
      { opacity: 1, offset: 0.55 },
      { opacity: 1, transform: "translate3d(0, 0, 0)", filter: "blur(0px)" },
    ],
  },
  // a lens finding focus: for headings
  focus: {
    ms: 1100,
    frames: (b, o) => [
      { opacity: o, transform: "scale(0.97)", filter: `blur(${String(12 + b)}px)` },
      { opacity: 1, offset: 0.6 },
      { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
    ],
  },
  // a print developing, grey to colour: for pictures and screens
  develop: {
    ms: 1300,
    frames: (b, o) => [
      {
        opacity: o,
        filter: `grayscale(1) contrast(0.55) brightness(1.3) blur(${String(b)}px)`,
      },
      { opacity: 1, offset: 0.5 },
      { opacity: 1, filter: "grayscale(0) contrast(1) brightness(1) blur(0px)" },
    ],
  },
  // through mist on the water: slow, soft, a little drift
  mist: {
    ms: 1500,
    frames: (b, o) => [
      {
        opacity: o,
        transform: "translate3d(0, 10px, 0) scale(1.02)",
        filter: `blur(${String(16 + b)}px)`,
      },
      { opacity: 1, offset: 0.7 },
      { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)", filter: "blur(0px)" },
    ],
  },
  fade: {
    ms: 700,
    frames: (b, o) => [
      { opacity: o, filter: `blur(${String(b)}px)` },
      { opacity: 1, filter: "blur(0px)" },
    ],
  },
};

export const reducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Hides an element until it plays (call before it would be seen). */
export function arm(el: HTMLElement) {
  el.classList.add("fade-armed");
}

/** Plays one element in. Resolves when it has landed (and its animation is cleared away). */
export function playFade(
  el: HTMLElement,
  effect: FadeEffect,
  {
    delay = 0,
    duration,
    blur = 0,
    from = 0,
  }: { delay?: number; duration?: number; blur?: number; from?: number } = {},
): Promise<void> {
  const look = LOOKS[effect];
  const anim = el.animate(look.frames(blur, from), {
    duration: duration ?? look.ms,
    delay,
    easing: EASE,
    fill: "both",
  });
  return anim.finished.then(
    () => {
      el.classList.remove("fade-armed");
      anim.cancel();
    },
    () => undefined,
  );
}

/** Delay for item `i` of `n`, `each` ms apart, ordered from where the stagger starts. */
export function staggerDelay(i: number, n: number, each: number, from: StaggerFrom) {
  const mid = (n - 1) / 2;
  const rank =
    from === "end"
      ? n - 1 - i
      : from === "center"
        ? Math.abs(i - mid)
        : from === "edges"
          ? mid - Math.abs(i - mid)
          : from === "random"
            ? (Math.imul(i + 1, 2654435761) >>> 0) % Math.max(1, n)
            : i;
  return Math.round(rank * each);
}
