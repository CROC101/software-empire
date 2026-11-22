/* eslint-disable */
// @ts-nocheck -- upstream code kept verbatim (crocwork patches marked `crocwork:`)
"use client";
// Provably hero, vendored from D:/projects/Exclusive/22-11-69/provably.tsx (owner's licence).

/**
 * Provably: a certification landing hero. A verification switch in the headline sends a colour wave across a
 * monochrome page, stamping a stack of sample certificates, a stats card and a wax seal as it reaches them. The
 * certificates can be dragged, flipped with the arrow keys, or opened for inspection.
 *
 * Dependencies: react, motion, lucide-react
 *
 * Usage:
 *   <Provably brand={{ name: 'Provably', href: '#top' }} copy={{ eyebrow: '...', lines: ['We make', 'skills'], lastWord: 'official.', subtext: '...' }} />
 *
 * Fonts are not bundled. Provide "Plus Jakarta Sans" (400 to 800) on the host page; the component falls back to the
 * system sans-serif stack.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type {
  ComponentType,
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  Ref,
  RefObject,
  SVGProps,
} from "react";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
} from "motion/react";
import type {
  AnimationPlaybackControls,
  MotionValue,
  TargetAndTransition,
  Transition,
} from "motion/react";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  ChartColumnIcon,
  CheckIcon,
  LinkIcon,
  LockIcon,
  MenuIcon,
  PenToolIcon,
  PlayIcon,
  ShieldCheckIcon,
  TypeIcon,
  XIcon,
} from "lucide-react";

/* ---------------------------------------------------------------------------------------------------------------
 * Public types
 * ------------------------------------------------------------------------------------------------------------- */

export interface ProvablyLink {
  /** Link label. */
  label: string;
  /** Link target. */
  href: string;
}

export interface ProvablyCredential {
  /** Certificate title, e.g. "Product Design". */
  title: string;
  /** Name of the example recipient. */
  recipient: string;
  /** Accent colour for this certificate (any CSS colour, normally a hex). */
  accent: string;
  /** Discipline icon: `pen`, `chart` or `type`. */
  icon: "pen" | "chart" | "type";
  /** Skills covered; the first two show on the card. */
  skills: string[];
}

export type ProvablyLogoKey = "google" | "microsoft" | "ibm" | "aws" | "spotify" | "adobe";

export interface ProvablyCopy {
  /** Small uppercase line above the headline. */
  eyebrow: string;
  /** The headline's first two lines. */
  lines: [string, string];
  /** The last headline word; the switch stands in for its first letter. */
  lastWord: string;
  /** Paragraph under the headline. */
  subtext: string;
}

export interface ProvablyLinks {
  /** Primary button, also used by the round arrow beside the second headline line. */
  explore: ProvablyLink;
  /** Secondary button with a play icon. */
  howItWorks: ProvablyLink;
}

export interface ProvablyToggle {
  /** Screen-reader name of the switch. */
  label: string;
  /** Hint under the switch: one wording for pointers, one for touch. */
  hint: { pointer: string; touch: string };
}

export interface ProvablyStats {
  /** The figure the card counts up to. */
  value: number;
  /** Text after the figure, e.g. "+". */
  suffix: string;
  /** Word before the state word, e.g. "Skills". */
  word: string;
  /** State word before and after verification. */
  states: { off: string; on: string };
  /** Note revealed on hover. */
  note: string;
}

export interface ProvablyCertificate {
  /** Small label on each card. */
  kicker: string;
  /** Type line in the inspection view. */
  type: string;
  /** Label used in the card's accessible name and the inspection view. */
  sampleLabel: string;
  /** Note stating the credential is an example. */
  demoNote: string;
  /** Label before the recipient. */
  recipientLabel: string;
  /** Note after the recipient's name. */
  recipientNote: string;
  /** Status text before and after verification. */
  status: { on: string; off: string };
  /** Status description before and after verification. */
  statusDetail: { on: string; off: string };
  /** Prompt that replaces the skills on hover. */
  hover: string;
  /** Share button labels: idle, after copying, and while locked. */
  share: { idle: string; done: string; locked: string };
  /** Tilt in degrees at rest, once verified and while hovered. */
  tilt: { rest: number; verified: number; hover: number };
}

export interface ProvablyStatusBadge {
  /** Ring lettering before verification. */
  off: string;
  /** Ring lettering after verification. */
  on: string;
  /** Lettering along the bottom of the ring. */
  tail: string;
  /** Degrees the seal sits rotated. */
  stampTilt: number;
  /** Tooltip shown on hover. */
  hint: string;
  /** The reverse of the seal. */
  back: { title: string; text: string; action: string };
}

export interface ProvablyTrust {
  /** Label above the logo row. */
  label: string;
  /** Which wordmarks to show, left to right. */
  logos: ProvablyLogoKey[];
}

export interface ProvablyWave {
  /** Seconds the wave takes to cover the hero. Default 0.8. */
  expandDuration?: number;
  /** Seconds it takes to pull back. Default 0.55. */
  contractDuration?: number;
  /** Pause after the click before the wave leaves the toggle, seconds. Default 0.12. */
  expandDelay?: number;
  /** Softness of the wave's edge in px. Default 110. */
  feather?: number;
  /** Strength of the lavender band riding the wave front, 0–1. Default 0.09. */
  bandStrength?: number;
}

export interface ProvablyPulses {
  /** Share of grid lines carrying a pulse, 0–1. Default 1. */
  share?: number;
  /** Segment length in px. Default 64. */
  length?: number;
  /** Shortest cycle, seconds. Default 6. */
  minDuration?: number;
  /** Longest cycle, seconds. Default 11. */
  maxDuration?: number;
  /** Seconds after load before the first pulse. Default 1.6. */
  startAfter?: number;
  /** Segment opacity, 0–1. Default 0.9. */
  opacity?: number;
}

export interface ProvablyAutoplay {
  /** Seconds before the switch turns itself on; 0 disables. Default 2.6. */
  verifyAfter?: number;
  /** Seconds before the certificates start taking turns; 0 disables. Default 4.2. */
  cycleAfter?: number;
  /** Seconds each certificate stays on top. Default 2.6. */
  cycleEvery?: number;
}

export interface ProvablyEntrance {
  /** Seconds before the nav appears. Default 0.05. */
  nav?: number;
  /** Seconds before the eyebrow appears. Default 0.1. */
  eyebrow?: number;
  /** Seconds before the first headline line. Default 0.15. */
  headline?: number;
  /** Seconds between headline lines. Default 0.08. */
  headlineStep?: number;
  /** Seconds before the grid settles in. Default 0.35. */
  grid?: number;
  /** Seconds before the switch appears. Default 0.4. */
  toggle?: number;
  /** Seconds before the side cards appear. Default 0.5. */
  sideCards?: number;
  /** Seconds before the subtext and buttons. Default 0.6. */
  copy?: number;
  /** Seconds before the connector curves. Default 0.65. */
  decor?: number;
  /** Seconds before the trust strip. Default 0.85. */
  trust?: number;
  /** Seconds before the "click to verify" hint. Default 1.4. */
  hint?: number;
}

export interface ProvablyFloat {
  /** Stats card position in design px from the panel's centre line (x) and the top of the eyebrow (y). */
  stats?: { x: number; y: number };
  /** Certificate stack position, same coordinates. */
  certificate?: { x: number; y: number };
  /** Left connector curve position. */
  arcLeft?: { x: number; y: number };
  /** Right connector curve position. */
  arcRight?: { x: number; y: number };
}

export interface ProvablyProps {
  /** Brand name and link in the navigation bar. */
  brand?: { name: string; href: string };
  /** Navigation links (desktop bar and mobile menu). */
  navLinks?: ProvablyLink[];
  /** Call-to-action button at the right of the navigation bar. Omit to hide it. */
  navCta?: ProvablyLink;
  /** Eyebrow, headline and subtext. */
  copy?: ProvablyCopy;
  /** Primary and secondary buttons. */
  links?: ProvablyLinks;
  /** Verification switch labels. */
  toggle?: ProvablyToggle;
  /** Floating stats card. */
  stats?: ProvablyStats;
  /** Copy for the certificate stack and its inspection view. */
  certificate?: ProvablyCertificate;
  /** The sample certificates, top card first. With none, the stack and its dialog are not rendered. */
  credentials?: ProvablyCredential[];
  /** The round wax seal in the bottom right corner. */
  statusBadge?: ProvablyStatusBadge;
  /** The trusted-by row. */
  trust?: ProvablyTrust;
  /** Colour wave timings. */
  wave?: ProvablyWave;
  /** Grid-line pulses. */
  pulses?: ProvablyPulses;
  /** Self-playing behaviour while the hero is left alone. */
  autoplay?: ProvablyAutoplay;
  /** Load sequence timings. */
  entrance?: ProvablyEntrance;
  /** Positions of the floating pieces. */
  float?: ProvablyFloat;
  /** Force reduced motion on or off. Defaults to the user's `prefers-reduced-motion` setting. */
  reducedMotion?: boolean;
  /** Extra classes for the hero root element. */
  className?: string;
}

/* ---------------------------------------------------------------------------------------------------------------
 * Defaults and shared configuration
 * ------------------------------------------------------------------------------------------------------------- */

const DEFAULT_WAVE = {
  expandDuration: 0.8,
  contractDuration: 0.55,
  expandDelay: 0.12,
  feather: 110,
  bandStrength: 0.09,
};
const DEFAULT_PULSES = {
  share: 1,
  length: 64,
  minDuration: 6,
  maxDuration: 11,
  startAfter: 1.6,
  opacity: 0.9,
};
const DEFAULT_AUTOPLAY = { verifyAfter: 2.6, cycleAfter: 4.2, cycleEvery: 2.6 };

const DEFAULT_ENTRANCE = {
  nav: 0.05,
  eyebrow: 0.1,
  headline: 0.15,
  headlineStep: 0.08,
  grid: 0.35,
  toggle: 0.4,
  sideCards: 0.5,
  copy: 0.6,
  decor: 0.65,
  trust: 0.85,
  hint: 1.4,
};

const DEFAULT_FLOAT = {
  stats: { x: -552, y: 50 },
  certificate: { x: 365, y: 100 },
  arcLeft: { x: -357, y: 112 },
  arcRight: { x: 344, y: 262 },
};

const EMPTY_COPY: ProvablyCopy = { eyebrow: "", lines: ["", ""], lastWord: "", subtext: "" };

const EMPTY_LINKS: ProvablyLinks = {
  explore: { label: "", href: "#" },
  howItWorks: { label: "", href: "#" },
};

const EMPTY_TOGGLE: ProvablyToggle = { label: "Verify", hint: { pointer: "", touch: "" } };

const EMPTY_STATS: ProvablyStats = {
  value: 0,
  suffix: "",
  word: "",
  states: { off: "", on: "" },
  note: "",
};

const EMPTY_CERTIFICATE: ProvablyCertificate = {
  kicker: "",
  type: "",
  sampleLabel: "",
  demoNote: "",
  recipientLabel: "",
  recipientNote: "",
  status: { on: "", off: "" },
  statusDetail: { on: "", off: "" },
  hover: "",
  share: { idle: "", done: "", locked: "" },
  tilt: { rest: 9, verified: 4, hover: 0 },
};

const EMPTY_STATUS_BADGE: ProvablyStatusBadge = {
  off: "",
  on: "",
  tail: "",
  stampTilt: -6,
  hint: "",
  back: { title: "", text: "", action: "" },
};

const EMPTY_TRUST: ProvablyTrust = { label: "", logos: [] };

const EMPTY_BRAND = { name: "", href: "#" };

type Config = {
  BRAND: { name: string; href: string };
  NAV_LINKS: ProvablyLink[];
  NAV_CTA: ProvablyLink | undefined;
  COPY: ProvablyCopy;
  LINKS: ProvablyLinks;
  TOGGLE: ProvablyToggle;
  STATS: ProvablyStats;
  CERTIFICATE: ProvablyCertificate;
  CREDENTIALS: ProvablyCredential[];
  STATUS_BADGE: ProvablyStatusBadge;
  TRUST: ProvablyTrust;
  WAVE: typeof DEFAULT_WAVE;
  PULSES: typeof DEFAULT_PULSES;
  AUTOPLAY: typeof DEFAULT_AUTOPLAY;
  ENTRANCE: typeof DEFAULT_ENTRANCE;
  FLOAT: typeof DEFAULT_FLOAT;
  REDUCE: boolean;
};

const ConfigContext = createContext<Config | null>(null);

const useConfig = () => {
  const config = useContext(ConfigContext);

  if (!config) throw new Error("Provably parts must be used inside Provably");

  return config;
};

const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* ---------------------------------------------------------------------------------------------------------------
 * Scoped styles
 * ------------------------------------------------------------------------------------------------------------- */

const PROVABLY_CSS = `
@layer theme, base, components, utilities;

.cv-hero {
  --color-cv-page: #ecebfb;
  --color-cv-ink: #14151f;
  --color-cv-body: #545869;
  --color-cv-muted: #8b8e9c;
  --color-cv-line: #eef0f5;
  --color-cv-violet: #5a4ff0;
  --color-cv-violet-deep: #4639e2;
  --color-cv-lavender: #e7e5fe;
  --color-cv-eyebrow: #8a80f2;
  --color-cv-blue: #4f7cf3;
  --color-cv-purple: #a35cf0;
  --color-cv-orchid: #c26ee6;
  --color-cv-off: #c4c6d0;
  --font-cv-sans: 'Plus Jakarta Sans', 'Plus Jakarta Sans UI', 'Noto Sans Thai UI', ui-sans-serif, system-ui, sans-serif;
}

/* The brand's colour and font utilities, defined here so the class names the markup uses resolve on any host */
.cv-hero.font-cv-sans, .cv-hero .font-cv-sans { font-family: var(--font-cv-sans); }
.cv-hero.text-cv-ink, .cv-hero .text-cv-ink { color: var(--color-cv-ink); }
.cv-hero .text-cv-muted { color: var(--color-cv-muted); }
.cv-hero .text-cv-body { color: var(--color-cv-body); }
.cv-hero .text-cv-violet-deep { color: var(--color-cv-violet-deep); }
.cv-hero .text-cv-violet { color: var(--color-cv-violet); }
.cv-hero .text-cv-off { color: var(--color-cv-off); }
.cv-hero .bg-cv-violet { background-color: var(--color-cv-violet); }
.cv-hero .bg-cv-lavender { background-color: var(--color-cv-lavender); }
.cv-hero .bg-cv-lavender\\/60 { background-color: color-mix(in srgb, var(--color-cv-lavender) 60%, transparent); }
.cv-hero .bg-cv-purple { background-color: var(--color-cv-purple); }
.cv-hero .bg-cv-orchid { background-color: var(--color-cv-orchid); }
.cv-hero .bg-cv-blue { background-color: var(--color-cv-blue); }
.cv-hero .bg-cv-ink { background-color: var(--color-cv-ink); }
.cv-hero .border-cv-violet { border-color: var(--color-cv-violet); }
.cv-hero .border-cv-off { border-color: var(--color-cv-off); }
.cv-hero .fill-cv-violet { fill: var(--color-cv-violet); }
.cv-hero .focus-visible\\:outline-cv-ink:focus-visible { outline-color: var(--color-cv-ink); }
.cv-hero .hover\\:text-cv-ink:hover { color: var(--color-cv-ink); }

.cv-hero {
  position: relative;
  z-index: 0;
  display: flex;
  min-height: 100svh;
  background: #fff;
}

.cv-panel {
  --cv-u: min(1px, 100cqi / 1440, 100svh / 900);
  --cv-uc: max(var(--cv-u), 0.82px);
  container-type: inline-size;
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 100svh;
  overflow: clip;
  background: #fff;
}

.cv-container {
  width: 100%;
  max-width: 1280px;
  margin-inline: auto;
  padding-inline: 16px;
}

@media (min-width: 640px) {
  .cv-container {
    padding-inline: 24px;
  }
}

@property --cv-grid-step {
  syntax: '<length>';
  inherits: false;
  initial-value: 116px;
}

.cv-grid {
  --cv-grid-step: max(72px, calc(116 * var(--cv-u)));
  --cv-grid-line: var(--color-cv-line);
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: linear-gradient(to right, var(--cv-grid-line) 1px, transparent 1px);
  background-size: var(--cv-grid-step) 100%;
  background-position: calc(50% - var(--cv-grid-step) / 2) 0;
  mask-image: linear-gradient(to bottom, transparent 0, transparent 84px, #000 180px, #000 90%, transparent);
}

.cv-glints {
  --cv-gy: 50%;
  position: absolute;
  inset: 0;
  pointer-events: none;
  mask-image: linear-gradient(to bottom, transparent 0, transparent 84px, #000 180px, #000 90%, transparent);
}

.cv-glint {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  opacity: 0;
  background: linear-gradient(
    to bottom,
    transparent calc(var(--cv-gy) - 260px),
    rgb(112 98 255 / 0.6) var(--cv-gy),
    transparent calc(var(--cv-gy) + 260px)
  );
}

.cv-pulses {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  mask-image: linear-gradient(to bottom, transparent 0, transparent 84px, #000 180px, #000 90%, transparent);
}

.cv-pulse {
  position: absolute;
  top: 0;
  width: 1.5px;
  margin-left: -0.25px;
  border-radius: 999px;
  transform: translateY(-100%);
  animation: cv-pulse var(--cv-pulse-duration) linear var(--cv-pulse-delay) infinite;
}

.cv-pulses[data-paused='true'] .cv-pulse {
  animation-play-state: paused;
}

@keyframes cv-pulse {
  0% {
    transform: translateY(-100%);
  }

  62%,
  100% {
    transform: translateY(var(--cv-pulse-travel));
  }
}

.cv-wave {
  --cv-wx: 50%;
  --cv-wy: 50%;
  --cv-r0: 0px;
  --cv-r1: 0px;
  --cv-band-o: 0;
  position: absolute;
  inset: 0;
  z-index: 60;
  pointer-events: none;
}

.cv-wave-gray {
  position: absolute;
  inset: 0;
  -webkit-backdrop-filter: grayscale(1);
  backdrop-filter: grayscale(1);
  -webkit-mask-image: radial-gradient(circle at var(--cv-wx) var(--cv-wy), transparent var(--cv-r0), #000 var(--cv-r1));
  mask-image: radial-gradient(circle at var(--cv-wx) var(--cv-wy), transparent var(--cv-r0), #000 var(--cv-r1));
}

.cv-wave[data-state='clear'] .cv-wave-gray {
  visibility: hidden;
}

.cv-wave[data-state='mono'] .cv-wave-gray {
  visibility: hidden;
}

.cv-hero:has(> .cv-wave[data-state='mono']) > :is(.cv-panel, .cv-dialog) {
  filter: grayscale(1);
}

.cv-wave-band {
  position: absolute;
  inset: 0;
  opacity: var(--cv-band-o);
  background: radial-gradient(
    circle at var(--cv-wx) var(--cv-wy),
    transparent max(0px, calc(var(--cv-r1) - 220px)),
    rgb(112 98 255 / var(--cv-band-strength)) calc(var(--cv-r1) - 70px),
    transparent var(--cv-r1)
  );
}

.cv-wave[data-state='clear'] .cv-wave-band,
.cv-wave[data-state='mono'] .cv-wave-band {
  visibility: hidden;
}

.cv-headline {
  --cv-hs: min(66px, 12.6cqi);
  font-size: var(--cv-hs);
  line-height: 0.94;
  letter-spacing: -0.045em;
  word-spacing: 0.08em;
}

@media (min-width: 1024px) {
  .cv-headline {
    --cv-hs: max(54px, calc(88 * var(--cv-u)));
  }
}

.cv-char {
  transition: font-weight 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.cv-kinetic[data-locked='true'] .cv-char {
  display: inline-block;
  text-align: center;
}

.cv-headline-last {
  white-space: nowrap;
  font-size: 1.34em;
  line-height: 0.9;
  letter-spacing: -0.05em;
}

.cv-toggle {
  --cv-knob-x: 0em;
  touch-action: pan-y;
  position: relative;
  display: inline-block;
  width: 1.72em;
  height: 0.72em;
  margin-right: 0.08em;
  vertical-align: baseline;
  cursor: pointer;
  border-radius: 999px;
  -webkit-tap-highlight-color: transparent;
}

.cv-toggle[aria-checked='true'] {
  --cv-knob-x: 0.91em;
}

.cv-toggle-track {
  position: absolute;
  inset: 0;
  border: 0.045em solid var(--color-cv-off);
  border-radius: inherit;
  background: #f3f3f7;
  box-shadow: inset 0 0.02em 0.06em rgb(20 21 31 / 0.08);
  transition:
    border-color 0.3s ease,
    background-color 0.3s ease,
    box-shadow 0.3s ease;
}

.cv-toggle:hover .cv-toggle-track {
  border-color: #a9abb8;
}

.cv-toggle[aria-checked='true'] .cv-toggle-track {
  border-color: var(--color-cv-violet);
  background: var(--color-cv-lavender);
  box-shadow:
    inset 0 0.02em 0.06em rgb(70 57 226 / 0.15),
    0 0.06em 0.2em -0.04em rgb(90 79 240 / 0.45);
}

.cv-toggle:focus-visible {
  outline: 3px solid var(--color-cv-ink);
  outline-offset: 5px;
}

.cv-toggle-knob {
  position: absolute;
  top: 50%;
  left: 0.085em;
  width: 0.56em;
  height: 0.56em;
  margin-top: -0.28em;
  translate: var(--cv-knob-x) 0;
  border-radius: 999px;
  background: #fff;
  box-shadow:
    0 0.03em 0.08em rgb(20 21 31 / 0.16),
    0 0 0 0.02em rgb(20 21 31 / 0.04);
  transition:
    translate 0.46s cubic-bezier(0.3, 1.35, 0.5, 1),
    scale 0.18s ease;
}

.cv-toggle:hover .cv-toggle-knob {
  translate: calc(var(--cv-knob-x) + 0.04em) 0;
}

.cv-toggle[aria-checked='true']:hover .cv-toggle-knob {
  translate: calc(var(--cv-knob-x) - 0.04em) 0;
}

.cv-toggle[data-dragging='true'] {
  cursor: grabbing;
}

.cv-toggle[data-dragging='true'] .cv-toggle-knob,
.cv-toggle[data-dragging='true']:hover .cv-toggle-knob {
  translate: var(--cv-knob-x) 0;
  scale: 1.06;
  transition: scale 0.18s ease;
}

.cv-toggle:active .cv-toggle-knob {
  scale: 1.1 0.92;
}

.cv-toggle-seal {
  color: var(--color-cv-off);
  transition: color 0.3s ease;
}

.cv-toggle[aria-checked='true'] .cv-toggle-seal {
  color: var(--color-cv-violet);
}

.cv-hint {
  position: absolute;
  top: calc(100% + 0.18em);
  left: 50%;
  display: flex;
  align-items: flex-start;
  gap: 4px;
  translate: -50% 0;
  font-size: 12px;
  line-height: 1;
  letter-spacing: 0;
  word-spacing: normal;
  white-space: nowrap;
}

.cv-hint-arrow {
  display: none;
  width: 40px;
  height: auto;
  margin-top: 6px;
}

@media (min-width: 1024px) {
  .cv-hint {
    top: auto;
    right: calc(100% - 0.06em);
    bottom: 72%;
    left: auto;
    translate: 0 0;
    font-size: 13px;
  }

  .cv-hint-arrow {
    display: block;
  }
}

.cv-hint-touch {
  display: none;
}

.cv-hint-key {
  display: inline-grid;
  min-width: 1.6em;
  margin-left: 0.25em;
  padding: 0.15em 0.35em;
  place-items: center;
  border: 1px solid #d9dbe4;
  border-bottom-width: 2px;
  border-radius: 0.35em;
  background: #fff;
  color: var(--color-cv-body);
  font: inherit;
  font-size: 0.85em;
  font-weight: 600;
  line-height: 1;
}

@media (pointer: coarse) {
  .cv-hint-pointer {
    display: none;
  }

  .cv-hint-touch {
    display: inline;
  }
}

@layer components {
  .cv-sweep {
    --cv-gradient: linear-gradient(110deg, #6d7bff, var(--color-cv-violet) 50%, #8a4ff0);
    --cv-glint: rgb(255 255 255 / 0.55);
    position: relative;
    isolation: isolate;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    transition:
      translate 0.35s cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1),
      background-color 0.3s ease,
      scale 0.2s ease;
  }

  .cv-sweep:hover,
  .cv-sweep:focus-visible {
    translate: 0 -3px;
  }

  .cv-sweep::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(105deg, transparent 35%, var(--cv-glint) 50%, transparent 65%);
    translate: -120% 0;
  }

  .cv-sweep:hover::after,
  .cv-sweep:focus-visible::after {
    translate: 120% 0;
    transition: translate 0.8s cubic-bezier(0.65, 0, 0.35, 1);
  }

  .cv-sweep:active {
    scale: 0.98;
  }

  .cv-sweep:disabled {
    translate: none;
  }

  .cv-sweep:disabled::after {
    display: none;
  }

  .cv-label {
    line-height: 1;
    text-box: trim-both cap alphabetic;
  }

  .cv-sweep-arrow {
    transition: translate 0.4s cubic-bezier(0.3, 1.4, 0.5, 1);
  }

  .cv-sweep:hover .cv-sweep-arrow,
  .cv-sweep:focus-visible .cv-sweep-arrow {
    translate: 3px 0;
  }

  .cv-sweep:hover .cv-sweep-arrow-up,
  .cv-sweep:focus-visible .cv-sweep-arrow-up {
    translate: 2px -2px;
  }

  .cv-outline {
    --cv-glint: rgb(90 79 240 / 0.14);
    border: 1.5px solid transparent;
    background:
      linear-gradient(#fff, #fff) padding-box,
      var(--cv-gradient) border-box;
    color: var(--color-cv-violet-deep);
  }

  .cv-outline:hover,
  .cv-outline:focus-visible {
    background:
      linear-gradient(#f6f5ff, #f6f5ff) padding-box,
      var(--cv-gradient) border-box;
    box-shadow: 0 14px 26px -16px rgb(90 79 240 / 0.55);
  }

  .cv-solid {
    background: var(--cv-gradient);
    color: #fff;
    box-shadow: 0 16px 30px -16px rgb(90 79 240 / 0.8);
  }

  .cv-solid:hover,
  .cv-solid:focus-visible {
    box-shadow: 0 22px 34px -16px rgb(90 79 240 / 0.9);
  }

  .cv-sweep.cv-sweep-link {
    color: var(--color-cv-body);
    transition:
      background-color 0.25s ease,
      color 0.25s ease;
  }

  .cv-sweep.cv-sweep-link:hover,
  .cv-sweep.cv-sweep-link:focus-visible {
    translate: none;
    background-color: var(--color-cv-lavender);
    color: var(--color-cv-violet-deep);
  }

  .cv-sweep.cv-sweep-link::after {
    display: none;
  }
}

.cv-arrow {
  position: absolute;
  top: 50%;
  left: calc(100% + 0.66em);
  width: max(44px, 0.56em);
  height: max(44px, 0.56em);
  translate: 0 -46%;
}

.cv-arrow svg {
  width: 40%;
  height: 40%;
}

.cv-arrow.cv-sweep:hover,
.cv-arrow.cv-sweep:focus-visible {
  translate: 0 calc(-46% - 3px);
}

.cv-sweep:focus-visible,
.cv-cert:focus-visible {
  outline: 3px solid var(--color-cv-ink);
  outline-offset: 4px;
}

.cv-copy-halo {
  position: absolute;
  z-index: -1;
  top: -36px;
  bottom: -28px;
  left: 50%;
  width: 100%;
  translate: -50% 0;
  pointer-events: none;
  background: #fff;
  -webkit-mask-image:
    linear-gradient(to right, transparent, #000 18%, #000 82%, transparent),
    linear-gradient(to bottom, transparent, #000 16%, #000 84%, transparent);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(to right, transparent, #000 18%, #000 82%, transparent),
    linear-gradient(to bottom, transparent, #000 16%, #000 84%, transparent);
  mask-composite: intersect;
}

@media (min-width: 1024px) {
  .cv-copy-halo {
    top: calc(-44 * var(--cv-u));
    bottom: calc(-34 * var(--cv-u));
    width: calc(980 * var(--cv-u));
  }
}

.cv-copy-halo.cv-copy-halo-trust {
  top: -24px;
  bottom: 0;
}

.cv-eyebrow {
  margin-bottom: max(14px, calc(20 * var(--cv-u)));
}

.cv-subtext {
  margin-top: 30px;
  font-size: 15.5px;
  line-height: 1.55;
}

.cv-actions {
  margin-top: 30px;
}

@media (min-width: 1024px) {
  .cv-subtext {
    margin-top: max(18px, calc(26 * var(--cv-u)));
    font-size: clamp(15px, calc(17.5 * var(--cv-u)), 17.5px);
  }

  .cv-actions {
    margin-top: max(26px, calc(38 * var(--cv-u)));
  }
}

.cv-floats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 28px 36px;
  margin-top: 44px;
  padding-bottom: 28px;
}

@media (min-width: 1024px) {
  .cv-floats {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: block;
    margin: 0 auto;
    padding: 0;
    pointer-events: none;
  }

  .cv-float {
    position: absolute;
    top: calc(var(--y) * var(--cv-u));
    left: calc(50% + var(--x) * var(--cv-u));
    pointer-events: auto;
  }
}

.cv-stats-card {
  font-size: calc(16 * var(--cv-uc));
  box-shadow:
    0 0.9em 2em -1em rgb(70 60 200 / 0.22),
    0 0.12em 0.3em rgb(20 21 31 / 0.04);
  transition:
    translate 0.35s cubic-bezier(0.3, 1.2, 0.5, 1),
    box-shadow 0.35s ease,
    border-color 0.35s ease;
}

.cv-stats-card[data-active='true'] {
  border-color: rgb(90 79 240 / 0.14);
  box-shadow:
    0 1.1em 2.2em -1em rgb(70 60 200 / 0.32),
    0 0.12em 0.3em rgb(20 21 31 / 0.05);
}

.cv-stats-card:hover {
  translate: 0 -4px;
  box-shadow:
    0 1.3em 2.4em -1em rgb(70 60 200 / 0.3),
    0 0.12em 0.3em rgb(20 21 31 / 0.05);
}

@media (max-width: 1023.98px) {
  .cv-stats-card,
  .cv-cert-wrap {
    font-size: 15px;
  }
}

.cv-stats-note {
  width: 0;
  min-width: 100%;
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.35s cubic-bezier(0.3, 0, 0.2, 1),
    opacity 0.25s ease;
}

.cv-stats-card:hover .cv-stats-note {
  grid-template-rows: 1fr;
  opacity: 1;
}

.cv-cert-wrap {
  font-size: calc(16 * var(--cv-uc));
}

.cv-badge {
  position: absolute;
  z-index: 20;
  bottom: calc(66 * var(--cv-u));
  left: calc(50% + 458 * var(--cv-u));
  width: calc(150 * var(--cv-uc));
  height: calc(150 * var(--cv-uc));
  font-size: calc(10 * var(--cv-uc));
}

.cv-seal-flip {
  transform-style: preserve-3d;
}

.cv-badge > div {
  perspective: 700px;
}

.cv-seal-face {
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.cv-seal-front:focus-visible {
  outline: 3px solid var(--color-cv-ink);
  outline-offset: 4px;
}

.cv-seal-back {
  transform: rotateY(180deg);
  background: radial-gradient(circle at 34% 28%, #8a82ff, var(--color-cv-violet) 52%, #3127b0);
  box-shadow:
    inset 0 0 0 4px rgb(255 255 255 / 0.12),
    inset 0 2px 6px rgb(255 255 255 / 0.32),
    inset 0 -6px 12px rgb(29 22 112 / 0.35),
    0 14px 26px -14px rgb(29 22 112 / 0.6);
}

.cv-trust-logos {
  gap: 22px 36px;
}

@media (min-width: 1024px) {
  .cv-trust-logos {
    gap: calc(56 * var(--cv-u));
  }
}

.cv-trust-logo {
  height: calc(var(--h) * 0.8px);
}

@media (min-width: 1024px) {
  .cv-trust-logo {
    height: calc(var(--h) * var(--cv-uc));
  }
}

@media (prefers-reduced-motion: reduce) {
  .cv-toggle-knob,
  .cv-sweep,
  .cv-sweep-arrow,
  .cv-stats-card,
  .cv-stats-note {
    transition-duration: 0.01s;
  }

  .cv-sweep::after {
    display: none;
  }

  .cv-pulses,
  .cv-glints {
    display: none;
  }
}
`;

/* ---- credential-seal ---- */
// A twelve-scallop rosette, sampled from r = R + a·cos(12θ) so the bumps stay round at any size
const buildRosette = (radius: number, amplitude: number, bumps: number) => {
  const steps = bumps * 8;

  const points = Array.from({ length: steps }, (_, i) => {
    const angle = (i / steps) * Math.PI * 2;
    const r = radius + amplitude * Math.cos(bumps * angle);

    return `${(24 + r * Math.cos(angle)).toFixed(2)} ${(24 + r * Math.sin(angle)).toFixed(2)}`;
  });

  return `M${points.join("L")}Z`;
};

const ROSETTE = buildRosette(20.5, 1.6, 12);

// The verification rosette; the caller draws the tick over it so it can animate on its own
const CredentialSeal = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" aria-hidden {...props}>
      <path d={ROSETTE} />
    </svg>
  );
};

/* ---- credential-tick ---- */
type TickProps = Omit<
  SVGProps<SVGSVGElement>,
  "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart"
> & {
  drawn: boolean;
  delay?: number;
};

// The tick on the seals, drawn stroke-first when a credential becomes verified
const CredentialTick = ({ drawn, delay = 0, ...props }: TickProps) => {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden {...props}>
      <motion.path
        d="M15.5 24.5l5.8 5.8L33 18.5"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 1 : 0 }}
        transition={{
          pathLength: {
            duration: drawn ? 0.42 : 0.2,
            delay: drawn ? delay : 0,
            ease: [0.65, 0, 0.35, 1],
          },
          opacity: { duration: 0.12, delay: drawn ? delay : 0.12 },
        }}
      />
    </svg>
  );
};

/* ---- credential-wax-seal ---- */
type WaxSealProps = Omit<
  SVGProps<SVGSVGElement>,
  "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart"
> & {
  top: string;
  bottom: string;

  // The specular light's handle, so the caller can move the shine with the pointer
  lightRef?: Ref<SVGFEPointLightElement>;

  // The wax colour's bright spot, moved together with the light
  glowRef?: Ref<SVGRadialGradientElement>;

  // Pressed and verified: the stamped relief catches more light and casts deeper shadows
  active?: boolean;
};

const C = 80;

// The poured-wax outline: a circle with slow ripples and three soft drips, sampled finely enough to read as smooth
const buildBlob = () => {
  const drips = [
    { at: 0.7, size: 4.5, width: 0.22 },
    { at: 2.75, size: 3.4, width: 0.18 },
    { at: 4.95, size: 5.2, width: 0.26 },
  ];

  const points = Array.from({ length: 240 }, (_, i) => {
    const angle = (i / 240) * Math.PI * 2;

    const drip = drips.reduce((sum, { at, size, width }) => {
      const distance = Math.atan2(Math.sin(angle - at), Math.cos(angle - at));

      return sum + size * Math.exp(-(distance * distance) / (2 * width * width));
    }, 0);

    const r =
      67 +
      1.6 * Math.sin(5 * angle + 1) +
      1.1 * Math.sin(9 * angle + 2.4) +
      0.7 * Math.sin(14 * angle) +
      drip;

    return `${(C + r * Math.cos(angle)).toFixed(2)} ${(C + r * Math.sin(angle)).toFixed(2)}`;
  });

  return `M${points.join("L")}Z`;
};

const BLOB = buildBlob();

const arc = (radius: number, from: number, to: number, sweep: 0 | 1) => {
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;

    return `${(C + radius * Math.cos(rad)).toFixed(2)} ${(C + radius * Math.sin(rad)).toFixed(2)}`;
  };

  return `M${point(from)}A${radius} ${radius} 0 0 ${sweep} ${point(to)}`;
};

// Text arcs: the top one runs clockwise over the top, the bottom one anticlockwise so its letters stay upright
const TOP_ARC = arc(36, 194, 346, 1);
const BOTTOM_ARC = arc(44.5, 166, 14, 0);

// Each line is squeezed to its arc, condensed like a real seal's lettering, whatever its length
const TOP_LENGTH = ((36 * 152 * Math.PI) / 180) * 0.97;
const BOTTOM_LENGTH = ((44.5 * 152 * Math.PI) / 180) * 0.97;

const star = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 ? r * 0.45 : r;

    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");

/**
 * A wax seal in the brand violet. The blob gets a soft specular dome, the stamped centre is pressed in (shadow top
 * left, catch-light bottom right), its lettering and logo stand proud of it, and a sheen sweeps across now and then
 */
const CredentialWaxSeal = ({
  top,
  bottom,
  lightRef,
  glowRef,
  active = true,
  ...props
}: WaxSealProps) => {
  // Hooks
  const id = useId();

  // Vars
  const ref = (name: string) => `url(#${id}-${name})`;

  return (
    <svg viewBox="0 0 160 160" fill="none" aria-hidden {...props}>
      <defs>
        <radialGradient ref={glowRef} id={`${id}-wax`} cx="31.6%" cy="26.8%" r="75%">
          <stop offset="0" stopColor="#8a82ff" />
          <stop offset="0.45" stopColor="#5a4ff0" />
          <stop offset="1" stopColor="#3127b0" />
        </radialGradient>
        <radialGradient id={`${id}-pool`} cx="60%" cy="62%" r="70%">
          <stop offset="0" stopColor="#5f55f2" />
          <stop offset="1" stopColor="#4237d4" />
        </radialGradient>
        <filter id={`${id}-soft`} x="-60%" y="-10%" width="220%" height="120%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <clipPath id={`${id}-blob`}>
          <path d={BLOB} />
        </clipPath>
        <path id={`${id}-top`} d={TOP_ARC} />
        <path id={`${id}-bottom`} d={BOTTOM_ARC} />

        {/* Cast shadow on the page plus a glossy dome lit from the top left */}
        <filter id={`${id}-dome`} x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="height" />
          <feSpecularLighting
            in="height"
            surfaceScale="5"
            specularConstant="0.85"
            specularExponent="20"
            lightingColor="#ffffff"
            result="gloss"
          >
            <fePointLight ref={lightRef} x="34" y="22" z="110" />
          </feSpecularLighting>
          <feComposite in="gloss" in2="SourceAlpha" operator="in" result="glossIn" />
          <feComposite
            in="SourceGraphic"
            in2="glossIn"
            operator="arithmetic"
            k2="1"
            k3="0.6"
            result="lit"
          />
          <feDropShadow
            in="lit"
            dx="1.5"
            dy="3"
            stdDeviation="2.6"
            floodColor="#1d1670"
            floodOpacity="0.38"
          />
        </filter>

        {/* Pressed in: dark along the inner top-left edge, a catch-light along the inner bottom-right */}
        <filter id={`${id}-press`} x="-10%" y="-10%" width="120%" height="120%">
          <feOffset in="SourceAlpha" dx="1.6" dy="1.8" result="down" />
          <feComposite in="SourceAlpha" in2="down" operator="out" result="topEdge" />
          <feGaussianBlur in="topEdge" stdDeviation="1.2" result="topSoft" />
          <feFlood floodColor="#1d1670" floodOpacity={active ? 0.75 : 0.4} />
          <feComposite in2="topSoft" operator="in" result="shade" />
          <feOffset in="SourceAlpha" dx="-1.2" dy="-1.3" result="up" />
          <feComposite in="SourceAlpha" in2="up" operator="out" result="bottomEdge" />
          <feGaussianBlur in="bottomEdge" stdDeviation="0.8" result="bottomSoft" />
          <feFlood floodColor="#c9c4ff" floodOpacity={active ? 0.7 : 0.35} />
          <feComposite in2="bottomSoft" operator="in" result="catch" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="shade" />
            <feMergeNode in="catch" />
          </feMerge>
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>

        {/* Raised: lit top-left edge on the relief, small shadow cast down-right */}
        <filter id={`${id}-raise`} x="-10%" y="-10%" width="120%" height="120%">
          <feOffset in="SourceAlpha" dx="0.7" dy="0.8" result="down" />
          <feComposite in="SourceAlpha" in2="down" operator="out" result="rim" />
          <feFlood floodColor="#d6d2ff" floodOpacity={active ? 0.9 : 0.4} />
          <feComposite in2="rim" operator="in" result="light" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="blur" />
          <feOffset in="blur" dx="0.9" dy="1.1" result="drop" />
          <feFlood floodColor="#1d1670" floodOpacity={active ? 0.65 : 0.25} />
          <feComposite in2="drop" operator="in" result="cast" />
          <feMerge>
            <feMergeNode in="cast" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="light" />
          </feMerge>
        </filter>
      </defs>

      <path d={BLOB} fill={ref("wax")} filter={ref("dome")} />
      <circle cx={C} cy={C} r="54" fill={ref("pool")} filter={ref("press")} />

      <g fill="#6158f4" filter={ref("raise")}>
        <circle cx={C} cy={C} r="51" stroke="#6158f4" strokeWidth="2.4" fill="none" />
        <circle cx={C} cy={C} r="26.5" stroke="#6158f4" strokeWidth="2.2" fill="none" />
        <text fontSize="10.5" fontWeight="700">
          <textPath
            href={`#${id}-top`}
            startOffset="1.5%"
            textLength={TOP_LENGTH}
            lengthAdjust="spacingAndGlyphs"
          >
            {top}
          </textPath>
        </text>
        <text fontSize="10.5" fontWeight="700">
          <textPath
            href={`#${id}-bottom`}
            startOffset="1.5%"
            textLength={BOTTOM_LENGTH}
            lengthAdjust="spacingAndGlyphs"
          >
            {bottom}
          </textPath>
        </text>
        <polygon points={star(C - 39.5, C, 3.4)} />
        <polygon points={star(C + 39.5, C, 3.4)} />
        {/* The Provably mark struck into the centre: a raised tile with its P cut in */}
        <rect x="65" y="65" width="30" height="30" rx="9" />
        <path
          d="M75.5 88V72.5h5.5a4.6 4.6 0 0 1 0 9.2h-5.5"
          stroke="#4237d4"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      {/* Light catching the wax: a soft band that sweeps across the seal every few seconds */}
      <g clipPath={ref("blob")}>
        <g transform="rotate(24 80 80)">
          <motion.rect
            y="-40"
            width="22"
            height="240"
            fill="#fff"
            opacity="0.42"
            filter={ref("soft")}
            initial={{ x: -120 }}
            animate={{ x: 200 }}
            transition={{
              duration: 1.5,
              ease: [0.45, 0, 0.25, 1],
              delay: 0.9,
              repeat: Infinity,
              repeatDelay: 3.8,
            }}
          />
        </g>
      </g>
    </svg>
  );
};

/* ---- credential-arc ---- */
type ArcProps = Omit<
  SVGProps<SVGSVGElement>,
  "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart"
> & {
  side: "left" | "right";
  delay: number;
};

/**
 * The thin connector curves that hang off the two floating cards, each ending in a dot. The left one leaves the
 * stats card heading right and bends down; the right one leaves the certificate heading down and bends left
 */
const PATHS = {
  left: { d: "M2 2C30 4 56 26 58 58", dot: [58, 58] },
  right: { d: "M58 2C57 30 36 56 4 60", dot: [4, 60] },
} as const;

const CredentialArc = ({ side, delay, ...props }: ArcProps) => {
  // Vars
  const { d, dot } = PATHS[side];

  return (
    <svg viewBox="0 0 62 64" fill="none" aria-hidden {...props}>
      <motion.path
        d={d}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, delay, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.circle
        cx={dot[0]}
        cy={dot[1]}
        r="3.2"
        className="fill-cv-violet"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 18, delay: delay + 0.55 }}
      />
    </svg>
  );
};

/* ---- credential-chart-bars ---- */
type ChartBarsProps = Omit<
  SVGProps<SVGSVGElement>,
  "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart"
> & {
  active: boolean;
};

// Bar heights at rest and once verified; they rise left to right, one after another
const BARS = [
  { x: 4.5, rest: 4.5, active: 7 },
  { x: 10.5, rest: 7.5, active: 11 },
  { x: 16.5, rest: 10.5, active: 15 },
];

const BASE = 19.5;

// The stats card's chart: a short rising chart that grows taller when the card is verified
const CredentialChartBars = ({ active, ...props }: ChartBarsProps) => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      {BARS.map((bar, index) => {
        const height = active ? bar.active : bar.rest;

        return (
          <motion.rect
            key={bar.x}
            x={bar.x}
            width="3.2"
            rx="1.6"
            initial={false}
            animate={{ y: BASE - height, height }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 18,
              delay: active ? 0.12 + index * 0.09 : (BARS.length - 1 - index) * 0.05,
            }}
          />
        );
      })}
    </svg>
  );
};

/* ---- credential-hint-arrow ---- */
type HintArrowProps = Omit<
  SVGProps<SVGSVGElement>,
  "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart"
> & {
  delay: number;
};

// A loose hand-drawn arrow that curves from the hint label down into the toggle, drawn in once
const CredentialHintArrow = ({ delay, ...props }: HintArrowProps) => {
  // Vars
  const draw = { duration: 0.55, ease: [0.65, 0, 0.35, 1] as const };

  return (
    <svg viewBox="0 0 40 26" fill="none" aria-hidden {...props}>
      <motion.path
        d="M2 5.5C13 1.5 27 3.5 34.5 17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...draw, delay }}
      />
      <motion.path
        d="M28.2 15.4l6.6 2.4 1.1-6.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.25, ease: "easeOut", delay: delay + 0.5 }}
      />
    </svg>
  );
};

/* ---- credential-logo-mark ---- */
// The Provably mark: a white P on a rounded gradient tile, closed by a pale full stop like the headline's "official."
const CredentialLogoMark = (props: SVGProps<SVGSVGElement>) => {
  // Hooks
  const id = useId();

  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden {...props}>
      <defs>
        <linearGradient
          id={`${id}-tile`}
          x1="5"
          y1="5"
          x2="35"
          y2="35"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#7a8bff" />
          <stop offset="0.55" stopColor="#5a4ff0" />
          <stop offset="1" stopColor="#8a4ff0" />
        </linearGradient>
        <linearGradient
          id={`${id}-dot`}
          x1="24"
          y1="25"
          x2="30"
          y2="31"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#e2dfff" />
          <stop offset="1" stopColor="#c3bdfc" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="30" height="30" rx="10" fill={`url(#${id}-tile)`} />
      <path
        d="M15 29V11h6.5a5.5 5.5 0 0 1 0 11H15"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="27" cy="28" r="2.6" fill={`url(#${id}-dot)`} />
    </svg>
  );
};

/* ---- credential-google-logo ---- */
// Google wordmark, single colour so the trust strip tints it
const CredentialGoogleLogo = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox="0 0 512 168" fill="currentColor" aria-hidden {...props}>
      <path d="m496.052 102.672l14.204 9.469c-4.61 6.79-15.636 18.44-34.699 18.44c-23.672 0-41.301-18.315-41.301-41.614c0-24.793 17.816-41.613 39.308-41.613c21.616 0 32.206 17.193 35.633 26.475l1.869 4.735l-55.692 23.049c4.236 8.348 10.84 12.584 20.183 12.584c9.345 0 15.823-4.61 20.495-11.525M452.384 87.66l37.19-15.45c-2.056-5.17-8.16-8.845-15.45-8.845c-9.281 0-22.176 8.223-21.74 24.295" />
      <path d="M407.407 4.931h17.94v121.85h-17.94z" />
      <path d="M379.125 50.593h17.318V124.6c0 30.711-18.128 43.357-39.558 43.357c-20.183 0-32.33-13.58-36.878-24.606l15.885-6.604c2.865 6.79 9.78 14.827 20.993 14.827c13.767 0 22.24-8.535 22.24-24.482v-5.98h-.623c-4.112 4.983-11.961 9.468-21.928 9.468c-20.807 0-39.87-18.128-39.87-41.488c0-23.486 19.063-41.8 39.87-41.8c9.905 0 17.816 4.423 21.928 9.282h.623zm1.245 38.499c0-14.702-9.78-25.417-22.239-25.417c-12.584 0-23.174 10.715-23.174 25.417c0 14.514 10.59 25.042 23.174 25.042c12.46.063 22.24-10.528 22.24-25.042" />
      <path d="M218.216 88.78c0 23.984-18.688 41.613-41.613 41.613c-22.924 0-41.613-17.691-41.613-41.613c0-24.108 18.689-41.675 41.613-41.675c22.925 0 41.613 17.567 41.613 41.675m-18.19 0c0-14.95-10.84-25.23-23.423-25.23S153.18 73.83 153.18 88.78c0 14.826 10.84 25.23 23.423 25.23c12.584 0 23.423-10.404 23.423-25.23" />
      <path d="M309.105 88.967c0 23.984-18.689 41.613-41.613 41.613c-22.925 0-41.613-17.63-41.613-41.613c0-24.108 18.688-41.613 41.613-41.613c22.924 0 41.613 17.443 41.613 41.613m-18.253 0c0-14.95-10.839-25.23-23.423-25.23s-23.423 10.28-23.423 25.23c0 14.826 10.84 25.23 23.423 25.23c12.646 0 23.423-10.466 23.423-25.23" />
      <path d="M66.59 112.328c-26.102 0-46.534-21.056-46.534-47.158c0-26.101 20.432-47.157 46.534-47.157c14.079 0 24.357 5.544 31.957 12.646l12.522-12.521C100.479 7.984 86.338.258 66.59.258C30.833.259.744 29.414.744 65.17s30.089 64.912 65.846 64.912c19.312 0 33.889-6.354 45.289-18.19c11.711-11.712 15.324-28.158 15.324-41.489c0-4.174-.498-8.472-1.059-11.649H66.59v17.318h42.423c-1.246 10.84-4.672 18.253-9.718 23.298c-6.105 6.168-15.76 12.958-32.705 12.958" />
    </svg>
  );
};

/* ---- credential-microsoft-logo ---- */
// Microsoft wordmark, single colour so the trust strip tints it
const CredentialMicrosoftLogo = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox="0 0 512 110" fill="currentColor" aria-hidden {...props}>
      <path d="M512 49.449v-9.005h-11.182V26.446l-.376.115l-10.503 3.214l-.206.063v10.606h-16.577v-5.908c0-2.751.615-4.857 1.828-6.26c1.204-1.388 2.926-2.093 5.122-2.093c1.58 0 3.214.372 4.86 1.105l.412.184V17.99l-.194-.07c-1.535-.553-3.623-.83-6.21-.83c-3.262 0-6.225.709-8.81 2.116s-4.62 3.419-6.045 5.976c-1.42 2.554-2.14 5.503-2.14 8.767v6.496h-7.786v9.005h7.786v37.933h11.177V49.449h16.577v24.106c0 9.928 4.682 14.96 13.918 14.96a22.8 22.8 0 0 0 4.746-.528c1.66-.357 2.79-.714 3.456-1.095l.147-.087v-9.088l-.454.301c-.607.405-1.362.735-2.248.98c-.89.25-1.633.376-2.208.376c-2.164 0-3.764-.583-4.758-1.734c-1.004-1.16-1.514-3.191-1.514-6.031v-22.16zm-82.768 29.926c-4.057 0-7.255-1.346-9.51-3.995c-2.267-2.664-3.417-6.46-3.417-11.285c0-4.977 1.15-8.872 3.419-11.583c2.255-2.692 5.423-4.059 9.417-4.059c3.875 0 6.96 1.305 9.17 3.882c2.221 2.589 3.348 6.453 3.348 11.488c0 5.097-1.06 9.013-3.15 11.632c-2.075 2.6-5.196 3.92-9.277 3.92m.498-40.062c-7.74 0-13.888 2.268-18.27 6.741c-4.381 4.474-6.602 10.664-6.602 18.402c0 7.349 2.168 13.26 6.444 17.567s10.096 6.49 17.295 6.49c7.503 0 13.528-2.299 17.91-6.834c4.38-4.53 6.6-10.662 6.6-18.22c0-7.463-2.083-13.418-6.192-17.696c-4.112-4.28-9.895-6.45-17.185-6.45m-42.894 0c-5.265 0-9.62 1.347-12.947 4.002c-3.346 2.671-5.044 6.175-5.044 10.414c0 2.203.366 4.16 1.088 5.82c.725 1.666 1.848 3.132 3.34 4.363c1.48 1.221 3.765 2.5 6.794 3.8c2.545 1.048 4.444 1.935 5.65 2.633c1.179.685 2.016 1.373 2.488 2.043c.459.655.692 1.553.692 2.66c0 3.154-2.361 4.688-7.22 4.688c-1.803 0-3.859-.376-6.111-1.118a23 23 0 0 1-6.257-3.173l-.464-.332v10.76l.17.08c1.582.73 3.576 1.345 5.926 1.83c2.346.484 4.476.731 6.328.731c5.713 0 10.314-1.353 13.67-4.024c3.38-2.69 5.092-6.275 5.092-10.662c0-3.163-.922-5.877-2.74-8.065c-1.803-2.17-4.935-4.163-9.303-5.924c-3.48-1.397-5.71-2.556-6.629-3.446c-.887-.86-1.337-2.076-1.337-3.615c0-1.366.556-2.459 1.697-3.345c1.15-.89 2.75-1.343 4.756-1.343c1.863 0 3.768.294 5.663.87c1.894.577 3.556 1.35 4.945 2.294l.456.312V41.358l-.175-.075c-1.28-.55-2.97-1.02-5.02-1.4c-2.044-.378-3.897-.57-5.508-.57m-47.13 40.062c-4.056 0-7.255-1.346-9.509-3.995c-2.268-2.664-3.415-6.46-3.415-11.285c0-4.977 1.148-8.872 3.418-11.583c2.253-2.692 5.42-4.059 9.416-4.059c3.875 0 6.96 1.305 9.17 3.882c2.221 2.589 3.348 6.453 3.348 11.488c0 5.097-1.06 9.013-3.15 11.632c-2.076 2.6-5.196 3.92-9.278 3.92m.499-40.062c-7.742 0-13.89 2.268-18.27 6.741c-4.38 4.474-6.603 10.664-6.603 18.402c0 7.352 2.17 13.26 6.445 17.567s10.095 6.49 17.296 6.49c7.5 0 13.528-2.299 17.91-6.834c4.379-4.53 6.6-10.662 6.6-18.22c0-7.463-2.084-13.418-6.194-17.696c-4.113-4.28-9.895-6.45-17.184-6.45m-41.84 9.26v-8.129h-11.041v46.937h11.04V63.37c0-4.083.926-7.437 2.753-9.97c1.803-2.503 4.207-3.772 7.14-3.772c.995 0 2.111.164 3.32.489c1.197.322 2.064.672 2.575 1.04l.464.337v-11.13l-.18-.077c-1.027-.437-2.482-.657-4.322-.657c-2.775 0-5.258.891-7.384 2.646c-1.867 1.543-3.217 3.659-4.248 6.297zm-30.813-9.26c-5.065 0-9.584 1.087-13.427 3.228c-3.85 2.145-6.829 5.21-8.855 9.105c-2.017 3.887-3.041 8.427-3.041 13.49c0 4.434.993 8.504 2.955 12.09c1.964 3.593 4.744 6.404 8.262 8.354c3.514 1.947 7.575 2.934 12.07 2.934c5.247 0 9.727-1.049 13.32-3.117l.144-.084V75.198l-.463.339a20.8 20.8 0 0 1-5.402 2.812c-1.952.681-3.73 1.025-5.29 1.025c-4.333 0-7.81-1.355-10.335-4.027c-2.53-2.677-3.813-6.434-3.813-11.163c0-4.758 1.338-8.612 3.974-11.457c2.629-2.835 6.113-4.273 10.356-4.273c3.629 0 7.165 1.229 10.51 3.656l.463.336V41.788l-.149-.084c-1.26-.705-2.976-1.287-5.108-1.728c-2.122-.44-4.198-.663-6.171-.663m-32.927 1.131h-11.042v46.937h11.042zm-5.408-19.995c-1.817 0-3.402.619-4.704 1.844c-1.308 1.23-1.972 2.778-1.972 4.604c0 1.798.656 3.317 1.95 4.514c1.287 1.193 2.877 1.798 4.726 1.798c1.848 0 3.444-.605 4.746-1.796c1.31-1.199 1.975-2.718 1.975-4.516c0-1.762-.647-3.295-1.921-4.554c-1.273-1.257-2.889-1.894-4.8-1.894m-27.548 16.533V87.38h11.268V21.886h-15.595l-19.823 48.647l-19.236-48.647h-16.23v65.495h10.589V36.977h.364l20.313 50.404h7.99l19.996-50.4z" />
      <path d="M51.939 51.939H0V0h51.939z" />
      <path d="M109.287 51.939H57.348V0h51.939z" />
      <path d="M51.938 109.307H0V57.368h51.938z" />
      <path d="M109.287 109.307H57.348V57.368h51.939z" />
    </svg>
  );
};

/* ---- credential-ibm-logo ---- */
// IBM wordmark, single colour so the trust strip tints it
const CredentialIbmLogo = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox="0 0 512 205" fill="currentColor" aria-hidden {...props}>
      <path d="M99.556 190.06v14.223H0V190.06zm155.582 0a53.9 53.9 0 0 1-36.633 14.222l-104.727-.14V190.06Zm148.028 0l-4.966 14.222l-4.922-14.222zm-47.61 0v14.223h-71.111V190.06zm156.444 0v14.223h-71.111V190.06zm-240.753-27.15a54 54 0 0 1-5.722 14.222H113.778V162.91Zm141.45 0l-4.991 14.223h-18.967l-4.992-14.223zm-57.141 0v14.222h-71.111V162.91zm156.444 0v14.222h-71.111V162.91zm-412.444 0v14.222H0V162.91zM71.11 135.757v14.223H28.444v-14.223zm113.778 0v14.223h-42.667v-14.223zm86.017 0a54.3 54.3 0 0 1 1.902 14.223H224.97v-14.223Zm151.324 0l-4.993 14.223h-38.029l-4.994-14.223zm-66.674 0v14.223h-42.667v-14.223zm128 0v14.223h-42.667v-14.223zM71.11 108.606v14.222H28.444v-14.222zm284.445 0v14.222h-42.667v-14.222zm128 0v14.222h-42.667v-14.222zm-229.91 0a54.5 54.5 0 0 1 11.863 14.221H142.222v-14.222Zm178.116 0l-4.992 14.222h-57.095l-4.992-14.223zm-37.538-27.151l3.998 11.496l3.997-11.496h81.336v14.222H440.89V82.61l-4.59 13.068h-76.156l-4.589-13.07v13.07H312.89V81.455zm-252.002 0H265.51a54.5 54.5 0 0 1-11.864 14.222H142.222zm-71.111 0v14.222H28.444V81.454zm0-27.152v14.222H28.444V54.303zm113.778 0v14.222h-42.667V54.303zm87.92 0a54.3 54.3 0 0 1-1.903 14.222H224.97V54.303Zm111.973 0l4.946 14.222H312.89V54.303zm98.773 0v14.222h-76.838l4.945-14.222zm-384-27.152v14.223H0V27.15zm165.97 0a54 54 0 0 1 5.722 14.222h-157.47V27.151Zm246.475 0v14.222h-95.842l4.946-14.222zm-136.66 0l4.946 14.222h-95.841V27.151zM99.557.001v14.221H0V0zM218.505 0a54.1 54.1 0 0 1 36.633 14.222h-141.36V0ZM512 0v14.223h-86.4L430.546.001zM365.9 0l4.945 14.223h-86.4V.001z" />
    </svg>
  );
};

/* ---- credential-aws-logo ---- */
// AWS wordmark, single colour so the trust strip tints it
const CredentialAwsLogo = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox="0 0 256 153" fill="currentColor" aria-hidden {...props}>
      <path d="M72.392 55.438c0 3.137.34 5.68.933 7.545a45.4 45.4 0 0 0 2.712 6.103c.424.678.593 1.356.593 1.95c0 .847-.508 1.695-1.61 2.543l-5.34 3.56c-.763.509-1.526.763-2.205.763c-.847 0-1.695-.424-2.543-1.187a26 26 0 0 1-3.051-3.984c-.848-1.44-1.696-3.052-2.628-5.001q-9.919 11.697-24.922 11.698c-7.12 0-12.8-2.035-16.954-6.103c-4.153-4.07-6.272-9.495-6.272-16.276c0-7.205 2.543-13.054 7.714-17.462c5.17-4.408 12.037-6.612 20.768-6.612c2.882 0 5.849.254 8.985.678c3.137.424 6.358 1.102 9.749 1.865V29.33c0-6.443-1.357-10.935-3.985-13.563c-2.712-2.628-7.29-3.9-13.817-3.9c-2.967 0-6.018.34-9.155 1.103s-6.188 1.695-9.155 2.882c-1.356.593-2.373.932-2.967 1.102s-1.017.254-1.356.254c-1.187 0-1.78-.848-1.78-2.628v-4.154c0-1.356.17-2.373.593-2.966c.424-.594 1.187-1.187 2.374-1.78q4.45-2.29 10.68-3.815C33.908.763 38.316.255 42.978.255c10.088 0 17.463 2.288 22.21 6.866c4.662 4.577 7.036 11.528 7.036 20.853v27.464zM37.976 68.323c2.798 0 5.68-.508 8.731-1.526c3.052-1.017 5.765-2.882 8.053-5.425c1.357-1.61 2.374-3.39 2.882-5.425c.509-2.034.848-4.493.848-7.375v-3.56a71 71 0 0 0-7.799-1.441a64 64 0 0 0-7.968-.509c-5.68 0-9.833 1.102-12.63 3.391s-4.154 5.51-4.154 9.748c0 3.984 1.017 6.951 3.136 8.986c2.035 2.119 5.002 3.136 8.901 3.136m68.069 9.155c-1.526 0-2.543-.254-3.221-.848c-.678-.508-1.272-1.695-1.78-3.305L81.124 7.799c-.51-1.696-.764-2.798-.764-3.391c0-1.356.678-2.12 2.035-2.12h8.307c1.61 0 2.713.255 3.306.848c.678.509 1.187 1.696 1.695 3.306l14.241 56.117l13.224-56.117c.424-1.695.933-2.797 1.61-3.306c.679-.508 1.866-.847 3.392-.847h6.781c1.61 0 2.713.254 3.39.847c.679.509 1.272 1.696 1.611 3.306l13.394 56.795L168.01 6.442c.508-1.695 1.102-2.797 1.695-3.306c.678-.508 1.78-.847 3.306-.847h7.883c1.357 0 2.12.678 2.12 2.119c0 .424-.085.848-.17 1.356s-.254 1.187-.593 2.12l-20.43 65.525q-.762 2.544-1.78 3.306c-.678.509-1.78.848-3.22.848h-7.29c-1.611 0-2.713-.254-3.392-.848c-.678-.593-1.271-1.695-1.61-3.39l-13.14-54.676l-13.054 54.59c-.423 1.696-.932 2.798-1.61 3.391c-.678.594-1.865.848-3.39.848zm108.927 2.289c-4.408 0-8.816-.509-13.054-1.526c-4.239-1.017-7.544-2.12-9.748-3.39c-1.357-.764-2.29-1.611-2.628-2.374a6 6 0 0 1-.509-2.374V65.78c0-1.78.678-2.628 1.95-2.628a4.8 4.8 0 0 1 1.526.255c.508.17 1.271.508 2.119.847a46 46 0 0 0 9.324 2.967a51 51 0 0 0 10.088 1.017c5.34 0 9.494-.932 12.376-2.797s4.408-4.577 4.408-8.053c0-2.373-.763-4.323-2.289-5.934s-4.408-3.051-8.561-4.408l-12.292-3.814c-6.188-1.95-10.765-4.832-13.563-8.647c-2.797-3.73-4.238-7.883-4.238-12.291q0-5.34 2.289-9.41c1.525-2.712 3.56-5.085 6.103-6.95c2.543-1.95 5.425-3.391 8.816-4.408c3.39-1.017 6.95-1.441 10.68-1.441c1.865 0 3.815.085 5.68.339c1.95.254 3.73.593 5.51.932c1.695.424 3.306.848 4.832 1.357q2.288.762 3.56 1.525c1.187.679 2.034 1.357 2.543 2.12q.763 1.017.763 2.797v3.984c0 1.78-.678 2.713-1.95 2.713c-.678 0-1.78-.34-3.22-1.018q-7.25-3.306-16.276-3.306c-4.832 0-8.647.763-11.275 2.374c-2.627 1.61-3.984 4.069-3.984 7.544c0 2.374.848 4.408 2.543 6.019s4.832 3.221 9.325 4.662l12.037 3.815c6.103 1.95 10.511 4.662 13.139 8.137s3.9 7.46 3.9 11.868c0 3.645-.764 6.951-2.205 9.833c-1.525 2.882-3.56 5.425-6.188 7.46c-2.628 2.119-5.764 3.645-9.409 4.747c-3.815 1.187-7.799 1.78-12.122 1.78" />
      <path d="M230.993 120.964c-27.888 20.599-68.408 31.534-103.247 31.534c-48.827 0-92.821-18.056-126.05-48.064c-2.628-2.373-.255-5.594 2.881-3.73c35.942 20.854 80.276 33.484 126.136 33.484c30.94 0 64.932-6.442 96.212-19.666c4.662-2.12 8.646 3.052 4.068 6.442m11.614-13.224c-3.56-4.577-23.566-2.204-32.636-1.102c-2.713.34-3.137-2.034-.678-3.814c15.936-11.19 42.13-7.968 45.181-4.239c3.052 3.815-.848 30.008-15.767 42.554c-2.288 1.95-4.492.933-3.475-1.61c3.39-8.393 10.935-27.296 7.375-31.789" />
    </svg>
  );
};

/* ---- credential-spotify-logo ---- */
// Spotify wordmark, single colour so the trust strip tints it
const CredentialSpotifyLogo = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox="0 0 512 160" fill="currentColor" aria-hidden {...props}>
      <path d="M79.655 0C35.664 0 0 35.663 0 79.654c0 43.993 35.664 79.653 79.655 79.653c43.996 0 79.656-35.66 79.656-79.653c0-43.988-35.66-79.65-79.657-79.65zm36.53 114.884a4.963 4.963 0 0 1-6.83 1.646c-18.702-11.424-42.246-14.011-69.973-7.676a4.967 4.967 0 0 1-5.944-3.738a4.96 4.96 0 0 1 3.734-5.945c30.343-6.933 56.37-3.948 77.367 8.884a4.965 4.965 0 0 1 1.645 6.83m9.75-21.689c-1.799 2.922-5.622 3.845-8.543 2.047c-21.41-13.16-54.049-16.972-79.374-9.284a6.22 6.22 0 0 1-7.75-4.138a6.22 6.22 0 0 1 4.141-7.745c28.929-8.778 64.892-4.526 89.48 10.583c2.92 1.798 3.843 5.622 2.045 8.538m.836-22.585C101.1 55.362 58.742 53.96 34.231 61.4c-3.936 1.194-8.098-1.028-9.29-4.964a7.453 7.453 0 0 1 4.965-9.294c28.137-8.542 74.912-6.892 104.469 10.655a7.44 7.44 0 0 1 2.606 10.209c-2.092 3.54-6.677 4.707-10.206 2.605zm89.944 2.922c-13.754-3.28-16.198-5.581-16.198-10.418c0-4.57 4.299-7.645 10.7-7.645c6.202 0 12.347 2.336 18.796 7.143c.19.145.437.203.675.165a.9.9 0 0 0 .6-.367l6.715-9.466a.903.903 0 0 0-.171-1.225c-7.676-6.157-16.313-9.15-26.415-9.15c-14.848 0-25.225 8.911-25.225 21.662c0 13.673 8.95 18.515 24.417 22.252c13.155 3.031 15.38 5.57 15.38 10.11c0 5.032-4.49 8.161-11.718 8.161c-8.028 0-14.582-2.71-21.906-9.046a.93.93 0 0 0-.656-.218a.9.9 0 0 0-.619.313l-7.533 8.96a.906.906 0 0 0 .086 1.256c8.522 7.61 19.004 11.624 30.323 11.624c16 0 26.339-8.742 26.339-22.277c.028-11.421-6.81-17.746-23.561-21.821zm59.792-13.564c-6.934 0-12.622 2.732-17.321 8.33V62c0-.498-.4-.903-.894-.903h-12.318a.9.9 0 0 0-.894.902v70.009c0 .494.4.903.894.903h12.318a.9.9 0 0 0 .894-.903v-22.097c4.699 5.26 10.387 7.838 17.32 7.838c12.89 0 25.94-9.92 25.94-28.886c.019-18.97-13.032-28.894-25.93-28.894zm11.614 28.893c0 9.653-5.945 16.397-14.468 16.397c-8.418 0-14.772-7.048-14.772-16.397c0-9.35 6.354-16.397 14.772-16.397c8.38 0 14.468 6.893 14.468 16.396m47.759-28.893c-16.598 0-29.601 12.78-29.601 29.1c0 16.143 12.917 28.784 29.401 28.784c16.655 0 29.696-12.736 29.696-28.991c0-16.2-12.955-28.89-29.496-28.89zm0 45.385c-8.827 0-15.485-7.096-15.485-16.497c0-9.444 6.43-16.298 15.285-16.298c8.884 0 15.58 7.093 15.58 16.504c0 9.443-6.468 16.291-15.38 16.291m64.937-44.258h-13.554V47.24c0-.497-.4-.902-.894-.902H374.05a.906.906 0 0 0-.904.902v13.855h-5.916a.9.9 0 0 0-.894.902v10.584a.9.9 0 0 0 .894.903h5.916v27.39c0 11.062 5.508 16.674 16.38 16.674c4.413 0 8.075-.914 11.528-2.873a.88.88 0 0 0 .457-.78v-10.083a.9.9 0 0 0-.428-.76a.87.87 0 0 0-.876-.039c-2.368 1.19-4.66 1.741-7.229 1.741c-3.947 0-5.716-1.798-5.716-5.812V73.49h13.554a.9.9 0 0 0 .894-.903V62.003a.873.873 0 0 0-.884-.903zm47.217.054v-1.702c0-5.006 1.921-7.238 6.22-7.238c2.57 0 4.633.51 6.945 1.28a.895.895 0 0 0 1.18-.858l-.001-10.377a.89.89 0 0 0-.637-.865c-2.435-.726-5.555-1.47-10.235-1.47c-11.367 0-17.388 6.405-17.388 18.516v2.606H428.2a.906.906 0 0 0-.904.902v10.638c0 .497.41.903.904.903h5.916v42.237c0 .504.41.904.904.904h12.308c.504 0 .904-.4.904-.904V73.487h11.5l17.616 42.234c-1.998 4.433-3.967 5.317-6.65 5.317c-2.168 0-4.46-.646-6.79-1.93a.98.98 0 0 0-.714-.067a.9.9 0 0 0-.533.485l-4.175 9.16a.9.9 0 0 0 .39 1.17c4.356 2.359 8.284 3.367 13.145 3.367c9.093 0 14.125-4.242 18.548-15.637l21.364-55.204a.88.88 0 0 0-.095-.838a.88.88 0 0 0-.733-.392h-12.822a.9.9 0 0 0-.856.605l-13.136 37.509l-14.382-37.534a.9.9 0 0 0-.837-.58h-21.04zm-27.375-.054h-12.318a.907.907 0 0 0-.903.902v53.724c0 .504.409.904.903.904h12.318c.495 0 .904-.4.904-.904v-53.72a.9.9 0 0 0-.904-.903zm-6.088-24.464c-4.88 0-8.836 3.95-8.836 8.828a8.835 8.835 0 0 0 8.836 8.836c4.88 0 8.827-3.954 8.827-8.836a8.83 8.83 0 0 0-8.827-8.828" />
    </svg>
  );
};

/* ---- credential-adobe-logo ---- */
// Adobe wordmark, single colour so the trust strip tints it
const CredentialAdobeLogo = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox="0 0 512 134" fill="currentColor" aria-hidden {...props}>
      <path d="m221.02 88.874l-5.524 17.025c-.152.567-.68.952-1.266.921h-13.327c-.805 0-1.033-.46-.922-1.149l23.005-66.373a20.9 20.9 0 0 0 1.155-7.02a.766.766 0 0 1 .689-.804h18.408c.555 0 .805.116.922.688l26.098 73.626c.228.555.117 1.032-.555 1.032h-14.954a1.16 1.16 0 0 1-1.266-.805l-5.864-17.141zm4.138-14.377h18.18l-1.75-5.633c-2.411-7.66-5.621-17.629-7.34-24.047h-.117c-1.838 7.708-5.98 20.363-8.973 29.68m46.932 4.232c-.005-16.448 12.3-30.252 33.356-30.252c.917 0 2.072.116 3.799.227V26.043a.727.727 0 0 1 .587-.797l14.71-.008c.556 0 .695.227.695.688V93.91a65 65 0 0 0 .46 8.402c0 .444-.074.693-.456.89l-.348.142a57.8 57.8 0 0 1-22.662 4.604c-17.025 0-30.14-9.662-30.14-29.22m37.155-16.337a11.9 11.9 0 0 0-4.26-.555a15.35 15.35 0 0 0-16.465 15.007l.018 1.096c0 11.389 6.558 16.337 15.298 16.337a16.2 16.2 0 0 0 5.409-.689zm81.83 14.32l.041 1.206c0 18.063-11.733 30.024-28.32 30.024c-19.673 0-28.414-14.837-28.414-29.68a28.147 28.147 0 0 1 28.642-29.791c18.044 0 27.574 13.211 28.051 28.24m-40.473 1.306c0 10.123 4.715 16.564 12.422 16.564c6.664 0 11.733-5.753 11.733-16.337c0-8.973-3.681-16.447-12.421-16.447c-6.664 0-11.734 5.98-11.734 16.22m50.654-52.78l14.032-.006c.921 0 1.15.117 1.15.922v23.583a37 37 0 0 1 7.706-1.217l1.955-.049a26.326 26.326 0 0 1 27.63 25.998l-.021 1.383c0 21.512-17.025 32.096-34.506 32.096a60.2 60.2 0 0 1-18.063-2.643a1.36 1.36 0 0 1-.689-1.15v-78.11c0-.555.228-.805.806-.805m22.959 36.79l-.987.014a23.4 23.4 0 0 0-6.785.922v31.174c.93.215 1.876.356 2.828.42l1.43.04a15.83 15.83 0 0 0 16.66-17.252a13.516 13.516 0 0 0-13.146-15.317m51.97 20.371c.555 6.558 5.175 11.966 16.448 11.966c4.847.09 9.662-.811 14.148-2.648c.35-.228.694-.117.694.555V103.2c0 .805-.227 1.15-.805 1.383a38.65 38.65 0 0 1-15.79 3.374l-1.812-.043c-21.623 0-29.22-14.837-29.22-29.102c0-15.479 9.296-29.643 26.498-30.342l1.339-.027a23.455 23.455 0 0 1 24.272 24.85a37 37 0 0 1-.556 7.707a.994.994 0 0 1-.921.921q-4.433.42-8.884.47zm14.954-11.156a37.5 37.5 0 0 0 5.753-.227v-.806a9.357 9.357 0 0 0-9.779-9.09a10.9 10.9 0 0 0-11.045 10.123zM75.314 49.137l35.466 84.148H87.535l-10.611-26.798H50.97zM150.599 0v133.269L94.921 0zM55.701 0L0 133.269V0z" />
    </svg>
  );
};

/* ---- use-media-query ---- */
/**
 * Whether a media query matches, kept in sync as it changes. It reports false while hydrating, as the server does,
 * then the real value straight after, so markup that depends on it never mismatches the server render
 */
const useMediaQuery = (query: string) =>
  useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);

      list.addEventListener("change", onChange);

      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );

/* ---- verification-context ---- */
type GeometryType = { x: number; y: number; max: number };

type WaveTargetType = {
  ref: RefObject<HTMLElement | null>;
  notify: (reached: boolean) => void;
  reached?: boolean;

  // The target's centre in the hero's coordinates, read once when a wave starts rather than on every frame
  centre?: { x: number; y: number };
};

type VerificationContextType = {
  verified: boolean;
  interacted: boolean;
  credentialOpen: boolean;
  setCredentialOpen: (open: boolean) => void;

  // Which sample certificate sits on top of the stack, and so opens for inspection
  credentialIndex: number;
  setCredentialIndex: (index: number) => void;
  toggle: () => void;

  // Dragging the toggle: scrub moves the wave by hand, release settles it on or off from wherever it is
  scrub: (value: number) => void;
  release: (on: boolean) => void;

  // 0 = monochrome, 1 = the colour wave has covered the whole hero
  progress: MotionValue<number>;
  rootRef: RefObject<HTMLDivElement | null>;
  toggleRef: RefObject<HTMLButtonElement | null>;
  layersRef: RefObject<HTMLDivElement | null>;
  geometry: RefObject<GeometryType>;
  subscribeReach: (
    ref: RefObject<HTMLElement | null>,
    notify: (reached: boolean) => void,
  ) => () => void;
};

const VerificationContext = createContext<VerificationContextType | null>(null);

/**
 * The hero's one source of truth. `verified` is the visitor's choice and flips the instant they click; `progress`
 * is the wave carrying that choice outward, and every coloured or stateful piece reads its own state from where
 * the wave front is, so a click mid-animation simply turns the wave around and nothing can fall out of step
 */
const VerificationProvider = ({ children }: { children: ReactNode }) => {
  const { WAVE, REDUCE } = useConfig();

  // States
  const [verified, setVerified] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [credentialOpen, setCredentialOpen] = useState(false);
  const [credentialIndex, setCredentialIndex] = useState(0);

  // Refs
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const layersRef = useRef<HTMLDivElement>(null);
  const geometry = useRef<GeometryType>({ x: 0, y: 0, max: 0 });
  const verifiedRef = useRef(false);
  const waveRef = useRef<AnimationPlaybackControls | null>(null);
  const targetsRef = useRef(new Set<WaveTargetType>());
  const paintedRef = useRef("");

  // Hooks
  const progress = useMotionValue(0);

  // Writes the wave's centre and edge into the mask on the grayscale layer; no React render per frame
  const paint = useCallback(
    (value: number) => {
      const layers = layersRef.current;

      if (!layers) return;

      const { x, y, max } = geometry.current;

      // Nothing changed since the last write (rest, or a repeated measure): skip the style writes
      const key = `${value}|${x}|${y}|${max}`;

      if (key === paintedRef.current && layers.dataset.state) return;

      paintedRef.current = key;
      const radius = value * max;

      layers.style.setProperty("--cv-wx", `${x}px`);
      layers.style.setProperty("--cv-wy", `${y}px`);
      layers.style.setProperty("--cv-r0", `${Math.max(0, radius - WAVE.feather)}px`);
      layers.style.setProperty("--cv-r1", `${radius}px`);
      layers.style.setProperty("--cv-band-o", `${Math.sin(Math.min(1, value) * Math.PI)}`);

      // Fully coloured: drop the backdrop filter so the page renders untouched and crisp
      layers.dataset.state = value >= 1 ? "clear" : value <= 0 ? "mono" : "moving";
    },
    [WAVE.feather],
  );

  // Read every target before painting the mask. Share the root bounds, but keep target measurements live:
  // an early click can overlap the entrance animation, and cards can move while the wave is reversing.
  const updateWave = useCallback(
    (value: number, measuredRoot?: DOMRect) => {
      const root = rootRef.current;
      const moving = value > 0 && value < 1;
      const { x, y, max } = geometry.current;
      const updates: { target: WaveTargetType; reached: boolean }[] = [];

      // At rest the cached centres are dropped, so the next wave reads where the cards are then, once, in one batch
      if (!moving) targetsRef.current.forEach((target) => (target.centre = undefined));

      let rootBox = measuredRoot ?? null;

      targetsRef.current.forEach((target) => {
        const el = target.ref.current;

        if (!el || !root) return;

        let reached = value >= 1;

        if (moving) {
          if (!target.centre || measuredRoot) {
            rootBox ??= root.getBoundingClientRect();

            const box = el.getBoundingClientRect();

            target.centre = {
              x: box.left + box.width / 2 - rootBox.left,
              y: box.top + box.height / 2 - rootBox.top,
            };
          }

          const distance = Math.hypot(target.centre.x - x, target.centre.y - y);

          // Half the feathered edge past the centre is where the element visibly has its colour back.
          reached = value * max - WAVE.feather / 2 >= distance;
        }

        if (reached !== target.reached) updates.push({ target, reached });
      });

      paint(value);
      updates.forEach(({ target, reached }) => {
        target.reached = reached;
        target.notify(reached);
      });
    },
    [paint, WAVE.feather],
  );

  const subscribeReach = useCallback(
    (ref: RefObject<HTMLElement | null>, notify: (reached: boolean) => void) => {
      const target: WaveTargetType = { ref, notify };

      targetsRef.current.add(target);
      updateWave(progress.get());

      return () => {
        targetsRef.current.delete(target);
      };
    },
    [progress, updateWave],
  );

  // The toggle's centre in the hero's own coordinates, so the origin is right at every size and scroll position
  const measure = useCallback(() => {
    const root = rootRef.current;
    const toggleEl = toggleRef.current;

    if (!root || !toggleEl) return;

    const rootBox = root.getBoundingClientRect();
    const box = toggleEl.getBoundingClientRect();
    const x = box.left + box.width / 2 - rootBox.left;
    const y = box.top + box.height / 2 - rootBox.top;

    const farthest = Math.max(
      Math.hypot(x, y),
      Math.hypot(rootBox.width - x, y),
      Math.hypot(x, rootBox.height - y),
      Math.hypot(rootBox.width - x, rootBox.height - y),
    );

    geometry.current = { x, y, max: farthest + WAVE.feather };
    updateWave(progress.get(), rootBox);
  }, [updateWave, progress, WAVE.feather]);

  useMotionValueEvent(progress, "change", updateWave);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) return;

    const observer = new ResizeObserver(measure);

    observer.observe(root);
    document.fonts?.ready.then(measure);

    return () => observer.disconnect();
  }, [measure]);

  // Sends the wave to fully on or off from wherever it is now, so a click, a reversal or a dropped drag all land the same way
  const settle = useCallback(
    (next: boolean) => {
      const reduceMotion = REDUCE;

      verifiedRef.current = next;
      setVerified(next);
      setInteracted(true);
      measure();
      waveRef.current?.stop();

      if (reduceMotion) {
        progress.set(next ? 1 : 0);

        return;
      }

      // A reversal mid-wave only travels the distance left, so it never jumps or waits
      const distance = Math.abs((next ? 1 : 0) - progress.get());
      const duration =
        (next ? WAVE.expandDuration : WAVE.contractDuration) * Math.max(0.3, distance);

      waveRef.current = animate(progress, next ? 1 : 0, {
        duration,
        delay: next && progress.get() === 0 ? WAVE.expandDelay : 0,
        ease: next ? [0.33, 0.05, 0.25, 1] : [0.55, 0, 0.3, 1],
      });
    },
    [measure, progress, WAVE, REDUCE],
  );

  const toggle = useCallback(() => settle(!verifiedRef.current), [settle]);

  const scrub = useCallback(
    (value: number) => {
      waveRef.current?.stop();
      setInteracted(true);
      progress.set(Math.min(1, Math.max(0, value)));
    },
    [progress],
  );

  const value = useMemo(
    () => ({
      verified,
      interacted,
      credentialOpen,
      setCredentialOpen,
      credentialIndex,
      setCredentialIndex,
      toggle,
      scrub,
      release: settle,
      progress,
      rootRef,
      toggleRef,
      layersRef,
      geometry,
      subscribeReach,
    }),
    [
      verified,
      interacted,
      credentialOpen,
      credentialIndex,
      toggle,
      scrub,
      settle,
      progress,
      subscribeReach,
    ],
  );

  return <VerificationContext.Provider value={value}>{children}</VerificationContext.Provider>;
};

const useVerification = () => {
  const context = useContext(VerificationContext);

  if (!context) throw new Error("useVerification must be used inside VerificationProvider");

  return context;
};

// True once the colour wave's front has passed the centre of `ref`, false again once it pulls back past it
const useWaveReach = (ref: RefObject<HTMLElement | null>) => {
  // States
  const [reached, setReached] = useState(false);

  // Hooks
  const { subscribeReach } = useVerification();

  useEffect(() => subscribeReach(ref, setReached), [ref, subscribeReach]);

  return reached;
};

/* ---- kinetic-text ---- */
/**
 * A headline word whose letters get a little bolder as a mouse pointer nears them and ease back after. Each letter's
 * width is locked to its normal advance first, so the heavier weight grows inside its own slot and nothing moves.
 * Off on touch screens and with reduced motion, where it would only cost layout work
 */
const KineticText = ({ text }: { text: string }) => {
  const { REDUCE } = useConfig();

  // Refs
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    if (!root || !finePointer.matches || REDUCE) return;

    const chars = [...root.querySelectorAll<HTMLSpanElement>(".cv-char")];
    let centres: number[][] = [];
    let frame = 0;

    // The pointer's reach follows the font size, read when the layout changes rather than on every move
    let radius = 0;

    const readRadius = () => {
      radius = parseFloat(getComputedStyle(root).fontSize) * 1.15;
    };

    // Measured while the letters flow normally (kerning intact), then frozen as fixed-width boxes
    const lock = () => {
      root.dataset.locked = "false";
      chars.forEach((char) => (char.style.width = ""));

      const widths = chars.map((char) => char.getBoundingClientRect().width);

      chars.forEach((char, index) => (char.style.width = `${widths[index]}px`));
      root.dataset.locked = "true";
      readRadius();
    };

    const measure = () => {
      centres = chars.map((char) => {
        const box = char.getBoundingClientRect();

        return [box.left + box.width / 2, box.top + box.height / 2];
      });
    };

    const handleMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!centres.length) measure();

        chars.forEach((char, index) => {
          const [x, y] = centres[index];
          const distance = Math.hypot(event.clientX - x, (event.clientY - y) * 0.6);
          const reach = Math.max(0, 1 - distance / radius);

          char.style.fontWeight = `${Math.round(700 + 100 * reach * reach)}`;
        });
      });
    };

    const handleLeave = () => {
      cancelAnimationFrame(frame);
      centres = [];
      chars.forEach((char) => (char.style.fontWeight = ""));
    };

    const observer = new ResizeObserver(() => {
      centres = [];
      lock();
    });

    readRadius();
    document.fonts.ready.then(lock);
    observer.observe(root.parentElement ?? root);
    root.addEventListener("pointerenter", measure);
    root.addEventListener("pointermove", handleMove);
    root.addEventListener("pointerleave", handleLeave);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      root.removeEventListener("pointerenter", measure);
      root.removeEventListener("pointermove", handleMove);
      root.removeEventListener("pointerleave", handleLeave);
    };
  }, [REDUCE]);

  return (
    <span ref={rootRef} className="cv-kinetic">
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {/* crocwork: graphemes, not code points, so Thai marks stay on their letter */}
        {Array.from(
          new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
          (s) => s.segment,
        ).map((char, index) => (
          <span key={`${char}-${index}`} className="cv-char">
            {char === " " ? " " : char}
          </span>
        ))}
      </span>
    </span>
  );
};

/* ---- verify-toggle ---- */
// How far the knob travels, in em of the switch; matches --cv-knob-x when on
const KNOB_TRAVEL = 0.91;

type DragType = { x: number; from: number; moved: boolean; id: number };

/**
 * The switch that stands in for the "o" of "official". Click it, press V, or grab the knob and drag: the colour
 * wave follows the knob by hand and, let go, settles on or off by whichever side it is nearer. Until the first
 * interaction a hint points at it; left alone for a few seconds it switches itself on
 */
const VerifyToggle = () => {
  const { AUTOPLAY, ENTRANCE, TOGGLE, REDUCE } = useConfig();

  // Refs
  const dragRef = useRef<DragType | null>(null);
  const dragEndedRef = useRef(false);

  // Hooks
  const { verified, interacted, toggle, toggleRef, scrub, release, progress } = useVerification();

  // Left alone, it verifies itself once; touching it first (click, drag or V) cancels the wait
  useEffect(() => {
    if (interacted || !AUTOPLAY.verifyAfter || REDUCE) return;

    const timer = window.setTimeout(toggle, AUTOPLAY.verifyAfter * 1000);

    return () => window.clearTimeout(timer);
  }, [interacted, toggle, AUTOPLAY.verifyAfter, REDUCE]);

  // V anywhere on the page verifies, unless the visitor is typing or using a shortcut of their own
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      if (
        event.key.toLowerCase() !== "v" ||
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;

      toggle();
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [toggle]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;

    dragRef.current = { x: event.clientX, from: progress.get(), moved: false, id: event.pointerId };
  };

  // Past a few px it becomes a drag: the knob follows the pointer and the wave follows the knob
  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const button = event.currentTarget;

    if (!drag) return;

    const dx = event.clientX - drag.x;

    if (!drag.moved) {
      if (Math.abs(dx) < 5) return;

      drag.moved = true;
      button.setPointerCapture(drag.id);
      button.dataset.dragging = "true";
    }

    const travel = KNOB_TRAVEL * parseFloat(getComputedStyle(button).fontSize);
    const value = Math.min(1, Math.max(0, drag.from + dx / travel));

    button.style.setProperty("--cv-knob-x", `${value * KNOB_TRAVEL}em`);
    scrub(value);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const button = event.currentTarget;

    dragRef.current = null;

    if (!drag?.moved) return;

    dragEndedRef.current = true;
    delete button.dataset.dragging;
    button.style.removeProperty("--cv-knob-x");
    release(progress.get() > 0.5);
  };

  // The click that ends a drag has already been handled by the release
  const handleClick = () => {
    if (dragEndedRef.current) {
      dragEndedRef.current = false;

      return;
    }

    toggle();
  };

  return (
    <motion.span
      className="cv-enter relative inline-block"
      initial={{ opacity: 0, transform: "scale(0.72)" }}
      animate={{ opacity: 1, transform: "scale(1)" }}
      transition={{
        opacity: { duration: 0.25, delay: ENTRANCE.toggle },
        transform: { type: "spring", stiffness: 320, damping: 17, delay: ENTRANCE.toggle },
      }}
    >
      <button
        ref={toggleRef}
        type="button"
        role="switch"
        aria-checked={verified}
        aria-label={TOGGLE.label}
        aria-keyshortcuts="V"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="cv-toggle"
      >
        <span className="cv-toggle-track" />
        <motion.span
          className="cv-toggle-knob"
          initial={false}
          animate={{
            transform: interacted
              ? "translateX(0em)"
              : ["0em", "0em", "0.2em", "0em", "0.09em", "0em"].map(
                  (value) => `translateX(${value})`,
                ),
          }}
          transition={
            interacted
              ? { duration: 0.2 }
              : {
                  duration: 1.3,
                  delay: ENTRANCE.hint + 0.55,
                  times: [0, 0.05, 0.3, 0.55, 0.75, 1],
                  ease: "easeInOut",
                }
          }
        >
          <motion.span
            className="absolute inset-[6%] block"
            animate={
              verified
                ? { transform: ["scale(1)", "scale(1.16)", "scale(1)"] }
                : { transform: "scale(1)" }
            }
            transition={{ duration: 0.42, ease: [0.3, 0, 0.3, 1] }}
          >
            <CredentialSeal className="cv-toggle-seal absolute inset-0 size-full" />
            <motion.span
              className="absolute inset-0 block text-white"
              animate={{ opacity: verified ? 1 : 0.6 }}
              transition={{ duration: 0.25 }}
            >
              <CredentialTick drawn className="size-full" />
            </motion.span>
          </motion.span>
        </motion.span>
      </button>
      <AnimatePresence>
        {!interacted && (
          <motion.span
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.5, delay: ENTRANCE.hint } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            aria-hidden
          >
            <span className="cv-hint text-cv-muted font-medium">
              <span className="cv-hint-pointer">
                {TOGGLE.hint.pointer} <kbd className="cv-hint-key">V</kbd>
              </span>
              <span className="cv-hint-touch">{TOGGLE.hint.touch}</span>
              <CredentialHintArrow delay={ENTRANCE.hint + 0.15} className="cv-hint-arrow" />
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  );
};

/* ---- grid-lines ---- */
type PulseType = { x: number; duration: number; delay: number; tone: string };

// The brand's accent tones, handed out per line
const TONES = ["bg-cv-blue", "bg-cv-violet", "bg-cv-purple", "bg-cv-violet", "bg-cv-orchid"];

// Fixed pseudo-random per line, so the pulses keep their rhythm across resizes instead of reshuffling
const random = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;

  return value - Math.floor(value);
};

/**
 * The panel's hairline grid, a glint on the lines nearest a mouse pointer, and brand-colour segments running down
 * the lines. The glint is eased in a rAF loop that writes styles directly and the segments are CSS animations, so
 * neither re-renders anything while it runs
 */
const GridLines = () => {
  const { ENTRANCE, PULSES, REDUCE } = useConfig();

  // States
  const [lines, setLines] = useState<number[]>([]);
  const [pulses, setPulses] = useState<PulseType[]>([]);

  // Refs
  const gridRef = useRef<HTMLDivElement>(null);
  const glintsRef = useRef<HTMLDivElement>(null);
  const pulsesRef = useRef<HTMLDivElement>(null);
  const geometry = useRef({ lines: [] as number[], step: 116 });

  // Hooks
  const { rootRef } = useVerification();

  // Reads the real line spacing from CSS, so glints and segments sit exactly on the lines at every size
  useEffect(() => {
    const grid = gridRef.current;
    const layer = pulsesRef.current;

    if (!grid || !layer) return;

    const place = () => {
      const step = parseFloat(getComputedStyle(grid).getPropertyValue("--cv-grid-step")) || 116;
      const { width, height } = grid.getBoundingClientRect();
      const centre = width / 2;
      const reach = Math.floor(centre / step);
      const xs: number[] = [];
      const next: PulseType[] = [];

      layer.style.setProperty("--cv-pulse-travel", `${height + PULSES.length}px`);

      for (let i = -reach; i <= reach; i++) {
        const x = centre + i * step;

        if (x < 1 || x > width - 1) continue;

        xs.push(x);

        if (random(i + 50) > PULSES.share) continue;

        next.push({
          x,
          duration: PULSES.minDuration + random(i + 90) * (PULSES.maxDuration - PULSES.minDuration),
          delay: PULSES.startAfter + random(i + 130) * PULSES.maxDuration * 0.7,
          tone: TONES[Math.floor(random(i + 170) * TONES.length)],
        });
      }

      geometry.current = { lines: xs, step };
      setLines(xs);
      setPulses(next);
    };

    const observer = new ResizeObserver(place);

    observer.observe(grid);

    // The segments run only while the hero is on screen in a visible tab
    let isOnScreen = true;

    const sync = () => {
      layer.dataset.paused = String(!isOnScreen || document.hidden);
    };

    const visibility = new IntersectionObserver(([entry]) => {
      isOnScreen = entry.isIntersecting;
      sync();
    });

    visibility.observe(layer);
    document.addEventListener("visibilitychange", sync);

    return () => {
      observer.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  // Pointer response: eases toward the pointer and lights only the nearest lines; mouse only, never reduced motion
  useEffect(() => {
    const layer = glintsRef.current;
    const panel = layer?.parentElement;

    if (!layer || !panel || !rootRef.current) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const state = { tx: 0, ty: 0, x: 0, y: 0, level: 0, target: 0, frame: 0, running: false };

    const tick = () => {
      const { lines: xs, step } = geometry.current;
      const glints = layer.children;

      state.x += (state.tx - state.x) * 0.18;
      state.y += (state.ty - state.y) * 0.18;
      state.level += (state.target - state.level) * 0.12;
      layer.style.setProperty("--cv-gy", `${state.y}px`);

      for (let i = 0; i < glints.length; i++) {
        const glint = glints[i] as HTMLElement;
        const strength = Math.max(0, 1 - Math.abs((xs[i] ?? -9999) - state.x) / (step * 0.85));

        glint.style.opacity = (strength * strength * state.level).toFixed(3);
      }

      const settled =
        Math.abs(state.tx - state.x) < 0.5 && Math.abs(state.target - state.level) < 0.01;

      if (settled) {
        state.running = false;

        return;
      }

      state.frame = requestAnimationFrame(tick);
    };

    const run = () => {
      if (state.running) return;

      state.running = true;
      state.frame = requestAnimationFrame(tick);
    };

    const handleMove = (event: PointerEvent) => {
      if (!finePointer.matches || REDUCE) return;

      const box = panel.getBoundingClientRect();

      state.tx = event.clientX - box.left;
      state.ty = event.clientY - box.top;

      // Arriving from outside: start at the pointer rather than sliding in from wherever it last was
      if (state.level < 0.02) {
        state.x = state.tx;
        state.y = state.ty;
      }

      state.target = 1;
      run();
    };

    const handleLeave = () => {
      state.target = 0;
      run();
    };

    panel.addEventListener("pointermove", handleMove, { passive: true });
    panel.addEventListener("pointerleave", handleLeave);

    return () => {
      cancelAnimationFrame(state.frame);
      panel.removeEventListener("pointermove", handleMove);
      panel.removeEventListener("pointerleave", handleLeave);
    };
  }, [rootRef, REDUCE]);

  return (
    <>
      <motion.div
        ref={gridRef}
        className="cv-grid cv-enter"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: ENTRANCE.grid, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
      />
      <div ref={glintsRef} className="cv-glints" aria-hidden>
        {lines.map((x) => (
          <span key={x} className="cv-glint" style={{ left: x }} />
        ))}
      </div>
      <div ref={pulsesRef} className="cv-pulses" aria-hidden>
        {pulses.map((pulse) => (
          <span
            key={pulse.x}
            className={cn("cv-pulse", pulse.tone)}
            style={
              {
                left: pulse.x,
                height: PULSES.length,
                opacity: PULSES.opacity,
                "--cv-pulse-duration": `${pulse.duration.toFixed(2)}s`,
                "--cv-pulse-delay": `${pulse.delay.toFixed(2)}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
};

/* ---- wave-overlay ---- */
// The grayscale layer and the lavender band at the wave's front; the provider writes their geometry every frame
const WaveOverlay = () => {
  const { WAVE } = useConfig();

  // Hooks
  const { layersRef } = useVerification();

  // Vars
  const style = { "--cv-band-strength": WAVE.bandStrength } as CSSProperties;

  return (
    <div ref={layersRef} className="cv-wave" data-state="mono" style={style} aria-hidden>
      <div className="cv-wave-gray" />
      <div className="cv-wave-band" />
    </div>
  );
};

/* ---- stats-card ---- */
const format = (value: number) => Math.round(value).toLocaleString("en-US");

const StatsCard = () => {
  const { ENTRANCE, FLOAT, STATS, REDUCE } = useConfig();

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);

  // Hooks
  const reached = useWaveReach(cardRef);

  // Vars
  const position = { "--x": FLOAT.stats.x, "--y": FLOAT.stats.y } as CSSProperties;
  const word = reached ? STATS.states.on : STATS.states.off;

  // The figure counts up once as the card arrives; the server renders the final number
  useEffect(() => {
    const el = numberRef.current;

    if (!el || REDUCE) return;

    el.textContent = format(0);

    const controls = animate(0, STATS.value, {
      duration: 1.5,
      delay: ENTRANCE.sideCards + 0.15,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => {
        el.textContent = format(value);
      },
    });

    return () => controls.stop();
  }, [REDUCE, STATS.value, ENTRANCE.sideCards]);

  return (
    <motion.div
      className="cv-float cv-enter"
      style={position}
      initial={{ opacity: 0, transform: "translateX(-20px)" }}
      animate={{ opacity: 1, transform: "translateX(0px)" }}
      transition={{ duration: 0.6, delay: ENTRANCE.sideCards, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        ref={cardRef}
        data-active={reached}
        className="cv-stats-card flex items-start gap-[0.95em] rounded-[1.15em] border border-black/[0.035] bg-white py-[0.95em] pr-[1.4em] pl-[0.95em]"
      >
        <span className="bg-cv-lavender text-cv-violet grid size-[2.75em] shrink-0 place-items-center rounded-[0.8em]">
          <CredentialChartBars active={reached} className="size-[1.45em]" />
        </span>
        <span className="flex flex-col text-left">
          <span className="text-cv-body flex gap-[0.28em] text-[0.82em] leading-[1.35] font-medium">
            {STATS.word}
            <span className="relative inline-flex overflow-hidden">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={word}
                  className="block"
                  initial={{ transform: "translateY(105%)" }}
                  animate={{ transform: "translateY(0%)" }}
                  exit={{ transform: "translateY(-105%)" }}
                  transition={{ duration: 0.42, ease: [0.65, 0, 0.35, 1] }}
                >
                  {word}
                </motion.span>
              </AnimatePresence>
            </span>
          </span>
          <span className="text-[1.2em] leading-[1.3] font-semibold tracking-[-0.01em] tabular-nums">
            <span ref={numberRef}>{format(STATS.value)}</span>
            {STATS.suffix}
          </span>
          <span className="cv-stats-note">
            <span className="overflow-hidden">
              <span className="text-cv-muted block pt-[0.3em] text-[0.72em] leading-[1.3]">
                {STATS.note}
              </span>
            </span>
          </span>
        </span>
      </div>
    </motion.div>
  );
};

/* ---- certificate-card ---- */
type CredentialType = ProvablyCredential;

const ICONS = { pen: PenToolIcon, chart: ChartColumnIcon, type: TypeIcon };

const SHADOWS = {
  rest: "0 18px 36px -22px rgba(70, 60, 200, 0.32), 0 2px 6px rgba(20, 21, 31, 0.04)",
  verified: "0 26px 46px -22px rgba(70, 60, 200, 0.45), 0 2px 6px rgba(20, 21, 31, 0.05)",
  hover: "0 34px 54px -22px rgba(70, 60, 200, 0.5), 0 2px 6px rgba(20, 21, 31, 0.05)",
  back: "0 10px 24px -18px rgba(70, 60, 200, 0.35), 0 1px 3px rgba(20, 21, 31, 0.04)",
};

const SPRING = { type: "spring" as const, stiffness: 170, damping: 19 };

// One certificate's printed face, in its own accent colour with its discipline icon
const CertificateFace = ({
  credential,
  reached,
  lifted,
  stampDelay,
}: {
  credential: CredentialType;
  reached: boolean;
  lifted: boolean;
  stampDelay: number;
}) => {
  const { CERTIFICATE } = useConfig();

  // Vars
  const Icon = ICONS[credential.icon];
  const tint = `color-mix(in srgb, ${credential.accent} 13%, white)`;

  return (
    <>
      {/* A soft wash of the certificate's colour in its corner, and a fine inner frame like a printed border */}
      <span
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background: `radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, ${credential.accent} 16%, transparent), transparent 62%)`,
        }}
      />
      <span
        className="pointer-events-none absolute inset-[0.4em] rounded-[0.8em] border"
        style={{ borderColor: `color-mix(in srgb, ${credential.accent} 16%, transparent)` }}
      />
      <span className="relative flex w-full items-center justify-between">
        <span className="flex items-center gap-[0.45em]">
          <span
            className="grid size-[1.65em] place-items-center rounded-[0.5em]"
            style={{ background: tint, color: credential.accent }}
          >
            <Icon className="size-[0.95em]" strokeWidth={2.2} aria-hidden />
          </span>
          <span className="text-cv-muted text-[0.62em] font-semibold tracking-[0.24em] uppercase">
            {CERTIFICATE.kicker}
          </span>
        </span>
        <AnimatePresence>
          {reached && (
            <motion.span
              className="rounded-full px-[0.6em] py-[0.15em] text-[0.64em] font-semibold"
              style={{ background: tint, color: credential.accent }}
              initial={{ opacity: 0, transform: "translateY(4px)" }}
              animate={{
                opacity: 1,
                transform: "translateY(0px)",
                transition: { delay: stampDelay + 0.25, duration: 0.3 },
              }}
              exit={{ opacity: 0, transform: "translateY(4px)", transition: { duration: 0.15 } }}
            >
              {CERTIFICATE.status.on}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="relative mt-[0.5em] text-[1.02em] leading-tight font-semibold tracking-[-0.01em]">
        {credential.title}
      </span>
      <span className="text-cv-muted relative mt-[0.3em] text-[0.62em] leading-none">
        {CERTIFICATE.recipientLabel}{" "}
        <span className="text-cv-body font-semibold">{credential.recipient}</span>
      </span>
      <span className="relative mt-auto flex w-full items-end justify-between">
        {/* At rest two of its skills; on hover they give way to the inspect prompt in the same spot */}
        <span className="relative grid">
          <motion.span
            className="col-start-1 row-start-1 flex gap-[0.3em]"
            initial={false}
            animate={{ opacity: lifted ? 0 : 1, transform: `translateY(${lifted ? -4 : 0}px)` }}
            transition={{ duration: 0.22 }}
          >
            {credential.skills.slice(0, 2).map((skill) => (
              <span
                key={skill}
                className="text-cv-body rounded-full border border-black/[0.08] bg-white/70 px-[0.55em] py-[0.25em] text-[0.56em] font-medium whitespace-nowrap"
              >
                {skill}
              </span>
            ))}
          </motion.span>
          <motion.span
            className="col-start-1 row-start-1 flex items-center gap-[0.3em] self-center text-[0.66em] font-semibold whitespace-nowrap"
            style={{ color: credential.accent }}
            initial={false}
            animate={{ opacity: lifted ? 1 : 0, transform: `translateY(${lifted ? 0 : 4}px)` }}
            transition={{ duration: 0.22 }}
          >
            {CERTIFICATE.hover}
            <ArrowRightIcon className="size-[1.1em]" strokeWidth={2.4} aria-hidden />
          </motion.span>
        </span>
        <span className="relative -mr-[0.15em] -mb-[0.15em] block size-[2.2em]">
          {/* Unverified: an empty dashed ring where the seal will land */}
          <motion.span
            className="absolute inset-[8%] rounded-full border-[1.5px] border-dashed border-[#cfd0da]"
            initial={false}
            animate={{ opacity: reached ? 0 : 1, transform: `scale(${reached ? 0.8 : 1})` }}
            transition={{ duration: 0.25, delay: reached ? stampDelay : 0 }}
          />
          {/* Stamped in the certificate's own colour: drops from above, overshoots flat and springs back */}
          <motion.span
            className="absolute inset-0 block"
            style={{ color: credential.accent }}
            initial={false}
            animate={
              reached
                ? { opacity: 1, transform: "scale(1) rotate(0deg)" }
                : { opacity: 0, transform: "scale(1.6) rotate(-28deg)" }
            }
            transition={
              reached
                ? {
                    type: "spring",
                    stiffness: 420,
                    damping: 20,
                    delay: stampDelay,
                    opacity: { duration: 0.12, delay: stampDelay },
                  }
                : { duration: 0.22, ease: [0.4, 0, 1, 1] }
            }
          >
            <CredentialSeal className="absolute inset-0 size-full drop-shadow-[0_4px_8px_rgb(70_60_200/0.3)]" />
            <CredentialTick
              drawn={reached}
              delay={stampDelay + 0.18}
              className="absolute inset-0 size-full text-white"
            />
          </motion.span>
        </span>
      </span>
    </>
  );
};

type StackCardProps = {
  credential: CredentialType;
  isTop: boolean;
  reached: boolean;
  lifted: boolean;
  stampDelay: number;
  target: TargetAndTransition;
  transition: Transition;
  shadow: string;
  layoutId?: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  draggedRef: RefObject<boolean>;
  onOpen: () => void;
  onHover: (hovered: boolean) => void;
  onThrow: (direction: 1 | -1) => void;
  onKey: (event: ReactKeyboardEvent<HTMLButtonElement>) => void;
  onLanded: () => void;
};

/**
 * One card of the stack. It keeps its own drag position, and leans the way it is dragged, so a throw reads as a
 * physical card leaving the hand; released past the threshold it flies on from exactly where it was let go
 */
const StackCard = ({
  credential,
  isTop,
  reached,
  lifted,
  stampDelay,
  target,
  transition,
  shadow,
  layoutId,
  triggerRef,
  draggedRef,
  onOpen,
  onHover,
  onThrow,
  onKey,
  onLanded,
}: StackCardProps) => {
  const { CERTIFICATE } = useConfig();

  // Hooks
  const x = useMotionValue(0);
  const lean = useTransform(x, [-240, 0, 240], [-10, 0, 10]);

  return (
    <motion.button
      ref={isTop ? triggerRef : undefined}
      layoutId={layoutId}
      type="button"
      inert={!isTop}
      tabIndex={isTop ? 0 : -1}
      aria-hidden={!isTop}
      aria-haspopup="dialog"
      aria-keyshortcuts="ArrowLeft ArrowRight"
      aria-label={`${credential.title}, ${CERTIFICATE.sampleLabel.toLowerCase()}: ${CERTIFICATE.hover.toLowerCase()}. Drag or use the arrow keys for other certificates`}
      onClick={onOpen}
      onKeyDown={onKey}
      onHoverStart={() => isTop && onHover(true)}
      onHoverEnd={() => onHover(false)}
      onFocus={(event) => onHover(event.currentTarget.matches(":focus-visible"))}
      onBlur={() => onHover(false)}
      drag={isTop ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.5}
      dragMomentum={false}
      onDragStart={() => {
        draggedRef.current = true;
        onHover(false);
      }}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 70 || Math.abs(info.velocity.x) > 500) {
          onThrow(info.offset.x + info.velocity.x * 0.1 > 0 ? 1 : -1);
        }

        // The click that ends a drag (if one fires) lands before this, so only that click is ignored
        setTimeout(() => (draggedRef.current = false), 0);
      }}
      className={cn(
        "cv-cert absolute inset-0 flex flex-col items-start overflow-hidden bg-white p-[1.15em] text-left",
        isTop && "cursor-grab active:cursor-grabbing",
      )}
      style={{ x, rotateZ: lean, borderRadius: 17, touchAction: "pan-y" }}
      initial={false}
      animate={{ ...target, boxShadow: shadow }}
      transition={{ ...transition, boxShadow: { duration: 0.35 } }}
      onAnimationComplete={onLanded}
    >
      {/* The edge trace follows verification only, so it plays on switch-on and never replays on a flip */}
      <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
        <motion.rect
          x="0.75"
          y="0.75"
          rx="16.5"
          fill="none"
          strokeWidth="1.5"
          style={{
            stroke: credential.accent,
            width: "calc(100% - 1.5px)",
            height: "calc(100% - 1.5px)",
          }}
          initial={false}
          animate={{ pathLength: reached ? 1 : 0, opacity: reached ? 0 : 1 }}
          transition={
            reached
              ? {
                  pathLength: { duration: 0.8, ease: [0.65, 0, 0.35, 1] },
                  opacity: { duration: 0.4, delay: 0.85 },
                }
              : { duration: 0 }
          }
        />
      </svg>
      <CertificateFace
        credential={credential}
        reached={reached}
        lifted={lifted}
        stampDelay={stampDelay}
      />
    </motion.button>
  );
};

/**
 * A stack of sample certificates. The top one is thrown aside by dragging (or the arrow keys, or on its own every
 * few seconds while left alone) and tucks in at the back while the next comes forward. All are stamped when the colour wave arrives; clicking the top card opens it
 * for inspection by morphing in place
 */
const CertificateCard = () => {
  const { AUTOPLAY, CERTIFICATE, CREDENTIALS, ENTRANCE, FLOAT, REDUCE } = useConfig();
  const COUNT = CREDENTIALS.length;

  /**
   * Where a card sits by its place in the stack, in px from the card's em size (so a drag, which works in px, can hand
   * over to it mid-flight): each card further back steps down-left, turns more and shrinks a little
   */
  const stackPose = (place: number, tilt: number, unit: number) => ({
    x: -0.75 * unit * place,
    y: 0.6 * unit * place,
    rotate: tilt + 4 * place,
    scale: 1 - 0.035 * place,
    zIndex: COUNT - place,
  });

  // States
  const [hovered, setHovered] = useState(false);
  const [flip, setFlip] = useState<{ card: number; direction: 1 | -1 } | null>(null);
  const [unit, setUnit] = useState(16);

  // Refs
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const draggedRef = useRef(false);
  const stoppedRef = useRef(false);
  const liveRef = useRef({ hovered: false, open: false, advance: () => {} });

  // Hooks
  const { credentialOpen, setCredentialOpen, credentialIndex, setCredentialIndex } =
    useVerification();
  const reached = useWaveReach(wrapRef);
  const isMobile = useMediaQuery("(max-width: 639.98px)");

  // Vars
  const position = { "--x": FLOAT.certificate.x, "--y": FLOAT.certificate.y } as CSSProperties;
  const lifted = hovered && !credentialOpen;
  const tilt = reached ? CERTIFICATE.tilt.verified : CERTIFICATE.tilt.rest;

  // The top card straightens for its stamp on verification, then settles; null starts from wherever it is
  const topPose = useMemo(() => {
    if (lifted) return { ...stackPose(0, CERTIFICATE.tilt.hover, unit), y: -0.5 * unit };

    if (reached)
      return { ...stackPose(0, 0, unit), rotate: [null, 0, 0, CERTIFICATE.tilt.verified] };

    return stackPose(0, CERTIFICATE.tilt.rest, unit);
  }, [lifted, reached, unit]);

  // The stack is laid out in px from the card's em size, so it follows the card when the hero resizes
  useEffect(() => {
    const wrap = wrapRef.current;

    if (!wrap) return;

    const observer = new ResizeObserver(() =>
      setUnit(parseFloat(getComputedStyle(wrap).fontSize) || 16),
    );

    observer.observe(wrap);

    return () => observer.disconnect();
  }, []);

  /**
   * Autoplay: the top card is thrown to the back every few seconds. Any pause (hover, focus, an open view, a drag,
   * off screen, hidden tab) restarts the countdown, so a card never leaves the moment the visitor lets go of it
   */
  useEffect(() => {
    const wrap = wrapRef.current;

    if (!wrap || !AUTOPLAY.cycleAfter || REDUCE) return;

    const every = AUTOPLAY.cycleEvery * 1000;
    let visible = true;
    let next = performance.now() + AUTOPLAY.cycleAfter * 1000;

    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));

    const tick = window.setInterval(() => {
      const { hovered: isHovered, open, advance } = liveRef.current;
      const now = performance.now();

      if (stoppedRef.current) return;

      if (
        isHovered ||
        open ||
        draggedRef.current ||
        !visible ||
        document.hidden ||
        wrap.contains(document.activeElement)
      ) {
        next = Math.max(next, now + every);

        return;
      }

      if (now < next) return;

      advance();
      next = now + every;
    }, 200);

    observer.observe(wrap);

    return () => {
      window.clearInterval(tick);
      observer.disconnect();
    };
  }, [AUTOPLAY.cycleAfter, AUTOPLAY.cycleEvery, REDUCE]);

  // Focus goes back to the certificate when the inspection view closes
  useEffect(() => {
    if (wasOpen.current && !credentialOpen) {
      requestAnimationFrame(() => triggerRef.current?.focus());
    }

    wasOpen.current = credentialOpen;
  }, [credentialOpen]);

  // Forward throws the top card off to the back; backward pulls the last card round to the front
  const cycle = (step: 1 | -1, direction: 1 | -1 = step) => {
    const leaving = credentialIndex;

    setHovered(false);
    setCredentialIndex((credentialIndex + step + COUNT) % COUNT);
    setFlip({ card: step === 1 ? leaving : (credentialIndex - 1 + COUNT) % COUNT, direction });
  };

  // The autoplay timer reads these each tick, so it never acts on a stale card or a stale hover
  useEffect(() => {
    liveRef.current = { hovered, open: credentialOpen, advance: () => cycle(1) };
  });

  const handleKey = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

    event.preventDefault();
    stoppedRef.current = true;
    cycle(event.key === "ArrowRight" ? 1 : -1);
  };

  // Once the throw has landed the card is an ordinary stack card again, so later state changes don't replay it
  const handleLanded = (index: number) => {
    if (flip?.card === index) setFlip(null);
  };

  const handleOpen = () => {
    if (draggedRef.current) return;

    stoppedRef.current = true;
    setHovered(false);
    setCredentialOpen(true);
  };

  if (COUNT === 0) return null;

  return (
    <motion.div
      className="cv-float cv-enter"
      style={position}
      initial={{ opacity: 0, transform: "translateX(20px)" }}
      animate={{ opacity: 1, transform: "translateX(0px)" }}
      transition={{ duration: 0.6, delay: ENTRANCE.sideCards + 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <div ref={wrapRef} className="cv-cert-wrap relative h-[8.9em] w-[15em]">
        {CREDENTIALS.map((credential, index) => {
          const place = (index - credentialIndex + COUNT) % COUNT;
          const isTop = place === 0;
          const flying = flip?.card === index;
          const back = stackPose(COUNT - 1, tilt, unit);

          // While open on a wider screen the top card has become the inspection view
          if (isTop && credentialOpen && !isMobile) return null;

          // Thrown: flies on from where it was let go, arcs over the others and tucks in at the back
          const target =
            flip && flying && !isTop
              ? {
                  x: [null, 10 * unit * flip.direction, back.x],
                  y: [null, -1.4 * unit, back.y],
                  rotate: [null, tilt + 16 * flip.direction, back.rotate],
                  scale: [null, 1.02, back.scale],
                  zIndex: [COUNT + 1, COUNT + 1, 1],
                }
              : flying && isTop
                ? {
                    x: [back.x, -10 * unit, 0],
                    y: [back.y, -1.4 * unit, 0],
                    rotate: [back.rotate, tilt - 14, tilt],
                    scale: [back.scale, 1.02, 1],
                    zIndex: [COUNT + 1, COUNT + 1, COUNT],
                  }
                : isTop
                  ? topPose
                  : stackPose(place, tilt, unit);

          const transition = flying
            ? { duration: 0.5, times: [0, 0.4, 1], ease: [0.33, 0, 0.2, 1] as const }
            : isTop && reached && !lifted
              ? {
                  rotate: { duration: 1.25, times: [0, 0.28, 0.62, 1], ease: "easeInOut" as const },
                  default: SPRING,
                }
              : SPRING;

          return (
            <StackCard
              key={credential.title}
              credential={credential}
              isTop={isTop}
              reached={reached}
              lifted={isTop && lifted}
              stampDelay={0.32 + place * 0.14}
              target={target as TargetAndTransition}
              transition={transition}
              shadow={
                !isTop
                  ? SHADOWS.back
                  : lifted
                    ? SHADOWS.hover
                    : reached
                      ? SHADOWS.verified
                      : SHADOWS.rest
              }
              layoutId={isTop && !isMobile ? "cv-credential" : undefined}
              triggerRef={triggerRef}
              draggedRef={draggedRef}
              onOpen={handleOpen}
              onHover={setHovered}
              onThrow={(direction) => {
                stoppedRef.current = true;
                cycle(1, direction);
              }}
              onKey={handleKey}
              onLanded={() => handleLanded(index)}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

/* ---- credential-dialog ---- */
/**
 * The certificate opened for inspection. On wider screens it is the same element as the floating card, grown into
 * place (shared layoutId); on phones it rises as a sheet. Its status always follows the one verification state
 */
const CredentialDialog = () => {
  const { CERTIFICATE, CREDENTIALS } = useConfig();

  // States
  const [copied, setCopied] = useState(false);

  // Refs
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Hooks
  const { credentialOpen, setCredentialOpen, credentialIndex, verified, toggle } =
    useVerification();
  const isMobile = useMediaQuery("(max-width: 639.98px)");

  // Vars
  const status = verified ? CERTIFICATE.status.on : CERTIFICATE.status.off;
  const credential = CREDENTIALS[credentialIndex];

  useEffect(() => {
    if (!credentialOpen) return;

    closeRef.current?.focus({ preventScroll: true });

    // Escape closes; Tab cycles inside the view so focus can't wander behind the scrim
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCredentialOpen(false);

        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>("button, a[href]");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [credentialOpen, setCredentialOpen]);

  // Copies a link to this sample (this page plus the certificate's name), then confirms in place for a moment
  const handleShare = async () => {
    const slug = credential.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${window.location.pathname}#credential-${slug}`,
      );
    } catch {
      return;
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleClose = () => {
    setCredentialOpen(false);
  };

  if (!credential) return null;

  return (
    <AnimatePresence>
      {credentialOpen && (
        <div
          className={cn(
            "cv-dialog fixed inset-0 z-40 grid p-4",
            isMobile ? "items-end justify-stretch p-0" : "place-items-center",
          )}
        >
          <motion.div
            className="absolute inset-0 bg-[#f3f2fb]/75 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClose}
            aria-hidden
          />
          <motion.div
            ref={dialogRef}
            layoutId={isMobile ? undefined : "cv-credential"}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cv-credential-title"
            aria-describedby="cv-credential-note"
            className={cn(
              "relative w-full bg-white p-2",
              isMobile ? "max-h-[88svh] overflow-y-auto" : "max-w-[560px]",
            )}
            style={{ borderRadius: isMobile ? "24px 24px 0 0" : 24 }}
            {...(isMobile
              ? {
                  initial: { y: "100%" },
                  animate: { y: 0, boxShadow: "0 -20px 60px -30px rgba(70, 60, 200, 0.45)" },
                  exit: { y: "100%" },
                  transition: { type: "spring", stiffness: 320, damping: 34 },
                }
              : {
                  initial: { rotate: CERTIFICATE.tilt.hover },
                  animate: { rotate: 0, boxShadow: "0 40px 80px -30px rgba(70, 60, 200, 0.45)" },
                  transition: { type: "spring", stiffness: 200, damping: 26 },
                })}
          >
            <motion.div
              className="rounded-[18px] border border-[rgb(90_79_240/0.16)] p-5 sm:p-7"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: isMobile ? 0.1 : 0.18, duration: 0.25 } }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-cv-muted text-[11px] font-semibold tracking-[0.24em] uppercase">
                    {CERTIFICATE.type}
                  </p>
                  <h2
                    id="cv-credential-title"
                    className="mt-2 text-[28px] leading-none font-semibold tracking-[-0.025em] sm:text-[32px]"
                  >
                    {credential.title}
                  </h2>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={handleClose}
                  aria-label="Close credential"
                  className="text-cv-body hover:text-cv-ink focus-visible:outline-cv-ink -mt-1.5 -mr-1.5 grid size-10 shrink-0 place-items-center rounded-full transition-colors hover:bg-black/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <XIcon className="size-[18px]" aria-hidden />
                </button>
              </div>
              <p
                id="cv-credential-note"
                className="bg-cv-lavender/60 text-cv-violet-deep mt-4 inline-flex rounded-full px-3 py-1 text-[12px] font-semibold"
              >
                {CERTIFICATE.sampleLabel} · {CERTIFICATE.demoNote}
              </p>

              <div className="mt-6">
                <p className="text-cv-muted text-[12px] font-medium">
                  {CERTIFICATE.recipientLabel}
                </p>
                <p className="mt-1 text-[18px] font-semibold tracking-[-0.01em]">
                  {credential.recipient}{" "}
                  <span className="text-cv-muted text-[13px] font-medium">
                    ({CERTIFICATE.recipientNote})
                  </span>
                </p>
              </div>

              <div className="mt-5">
                <p className="text-cv-muted text-[12px] font-medium">Skills covered</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {credential.skills.map((skill) => (
                    <li
                      key={skill}
                      className="text-cv-ink rounded-full border border-black/[0.08] px-3 py-1.5 text-[13px] font-medium"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex items-center gap-4 border-t border-black/[0.06] pt-5">
                <span
                  className={cn(
                    "relative block size-12 shrink-0",
                    verified ? "text-cv-violet" : "text-cv-off",
                  )}
                >
                  <motion.span
                    className="absolute inset-0 block"
                    key={verified ? "on" : "off"}
                    initial={
                      verified
                        ? { transform: "scale(1.4) rotate(-20deg)", opacity: 0 }
                        : { opacity: 0.4 }
                    }
                    animate={{ transform: "scale(1) rotate(0deg)", opacity: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 20 }}
                  >
                    <CredentialSeal className="absolute inset-0 size-full" />
                    <CredentialTick
                      drawn={verified}
                      delay={0.15}
                      className="absolute inset-0 size-full text-white"
                    />
                  </motion.span>
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[15px] font-semibold",
                      verified ? "text-cv-violet-deep" : "text-cv-ink",
                    )}
                  >
                    {status}
                  </p>
                  <p className="text-cv-muted mt-0.5 text-[13px] leading-snug">
                    {verified ? CERTIFICATE.statusDetail.on : CERTIFICATE.statusDetail.off}
                  </p>
                </div>
                {/* The same verification state as the headline toggle, reachable while this view covers it */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={verified}
                  aria-label="Verification"
                  onClick={toggle}
                  className={cn(
                    "focus-visible:outline-cv-ink relative h-7 w-12 shrink-0 rounded-full border-[1.5px] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2",
                    verified ? "border-cv-violet bg-cv-lavender" : "border-cv-off bg-[#f3f3f7]",
                  )}
                >
                  <motion.span
                    className={cn(
                      "absolute top-1/2 left-[3px] block size-5 -translate-y-1/2 rounded-full shadow-[0_1px_3px_rgb(20_21_31/0.2)]",
                      verified ? "bg-cv-violet" : "bg-white",
                    )}
                    initial={false}
                    animate={{ transform: `translateX(${verified ? 19 : 0}px)` }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
              <button
                type="button"
                onClick={handleShare}
                disabled={!verified}
                className={cn(
                  "cv-sweep mt-5 h-11 w-full gap-2 text-[14px] font-semibold",
                  verified
                    ? "cv-outline"
                    : "text-cv-muted cursor-not-allowed border border-dashed border-black/15",
                )}
              >
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={!verified ? "locked" : copied ? "done" : "idle"}
                    className="cv-label inline-flex items-center gap-2"
                    initial={{ opacity: 0, transform: "translateY(8px)" }}
                    animate={{ opacity: 1, transform: "translateY(0px)" }}
                    exit={{ opacity: 0, transform: "translateY(-8px)" }}
                    transition={{ duration: 0.22 }}
                  >
                    {!verified ? (
                      <LockIcon className="size-4" strokeWidth={2.2} aria-hidden />
                    ) : copied ? (
                      <CheckIcon className="size-4" strokeWidth={2.6} aria-hidden />
                    ) : (
                      <LinkIcon className="size-4" strokeWidth={2.2} aria-hidden />
                    )}
                    {!verified
                      ? CERTIFICATE.share.locked
                      : copied
                        ? CERTIFICATE.share.done
                        : CERTIFICATE.share.idle}
                  </motion.span>
                </AnimatePresence>
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* ---- status-badge ---- */
// Where the seal's light rests, in the seal's own 160-unit drawing space: high on the top left
const LIGHT_REST = { x: 34, y: 22 };

const FLIP = { duration: 0.65, ease: [0.65, 0, 0.35, 1] as const };

/**
 * The wax seal in the corner. It reports the state the toggle set (grey and flat until the colour wave presses it
 * into a verified seal) and can be picked up and flipped like a coin to read its reverse. It never verifies anything
 * itself; only the headline toggle does
 */
const StatusBadge = () => {
  const { ENTRANCE, STATUS_BADGE, REDUCE } = useConfig();

  // The stamp's squash on impact as one transform string (scale first, then the tilt) so it runs natively
  const STAMP_REST = `scale(1, 1) rotate(${STATUS_BADGE.stampTilt}deg)`;

  const STAMP_FRAMES = [
    STAMP_REST,
    `scale(1.07, 0.9) rotate(${STATUS_BADGE.stampTilt}deg)`,
    `scale(0.98, 1.03) rotate(${STATUS_BADGE.stampTilt}deg)`,
    STAMP_REST,
  ];

  // States
  const [hovered, setHovered] = useState(false);
  const [flipped, setFlipped] = useState(false);

  // Refs
  const badgeRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const lightRef = useRef<SVGFEPointLightElement>(null);
  const glowRef = useRef<SVGRadialGradientElement>(null);
  const wasFlipped = useRef(false);

  // Hooks
  const reached = useWaveReach(badgeRef);
  const lightX = useSpring(LIGHT_REST.x, { stiffness: 120, damping: 20 });
  const lightY = useSpring(LIGHT_REST.y, { stiffness: 120, damping: 20 });

  // The light and the wax's bright spot move together; the spot travels a little less, so it trails the shine
  useMotionValueEvent(lightX, "change", (value) => {
    lightRef.current?.setAttribute("x", `${value}`);
    glowRef.current?.setAttribute("cx", `${18 + (value / 160) * 64}%`);
  });
  useMotionValueEvent(lightY, "change", (value) => {
    lightRef.current?.setAttribute("y", `${value}`);
    glowRef.current?.setAttribute("cy", `${18 + (value / 160) * 64}%`);
  });

  // Vars
  const status = reached ? STATUS_BADGE.on : STATUS_BADGE.off;
  const lifted = hovered && !flipped;

  // Focus follows the face that is showing; Escape turns the seal back over
  useEffect(() => {
    if (flipped) backRef.current?.focus({ preventScroll: true });
    else if (wasFlipped.current) frontRef.current?.focus({ preventScroll: true });

    wasFlipped.current = flipped;

    if (!flipped) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFlipped(false);
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [flipped]);

  // The light moves to the pointer, as if the wax were tilted under a lamp; mouse only, and not with reduced motion
  const handleLightMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "mouse" || REDUCE) return;

    const box = event.currentTarget.getBoundingClientRect();

    lightX.set(((event.clientX - box.left) / box.width) * 160);
    lightY.set(((event.clientY - box.top) / box.height) * 160);
  };

  const handleLeave = () => {
    setHovered(false);
    lightX.set(LIGHT_REST.x);
    lightY.set(LIGHT_REST.y);
  };

  const handleFlip = () => {
    setHovered(false);
    setFlipped(true);
  };

  const handleBack = () => {
    setFlipped(false);
  };

  return (
    <motion.div
      ref={badgeRef}
      className="cv-badge cv-enter hidden lg:block"
      initial={{ opacity: 0, transform: "scale(0.9)" }}
      animate={{ opacity: 1, transform: "scale(1)" }}
      transition={{ duration: 0.6, delay: ENTRANCE.trust + 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Picked up: lifts and turns a little on hover, and grows toward the page so its reverse is readable */}
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: "80% 85%" }}
        initial={false}
        animate={{ y: lifted ? -6 : 0, rotate: lifted ? -4 : 0, scale: flipped ? 1.42 : 1 }}
        transition={{
          y: { type: "spring", stiffness: 260, damping: 20 },
          rotate: { type: "spring", stiffness: 260, damping: 20 },
          scale: FLIP,
        }}
      >
        {/* Its shadow on the page: tighter and darker the higher it is held */}
        <motion.span
          className="bg-cv-violet absolute inset-x-[16%] top-[30%] bottom-[2%] rounded-full blur-[14px]"
          initial={false}
          animate={{
            opacity: lifted ? 0.42 : 0.2,
            transform: `translateY(${lifted ? 10 : 4}px) scale(${lifted ? 0.9 : 1})`,
          }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          aria-hidden
        />
        <motion.div
          className="cv-seal-flip absolute inset-0"
          initial={false}
          animate={{ transform: `rotateY(${flipped ? 180 : 0}deg)` }}
          transition={FLIP}
        >
          <button
            ref={frontRef}
            type="button"
            inert={flipped}
            aria-label={`Inspect seal: ${status.toLowerCase()}`}
            aria-expanded={flipped}
            onClick={handleFlip}
            onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
            onPointerMove={handleLightMove}
            onPointerLeave={handleLeave}
            onFocus={(event) => setHovered(event.currentTarget.matches(":focus-visible"))}
            onBlur={() => setHovered(false)}
            className="cv-seal-face cv-seal-front absolute inset-0 cursor-pointer rounded-full"
          >
            {/* Pressed in when the wave reaches it: squash on impact, spring back */}
            <motion.span
              className="absolute inset-0 block"
              initial={false}
              animate={{ transform: reached ? STAMP_FRAMES : STAMP_REST }}
              transition={{ duration: 0.6, times: [0, 0.4, 0.7, 1], ease: "easeOut" }}
            >
              {reached && (
                <motion.span
                  className="border-cv-violet absolute inset-[14%] rounded-full border-2"
                  initial={{ transform: "scale(0.75)", opacity: 0.5 }}
                  animate={{ transform: "scale(1.4)", opacity: 0 }}
                  transition={{ duration: 0.9, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  aria-hidden
                />
              )}
              <CredentialWaxSeal
                top={status}
                bottom={STATUS_BADGE.tail}
                active={reached}
                lightRef={lightRef}
                glowRef={glowRef}
                className="relative size-full"
              />
            </motion.span>
          </button>
          <div
            inert={!flipped}
            role="group"
            aria-label={STATUS_BADGE.back.title}
            className="cv-seal-face cv-seal-back absolute inset-0 flex flex-col items-center justify-center rounded-full px-[13%] text-center text-white"
          >
            <ShieldCheckIcon className="size-[1.6em] shrink-0" strokeWidth={2} aria-hidden />
            <p className="mt-[0.4em] text-[1em] leading-[1.15] font-bold text-balance">
              {STATUS_BADGE.back.title}
            </p>
            <p className="mt-[0.35em] text-[0.8em] leading-[1.3] text-pretty text-white/85">
              {STATUS_BADGE.back.text}
            </p>
            <button
              ref={backRef}
              type="button"
              onClick={handleBack}
              className="mt-[0.6em] shrink-0 rounded-full bg-white/18 px-[1.1em] py-[0.35em] text-[0.8em] leading-none font-semibold transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {STATUS_BADGE.back.action}
            </button>
          </div>
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {lifted && (
          <motion.span
            className="bg-cv-ink pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-white"
            initial={{ opacity: 0, transform: "translateY(4px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: 0, transform: "translateY(4px)" }}
            transition={{ duration: 0.2 }}
            aria-hidden
          >
            {STATUS_BADGE.hint}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ---- trust-strip ---- */
// Each wordmark's height in design px, balanced by eye so they read as one row
const LOGOS: Record<
  ProvablyLogoKey,
  { label: string; height: number; Mark: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  google: { label: "Google", height: 25, Mark: CredentialGoogleLogo },
  microsoft: { label: "Microsoft", height: 20, Mark: CredentialMicrosoftLogo },
  ibm: { label: "IBM", height: 21, Mark: CredentialIbmLogo },
  aws: { label: "AWS", height: 29, Mark: CredentialAwsLogo },
  spotify: { label: "Spotify", height: 23, Mark: CredentialSpotifyLogo },
  adobe: { label: "Adobe", height: 21, Mark: CredentialAdobeLogo },
};

const TrustStrip = () => {
  const { ENTRANCE, TRUST } = useConfig();

  return (
    <div className="cv-container relative z-10 flex flex-col items-center pb-8 lg:pb-[max(28px,calc(46*var(--cv-u)))]">
      <div className="cv-copy-halo cv-copy-halo-trust" aria-hidden />
      <motion.p
        className="cv-enter text-cv-muted text-[10.5px] font-semibold tracking-[0.28em] uppercase lg:text-[max(10.5px,calc(11*var(--cv-u)))]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: ENTRANCE.trust }}
      >
        {TRUST.label}
      </motion.p>
      <ul className="cv-trust-logos mt-5 flex max-w-[340px] flex-wrap items-center justify-center sm:max-w-none sm:flex-nowrap lg:mt-[max(16px,calc(24*var(--cv-u)))]">
        {TRUST.logos.map((key, index) => {
          const { label, height, Mark } = LOGOS[key];

          return (
            <motion.li
              key={key}
              className="cv-enter text-[#8e909c]"
              initial={{ opacity: 0, transform: "translateY(8px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              transition={{
                duration: 0.45,
                delay: ENTRANCE.trust + 0.08 + index * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Mark
                className="cv-trust-logo w-auto"
                style={{ "--h": height } as CSSProperties}
                aria-hidden={false}
                role="img"
                aria-label={label}
              />
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
};

/* ---- hero-decor ---- */
const place = (x: number, y: number) => ({ "--x": x, "--y": y }) as CSSProperties;

// The two connector curves off the floating cards; desktop only, where they have room to breathe
const HeroDecor = () => {
  const { ENTRANCE, FLOAT } = useConfig();

  return (
    <>
      <CredentialArc
        side="left"
        delay={ENTRANCE.decor}
        className="cv-float pointer-events-none! hidden h-auto w-[calc(62*var(--cv-u))] text-[#bdb5f7] lg:block"
        style={place(FLOAT.arcLeft.x, FLOAT.arcLeft.y)}
      />
      <CredentialArc
        side="right"
        delay={ENTRANCE.decor + 0.1}
        className="cv-float pointer-events-none! hidden h-auto w-[calc(62*var(--cv-u))] text-[#bdb5f7] lg:block"
        style={place(FLOAT.arcRight.x, FLOAT.arcRight.y)}
      />
    </>
  );
};

/* ---- hero-navbar ---- */
const HeroNavbar = () => {
  const { BRAND, ENTRANCE, NAV_CTA, NAV_LINKS } = useConfig();

  // States
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  const handleMenuToggle = () => {
    setMenuOpen((open) => !open);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  // crocwork: no brand and no links = the host page keeps its own navbar
  if (!BRAND.name && NAV_LINKS.length === 0) return null;

  return (
    <motion.header
      className="cv-enter relative z-30"
      initial={{ opacity: 0, transform: "translateY(-10px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: 0.45, delay: ENTRANCE.nav, ease: [0.22, 1, 0.36, 1] }}
    >
      <nav
        aria-label="Main"
        className="cv-container grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:h-[max(64px,calc(76*var(--cv-u)))] lg:pt-[calc(24*var(--cv-u))]"
      >
        <ul className="-ml-3.5 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="cv-sweep cv-sweep-link px-3.5 py-2 text-[14.5px] font-medium"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="cv-mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={handleMenuToggle}
          className="cv-sweep cv-outline size-11 justify-self-start lg:hidden"
        >
          {menuOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
        </button>
        <a
          href={BRAND.href}
          className="flex items-center gap-2 lg:gap-2.5"
          aria-label={`${BRAND.name} home`}
        >
          <CredentialLogoMark className="h-8 w-auto sm:h-9 lg:h-[max(34px,calc(40*var(--cv-u)))]" />
          <span className="text-[21px] font-semibold tracking-[-0.03em] sm:text-[24px] lg:text-[max(24px,calc(31*var(--cv-u)))]">
            {BRAND.name}
          </span>
        </a>
        {/* Just the arrow on phones, where the label would crowd the logo */}
        {NAV_CTA ? (
          <a
            href={NAV_CTA.href}
            aria-label={NAV_CTA.label}
            className="cv-sweep cv-outline size-11 gap-2 justify-self-end text-[14.5px] font-semibold whitespace-nowrap sm:w-auto sm:pr-[18px] sm:pl-5 lg:h-[46px]"
          >
            <span className="cv-label hidden sm:block">{NAV_CTA.label}</span>
            <ArrowRightIcon className="cv-sweep-arrow size-4" strokeWidth={2.3} aria-hidden />
          </a>
        ) : (
          <span />
        )}
      </nav>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="cv-mobile-menu"
            className="absolute inset-x-3 top-[60px] rounded-2xl border border-black/5 bg-white p-2 shadow-[0_24px_48px_-24px_rgb(70_60_200/0.35)] lg:hidden"
            initial={{ opacity: 0, transform: "translateY(-8px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: 0, transform: "translateY(-8px)" }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <ul>
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={handleMenuClose}
                    className="text-cv-ink flex h-12 items-center rounded-xl px-4 text-[15px] font-medium hover:bg-black/[0.03]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

/* ---- hero-copy ---- */
const EASE = [0.22, 1, 0.36, 1] as const;

// Each headline line rises a little and fades in, one after the other; no blur, so the LCP text paints sharp early
const lineReveal = (ENTRANCE: { headline: number; headlineStep: number }, index: number) => ({
  initial: { opacity: 0, transform: "translateY(0.28em)" },
  animate: { opacity: 1, transform: "translateY(0em)" },
  transition: {
    duration: 0.5,
    delay: ENTRANCE.headline + index * ENTRANCE.headlineStep,
    ease: EASE,
  },
});

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, transform: "translateY(12px)" },
  animate: { opacity: 1, transform: "translateY(0px)" },
  transition: { duration: 0.5, delay, ease: EASE },
});

const HeroCopy = () => {
  const { COPY, ENTRANCE, LINKS } = useConfig();

  return (
    <div className="cv-container relative z-10 flex flex-col items-center text-center">
      <div className="cv-copy-halo" aria-hidden />
      <motion.p
        className="cv-enter cv-eyebrow text-cv-violet-deep inline-flex items-center gap-2 rounded-full border border-[#e5e3fd] bg-[#f4f3fe] py-1.5 pr-3.5 pl-1.5 text-[10.5px] font-semibold tracking-[0.24em] uppercase lg:text-[max(10.5px,calc(11.5*var(--cv-u)))]"
        {...fadeUp(ENTRANCE.eyebrow)}
      >
        <span className="text-cv-violet relative block size-[18px]" aria-hidden>
          <CredentialSeal className="absolute inset-0 size-full" />
          <CredentialTick drawn className="absolute inset-0 size-full text-white" />
        </span>
        {COPY.eyebrow}
      </motion.p>
      <h1 id="cv-hero-title" className="cv-headline font-bold">
        <motion.span className="cv-enter block" {...lineReveal(ENTRANCE, 0)}>
          <KineticText text={COPY.lines[0]} />
        </motion.span>
        <motion.span className="cv-enter block" {...lineReveal(ENTRANCE, 1)}>
          <span className="relative inline-block">
            <KineticText text={COPY.lines[1]} />
            <motion.a
              href={LINKS.explore.href}
              aria-label={LINKS.explore.label}
              className="cv-arrow cv-sweep cv-solid cv-enter"
              initial={{ opacity: 0, transform: "scale(0.6)" }}
              animate={{ opacity: 1, transform: "scale(1)" }}
              transition={{
                type: "spring",
                stiffness: 360,
                damping: 20,
                delay: ENTRANCE.toggle + 0.1,
              }}
            >
              <ArrowUpRightIcon
                className="cv-sweep-arrow cv-sweep-arrow-up"
                strokeWidth={2.3}
                aria-hidden
              />
            </motion.a>
          </span>
        </motion.span>
        <motion.span className="cv-enter cv-headline-last block" {...lineReveal(ENTRANCE, 2)}>
          {/* Read as a whole word; the switch and the visible "fficial." follow it */}
          <span className="sr-only">{COPY.lastWord}</span>
          <VerifyToggle />
          <span aria-hidden>{COPY.lastWord.slice(1)}</span>
        </motion.span>
      </h1>
      <motion.p
        className="cv-enter cv-subtext text-cv-body max-w-[25.2em] text-pretty"
        {...fadeUp(ENTRANCE.copy)}
      >
        {COPY.subtext}
      </motion.p>
      <div className="cv-actions flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
        <motion.a
          href={LINKS.explore.href}
          className="cv-sweep cv-solid cv-enter h-14 gap-2.5 pr-6 pl-7 text-[15.5px] font-semibold sm:h-[58px] sm:pr-[26px] sm:pl-[30px]"
          {...fadeUp(ENTRANCE.copy + 0.1)}
        >
          <span className="cv-label">{LINKS.explore.label}</span>
          <ArrowRightIcon className="cv-sweep-arrow size-[18px]" strokeWidth={2.3} aria-hidden />
        </motion.a>
        <motion.a
          href={LINKS.howItWorks.href}
          className="cv-sweep cv-outline cv-enter h-14 gap-2.5 pr-7 pl-6 text-[15.5px] font-semibold sm:h-[58px] sm:pr-[30px] sm:pl-[26px]"
          {...fadeUp(ENTRANCE.copy + 0.2)}
        >
          <PlayIcon className="size-[18px] fill-current" strokeWidth={0} aria-hidden />
          <span className="cv-label">{LINKS.howItWorks.label}</span>
        </motion.a>
      </div>
    </div>
  );
};

/* ---- hero-layout ---- */
const HeroLayout = ({ className }: { className?: string }) => {
  // Hooks
  const { rootRef } = useVerification();

  return (
    <div
      id="top"
      ref={rootRef}
      data-slot="provably"
      style={{ width: "100%" }}
      className={cn("cv-hero font-cv-sans text-cv-ink antialiased", className)}
    >
      <style>{PROVABLY_CSS}</style>
      {/* No fade on the panel itself: each piece brings itself in, so the headline paints as early as it can */}
      <div className="cv-panel">
        <GridLines />
        <HeroNavbar />
        <section
          aria-labelledby="cv-hero-title"
          className="relative flex flex-1 flex-col justify-center pt-10 pb-8 lg:pt-[calc(40*var(--cv-u))] lg:pb-[calc(30*var(--cv-u))]"
        >
          <div className="relative w-full">
            <HeroCopy />
            <div className="cv-floats cv-container">
              <StatsCard />
              <CertificateCard />
              <HeroDecor />
            </div>
          </div>
        </section>
        <TrustStrip />
        <StatusBadge />
      </div>
      <CredentialDialog />
      <WaveOverlay />
    </div>
  );
};

/* ---------------------------------------------------------------------------------------------------------------
 * Hero
 * ------------------------------------------------------------------------------------------------------------- */

export function Provably({
  brand = EMPTY_BRAND,
  navLinks = [],
  navCta,
  copy = EMPTY_COPY,
  links = EMPTY_LINKS,
  toggle = EMPTY_TOGGLE,
  stats = EMPTY_STATS,
  certificate = EMPTY_CERTIFICATE,
  credentials = [],
  statusBadge = EMPTY_STATUS_BADGE,
  trust = EMPTY_TRUST,
  wave,
  pulses,
  autoplay,
  entrance,
  float,
  reducedMotion,
  className,
}: ProvablyProps) {
  // Read through useMediaQuery so the first client render matches the server before switching
  const systemReduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const reduce = reducedMotion ?? systemReduce;

  const config = useMemo<Config>(
    () => ({
      BRAND: brand,
      NAV_LINKS: navLinks,
      NAV_CTA: navCta,
      COPY: copy,
      LINKS: links,
      TOGGLE: toggle,
      STATS: stats,
      CERTIFICATE: certificate,
      CREDENTIALS: credentials,
      STATUS_BADGE: statusBadge,
      TRUST: trust,
      WAVE: { ...DEFAULT_WAVE, ...wave },
      PULSES: { ...DEFAULT_PULSES, ...pulses },
      AUTOPLAY: { ...DEFAULT_AUTOPLAY, ...autoplay },
      ENTRANCE: { ...DEFAULT_ENTRANCE, ...entrance },
      FLOAT: { ...DEFAULT_FLOAT, ...float },
      REDUCE: reduce,
    }),
    [
      brand,
      navLinks,
      navCta,
      copy,
      links,
      toggle,
      stats,
      certificate,
      credentials,
      statusBadge,
      trust,
      wave,
      pulses,
      autoplay,
      entrance,
      float,
      reduce,
    ],
  );

  // Reduced motion keeps every fade and state change but drops movement
  return (
    <ConfigContext.Provider value={config}>
      <MotionConfig
        reducedMotion={reducedMotion === undefined ? "user" : reducedMotion ? "always" : "never"}
      >
        <VerificationProvider>
          <HeroLayout className={className} />
        </VerificationProvider>
      </MotionConfig>
    </ConfigContext.Provider>
  );
}

export default Provably;
