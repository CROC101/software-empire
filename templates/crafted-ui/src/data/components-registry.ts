import type { ComponentType } from "react";
import type { PropValues, RegistryComponent } from "@/types/registry";
import { SOURCES } from "@/data/registry-sources";
import { MagneticSpotlightCard } from "@/registry/magnetic-spotlight-card";
import { HyperTextScramble } from "@/registry/hyper-text-scramble";
import { DockMagnificationBar } from "@/registry/dock-magnification-bar";
import { AuroraMeshBackground } from "@/registry/aurora-mesh-background";
import { BorderBeamButton } from "@/registry/border-beam-button";
import { BentoMetricsGrid } from "@/registry/bento-metrics-grid";
import { FloatingCommandIsland } from "@/registry/floating-command-island";
import { InfiniteLogoMarquee } from "@/registry/infinite-logo-marquee";
import { LiquidMetalHero } from "@/registry/liquid-metal-hero";
import { HoverPreview } from "@/registry/hover-preview";

// Each component takes its own typed props; the playground drives them as a generic bag.
const live = (c: unknown) => c as ComponentType<PropValues>;

export const COMPONENTS: RegistryComponent[] = [
  {
    slug: "magnetic-spotlight-card",
    name: "Magnetic Spotlight Card",
    exportName: "MagneticSpotlightCard",
    description: "Glassmorphic bento card with a cursor-tracking radial spotlight border glow and subtle 3D tilt physics.",
    category: "Cards",
    library: "Framer Motion",
    author: { handle: "nova", name: "Nova Studio", hue: 260 },
    dependencies: ["framer-motion", "lucide-react"],
    registryDependencies: [],
    installs: 18420,
    bookmarks: 2140,
    published: "10/02/2026",
    previewHeight: 320,
    canvas: "dark",
    propSchema: [
      { kind: "text", name: "title", label: "Title", default: "Ship faster with AI" },
      { kind: "text", name: "description", label: "Description", default: "A glass card whose border follows your cursor, with a soft 3D tilt." },
      { kind: "color", name: "spotlightColor", label: "Spotlight colour", default: "#8b5cf6", accent: true },
      { kind: "number", name: "spotlightSize", label: "Spotlight size", default: 320, min: 120, max: 600, step: 10, unit: "px" },
      { kind: "number", name: "tiltStrength", label: "Tilt strength", default: 10, min: 0, max: 25, step: 1, unit: "°" },
      { kind: "boolean", name: "showBorderGlow", label: "Border glow", default: true },
    ],
    Component: live(MagneticSpotlightCard),
  },
  {
    slug: "hyper-text-scramble",
    name: "Hyper Text Scramble",
    exportName: "HyperTextScramble",
    description: "Cyberpunk terminal character-scrambling text reveal, triggered on mount or hover.",
    category: "Text Effects",
    library: "Pure CSS",
    author: { handle: "glitchlab", name: "Glitch Lab", hue: 190 },
    dependencies: [],
    registryDependencies: [],
    installs: 9310,
    bookmarks: 1204,
    published: "09/14/2026",
    previewHeight: 220,
    canvas: "dark",
    propSchema: [
      { kind: "text", name: "text", label: "Text", default: "DESIGN ENGINEERING" },
      { kind: "number", name: "duration", label: "Duration", default: 1200, min: 200, max: 4000, step: 100, unit: "ms" },
      { kind: "select", name: "trigger", label: "Trigger", default: "mount", options: ["mount", "hover"] },
      { kind: "select", name: "charset", label: "Characters", default: "alphanumeric", options: ["alphanumeric", "binary", "symbols"] },
      { kind: "color", name: "color", label: "Colour", default: "#22d3ee", accent: true },
      { kind: "number", name: "fontSize", label: "Font size", default: 40, min: 16, max: 72, step: 1, unit: "px" },
    ],
    Component: live(HyperTextScramble),
  },
  {
    slug: "dock-magnification-bar",
    name: "Dock Magnification Bar",
    exportName: "DockMagnificationBar",
    description: "Floating glass dock with spring-based cursor-proximity icon scaling.",
    category: "Navigation",
    library: "Framer Motion",
    author: { handle: "nova", name: "Nova Studio", hue: 260 },
    dependencies: ["framer-motion", "lucide-react"],
    registryDependencies: [],
    installs: 22870,
    bookmarks: 3310,
    published: "08/30/2026",
    previewHeight: 240,
    canvas: "dark",
    propSchema: [
      { kind: "number", name: "iconSize", label: "Icon size", default: 44, min: 28, max: 64, step: 1, unit: "px" },
      { kind: "number", name: "magnification", label: "Magnification", default: 1.8, min: 1, max: 2.5, step: 0.1, unit: "×" },
      { kind: "number", name: "distance", label: "Reach", default: 140, min: 60, max: 300, step: 10, unit: "px" },
      { kind: "boolean", name: "showLabels", label: "Labels on hover", default: true },
    ],
    Component: live(DockMagnificationBar),
  },
  {
    slug: "aurora-mesh-background",
    name: "Aurora Mesh Background",
    exportName: "AuroraMeshBackground",
    description: "GPU-accelerated animated mesh gradient with a subtle noise grain overlay for hero sections.",
    category: "Backgrounds",
    library: "Pure CSS",
    author: { handle: "prism", name: "Prism", hue: 320 },
    dependencies: [],
    registryDependencies: [],
    installs: 31450,
    bookmarks: 4020,
    published: "07/21/2026",
    previewHeight: 320,
    canvas: "dark",
    propSchema: [
      { kind: "text", name: "title", label: "Title", default: "Build at the speed of thought" },
      { kind: "color", name: "colorA", label: "Colour A", default: "#6366f1", accent: true },
      { kind: "color", name: "colorB", label: "Colour B", default: "#06b6d4" },
      { kind: "color", name: "colorC", label: "Colour C", default: "#ec4899" },
      { kind: "number", name: "speed", label: "Cycle length", default: 18, min: 4, max: 40, step: 1, unit: "s" },
      { kind: "number", name: "blur", label: "Blur", default: 60, min: 0, max: 120, step: 5, unit: "px" },
      { kind: "boolean", name: "showGrain", label: "Noise grain", default: true },
    ],
    Component: live(AuroraMeshBackground),
  },
  {
    slug: "border-beam-button",
    name: "Border Beam Button",
    exportName: "BorderBeamButton",
    description: "Dark pill button with a continuous light beam travelling along its 1px border.",
    category: "Buttons",
    library: "Pure CSS",
    author: { handle: "glitchlab", name: "Glitch Lab", hue: 190 },
    dependencies: ["lucide-react"],
    registryDependencies: [],
    installs: 27690,
    bookmarks: 3580,
    published: "10/11/2026",
    previewHeight: 200,
    canvas: "dark",
    propSchema: [
      { kind: "text", name: "label", label: "Label", default: "Get started" },
      { kind: "color", name: "beamColor", label: "Beam colour", default: "#22d3ee", accent: true },
      { kind: "number", name: "duration", label: "Lap time", default: 3, min: 1, max: 10, step: 0.5, unit: "s" },
      { kind: "select", name: "size", label: "Size", default: "md", options: ["sm", "md", "lg"] },
      { kind: "boolean", name: "showArrow", label: "Arrow", default: true },
    ],
    Component: live(BorderBeamButton),
  },
  {
    slug: "bento-metrics-grid",
    name: "Bento Metrics Grid",
    exportName: "BentoMetricsGrid",
    description: "Analytics bento grid with animated number counters, sparklines and hover micro-interactions.",
    category: "Bento Grids",
    library: "Framer Motion",
    author: { handle: "prism", name: "Prism", hue: 320 },
    dependencies: ["framer-motion", "lucide-react"],
    registryDependencies: [],
    installs: 14280,
    bookmarks: 1890,
    published: "09/03/2026",
    previewHeight: 320,
    canvas: "dark",
    propSchema: [
      { kind: "color", name: "accent", label: "Accent", default: "#10b981", accent: true },
      { kind: "number", name: "duration", label: "Count-up time", default: 1.6, min: 0.2, max: 5, step: 0.1, unit: "s" },
      { kind: "text", name: "currency", label: "Currency symbol", default: "$" },
      { kind: "boolean", name: "showSparklines", label: "Sparklines", default: true },
      { kind: "select", name: "density", label: "Density", default: "comfortable", options: ["compact", "comfortable"] },
    ],
    Component: live(BentoMetricsGrid),
  },
  {
    slug: "floating-command-island",
    name: "Floating Command Island",
    exportName: "FloatingCommandIsland",
    description: "Expandable notification and status pill with morphing spring dimensions.",
    category: "Navigation",
    library: "Framer Motion",
    author: { handle: "nova", name: "Nova Studio", hue: 260 },
    dependencies: ["framer-motion", "lucide-react"],
    registryDependencies: [],
    installs: 16840,
    bookmarks: 2470,
    published: "10/27/2026",
    previewHeight: 280,
    canvas: "dark",
    propSchema: [
      { kind: "select", name: "initialState", label: "Start state", default: "idle", options: ["idle", "call", "music", "timer"] },
      { kind: "boolean", name: "autoCycle", label: "Auto cycle", default: true },
      { kind: "number", name: "interval", label: "Interval", default: 2.6, min: 1, max: 8, step: 0.2, unit: "s" },
      { kind: "color", name: "accent", label: "Accent", default: "#22c55e", accent: true },
    ],
    Component: live(FloatingCommandIsland),
  },
  {
    slug: "infinite-logo-marquee",
    name: "Infinite Logo Marquee",
    exportName: "InfiniteLogoMarquee",
    description: "Seamless pause-on-hover dual-row marquee with mask-image edge fading.",
    category: "Hero Sections",
    library: "Pure CSS",
    author: { handle: "prism", name: "Prism", hue: 320 },
    dependencies: ["lucide-react"],
    registryDependencies: [],
    installs: 20110,
    bookmarks: 2650,
    published: "06/18/2026",
    previewHeight: 220,
    canvas: "dark",
    propSchema: [
      { kind: "number", name: "speed", label: "Loop length", default: 30, min: 5, max: 80, step: 1, unit: "s" },
      { kind: "number", name: "gap", label: "Gap", default: 48, min: 16, max: 120, step: 4, unit: "px" },
      { kind: "select", name: "rows", label: "Rows", default: "2", options: ["1", "2"] },
      { kind: "boolean", name: "pauseOnHover", label: "Pause on hover", default: true },
      { kind: "boolean", name: "fadeEdges", label: "Fade edges", default: true },
    ],
    Component: live(InfiniteLogoMarquee),
  },
  {
    slug: "liquid-metal-hero",
    name: "Liquid Metal Hero",
    exportName: "LiquidMetalHero",
    description: "Liquid metal hero section with smooth animations, ready for any website.",
    category: "Hero Sections",
    library: "Framer Motion",
    author: { handle: "chowlol202", name: "chowlol202", hue: 30 },
    dependencies: ["framer-motion"],
    registryDependencies: [],
    installs: 1400,
    bookmarks: 1400,
    published: "8/21/2025",
    previewHeight: 360,
    canvas: "dark",
    propSchema: [
      { kind: "text", name: "badge", label: "Badge", default: "Next Generation UI" },
      { kind: "text", name: "title", label: "Title", default: "Fluid Design Excellence" },
      { kind: "text", name: "subtitle", label: "Subtitle", default: "Interfaces with a liquid metal finish that adapt to every screen." },
      { kind: "text", name: "primaryCtaLabel", label: "Button label", default: "Start Building" },
      { kind: "color", name: "tint", label: "Metal tint", default: "#a5b4fc", accent: true },
      { kind: "number", name: "speed", label: "Spin time", default: 12, min: 3, max: 40, step: 1, unit: "s" },
    ],
    Component: live(LiquidMetalHero),
  },
  {
    slug: "hover-preview",
    name: "Hover Preview",
    exportName: "HoverPreview",
    description: "Shows image previews above text links on hover.",
    category: "Cards",
    library: "Framer Motion",
    author: { handle: "minhxthanh", name: "minhxthanh", hue: 210 },
    dependencies: ["framer-motion"],
    registryDependencies: [],
    installs: 686,
    bookmarks: 686,
    published: "7/09/2025",
    previewHeight: 320,
    canvas: "dark",
    propSchema: [
      { kind: "number", name: "previewWidth", label: "Preview width", default: 220, min: 140, max: 320, step: 10, unit: "px" },
      { kind: "boolean", name: "showCaption", label: "Caption", default: true },
      { kind: "color", name: "accent", label: "Underline colour", default: "#a78bfa", accent: true },
    ],
    Component: live(HoverPreview),
  },
];

export const CATEGORIES = ["All", "Hero Sections", "Bento Grids", "Buttons", "Cards", "Text Effects", "Backgrounds", "Navigation", "Forms"] as const;
export const LIBRARIES = ["Framer Motion", "GSAP", "Three.js", "Pure CSS"] as const;

export function getComponent(slug: string) {
  return COMPONENTS.find((c) => c.slug === slug);
}

export function getSource(slug: string) {
  return SOURCES[slug] ?? "";
}

export function defaultProps(c: RegistryComponent): PropValues {
  return Object.fromEntries(c.propSchema.map((p) => [p.name, p.default]));
}

export const SITE_URL = "https://craft.example.dev";
