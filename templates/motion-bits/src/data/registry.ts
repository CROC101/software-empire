import type { ComponentType } from "react";
import type { Category, ComponentItem, PropValue } from "@/types/component-registry";
import { sources } from "./sources.generated";

import BlurText from "@/components/reactbits/BlurText";
import SplitTextReveal from "@/components/reactbits/SplitTextReveal";
import ShinyMetallicText from "@/components/reactbits/ShinyMetallicText";
import DecryptedMatrixText from "@/components/reactbits/DecryptedMatrixText";
import MagnetWrapper from "@/components/reactbits/MagnetWrapper";
import ClickSparkCanvas from "@/components/reactbits/ClickSparkCanvas";
import Tilted3DCard from "@/components/reactbits/Tilted3DCard";
import PixelTransitionCard from "@/components/reactbits/PixelTransitionCard";
import ParticlesConstellationBg from "@/components/reactbits/ParticlesConstellationBg";
import AuroraWavesBg from "@/components/reactbits/AuroraWavesBg";

type Any = ComponentType<Record<string, PropValue>>;
const c = (x: unknown) => x as Any;

function item(i: Omit<ComponentItem, "source" | "defaultProps"> & { defaultProps?: Record<string, PropValue> }): ComponentItem {
  const defaults: Record<string, PropValue> = {};
  for (const d of i.propDocs) {
    const raw = d.default.replace(/^"|"$/g, "");
    if (d.type === "number") defaults[d.name] = Number(raw);
    else if (d.type === "boolean") defaults[d.name] = raw === "true";
    else if (d.type !== "ReactNode" && d.name !== "className") defaults[d.name] = raw;
  }
  return { ...i, defaultProps: { ...defaults, ...i.defaultProps }, source: sources[i.exportName] };
}

export const registry: ComponentItem[] = [
  item({
    slug: "blur-text",
    name: "Blur Text",
    exportName: "BlurText",
    category: "Text Animations",
    badge: "POPULAR",
    description: "Words or characters rise out of a soft blur into sharp focus, one after another.",
    dependencies: ["framer-motion"],
    component: c(BlurText),
    defaultProps: { text: "Isn't this so cool?!", className: "text-4xl font-semibold tracking-[-0.03em] text-white justify-center" },
    propControls: [
      { name: "text", type: "text" },
      { name: "delay", type: "range", min: 0, max: 500, step: 10, unit: "ms" },
      { name: "duration", type: "range", min: 0.1, max: 2, step: 0.05, unit: "s" },
      { name: "animateBy", type: "select", options: ["words", "chars"] },
      { name: "direction", type: "select", options: ["top", "bottom"] },
      { name: "blur", type: "range", min: 0, max: 30, step: 1, unit: "px" },
    ],
    propDocs: [
      { name: "text", type: "string", default: '"Isn\'t this so cool?!"', description: "The text to animate." },
      { name: "delay", type: "number", default: "120", description: "Delay between each word or character, in ms." },
      { name: "duration", type: "number", default: "0.6", description: "Length of each item's animation, in seconds." },
      { name: "animateBy", type: "'words' | 'chars'", default: '"words"', description: "Split the text into words or characters." },
      { name: "direction", type: "'top' | 'bottom'", default: '"top"', description: "Where each item enters from." },
      { name: "blur", type: "number", default: "10", description: "Starting blur radius in px." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
    ],
  }),
  item({
    slug: "split-text-reveal",
    name: "Split Text Reveal",
    exportName: "SplitTextReveal",
    category: "Text Animations",
    badge: "NEW",
    description: "Characters spring into place one by one with real spring physics.",
    dependencies: ["framer-motion"],
    component: c(SplitTextReveal),
    propControls: [
      { name: "text", type: "text" },
      { name: "staggerDelay", type: "range", min: 0, max: 200, step: 5, unit: "ms" },
      { name: "springStiffness", type: "range", min: 40, max: 600, step: 10 },
      { name: "damping", type: "range", min: 4, max: 40, step: 1 },
      { name: "color", type: "color" },
      { name: "fontSize", type: "range", min: 16, max: 96, step: 1, unit: "px" },
    ],
    propDocs: [
      { name: "text", type: "string", default: '"Hello, you!"', description: "The text to reveal." },
      { name: "staggerDelay", type: "number", default: "40", description: "Delay between characters, in ms." },
      { name: "springStiffness", type: "number", default: "260", description: "Spring stiffness; higher snaps faster." },
      { name: "damping", type: "number", default: "14", description: "Spring damping; lower bounces more." },
      { name: "color", type: "string", default: '"#ffffff"', description: "Text colour." },
      { name: "fontSize", type: "number", default: "56", description: "Font size in px." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the heading." },
    ],
  }),
  item({
    slug: "shiny-metallic-text",
    name: "Shiny Metallic Text",
    exportName: "ShinyMetallicText",
    category: "Text Animations",
    description: "A diagonal specular highlight sweeps across the text forever.",
    dependencies: ["framer-motion"],
    component: c(ShinyMetallicText),
    propControls: [
      { name: "text", type: "text" },
      { name: "speed", type: "range", min: 0.5, max: 8, step: 0.1, unit: "s" },
      { name: "shimmerWidth", type: "range", min: 4, max: 60, step: 1, unit: "%" },
      { name: "baseColor", type: "color" },
      { name: "shineColor", type: "color" },
      { name: "fontSize", type: "range", min: 16, max: 96, step: 1, unit: "px" },
      { name: "disabled", type: "toggle" },
    ],
    propDocs: [
      { name: "text", type: "string", default: '"Polished chrome"', description: "The text to render." },
      { name: "speed", type: "number", default: "2.5", description: "Seconds per sweep." },
      { name: "shimmerWidth", type: "number", default: "18", description: "Width of the highlight band, in % of the gradient." },
      { name: "baseColor", type: "string", default: '"#7c7785"', description: "Colour of the metal." },
      { name: "shineColor", type: "string", default: '"#ffffff"', description: "Colour of the highlight." },
      { name: "fontSize", type: "number", default: "52", description: "Font size in px." },
      { name: "disabled", type: "boolean", default: "false", description: "Pause the sweep." },
      { name: "className", type: "string", default: '""', description: "Extra classes." },
    ],
  }),
  item({
    slug: "decrypted-matrix-text",
    name: "Decrypted Matrix Text",
    exportName: "DecryptedMatrixText",
    category: "Text Animations",
    badge: "NEW",
    description: "Hacker-style scramble that decrypts the text from left to right on mount or hover.",
    dependencies: [],
    component: c(DecryptedMatrixText),
    propControls: [
      { name: "text", type: "text" },
      { name: "scrambleSpeed", type: "range", min: 10, max: 200, step: 5, unit: "ms" },
      { name: "characters", type: "text" },
      { name: "animateOn", type: "select", options: ["mount", "hover"] },
      { name: "revealedColor", type: "color" },
      { name: "scrambleColor", type: "color" },
      { name: "fontSize", type: "range", min: 14, max: 80, step: 1, unit: "px" },
    ],
    propDocs: [
      { name: "text", type: "string", default: '"Access granted"', description: "The text to decrypt." },
      { name: "scrambleSpeed", type: "number", default: "45", description: "Milliseconds between scramble frames." },
      { name: "characters", type: "string", default: '"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*"', description: "Pool of characters used while scrambling." },
      { name: "animateOn", type: "'mount' | 'hover'", default: '"mount"', description: "When the decryption runs." },
      { name: "revealedColor", type: "string", default: '"#ffffff"', description: "Colour of decrypted characters." },
      { name: "scrambleColor", type: "string", default: '"#a855f7"', description: "Colour of scrambling characters." },
      { name: "fontSize", type: "number", default: "40", description: "Font size in px." },
      { name: "className", type: "string", default: '""', description: "Extra classes." },
    ],
  }),
  item({
    slug: "magnet-wrapper",
    name: "Magnet Wrapper",
    exportName: "MagnetWrapper",
    category: "Animations",
    badge: "POPULAR",
    description: "Pulls its children toward the cursor whenever the pointer is close enough.",
    dependencies: [],
    component: c(MagnetWrapper),
    propControls: [
      { name: "label", type: "text" },
      { name: "padding", type: "range", min: 0, max: 300, step: 5, unit: "px" },
      { name: "magnetStrength", type: "range", min: 1, max: 10, step: 0.5 },
      { name: "disabled", type: "toggle" },
    ],
    propDocs: [
      { name: "children", type: "ReactNode", default: "button", description: "What gets pulled. Falls back to a pill showing `label`." },
      { name: "label", type: "string", default: '"Pull me closer"', description: "Text of the fallback pill." },
      { name: "padding", type: "number", default: "100", description: "Extra radius around the element that activates the pull, in px." },
      { name: "magnetStrength", type: "number", default: "3", description: "Divides the cursor offset; higher is subtler." },
      { name: "disabled", type: "boolean", default: "false", description: "Turn the effect off." },
      { name: "className", type: "string", default: '""', description: "Extra classes." },
    ],
  }),
  item({
    slug: "click-spark-canvas",
    name: "Click Spark",
    exportName: "ClickSparkCanvas",
    category: "Animations",
    description: "A canvas burst of sparks radiates from every click inside the container.",
    dependencies: ["canvas"],
    component: c(ClickSparkCanvas),
    fill: true,
    propControls: [
      { name: "sparkColor", type: "color" },
      { name: "sparkCount", type: "range", min: 3, max: 24, step: 1 },
      { name: "sparkRadius", type: "range", min: 8, max: 120, step: 1, unit: "px" },
      { name: "sparkSize", type: "range", min: 2, max: 40, step: 1, unit: "px" },
      { name: "duration", type: "range", min: 100, max: 1500, step: 25, unit: "ms" },
    ],
    propDocs: [
      { name: "children", type: "ReactNode", default: "hint", description: "Content inside the clickable area." },
      { name: "sparkColor", type: "string", default: '"#ffffff"', description: "Spark colour." },
      { name: "sparkCount", type: "number", default: "8", description: "Sparks per click." },
      { name: "sparkRadius", type: "number", default: "24", description: "How far sparks travel, in px." },
      { name: "sparkSize", type: "number", default: "12", description: "Length of each spark, in px." },
      { name: "duration", type: "number", default: "450", description: "Burst duration, in ms." },
      { name: "className", type: "string", default: '""', description: "Extra classes." },
    ],
  }),
  item({
    slug: "tilted-3d-card",
    name: "Tilted 3D Card",
    exportName: "Tilted3DCard",
    category: "Components",
    badge: "POPULAR",
    description: "A perspective card that tilts toward the cursor with a moving glare sheen.",
    dependencies: [],
    component: c(Tilted3DCard),
    propControls: [
      { name: "title", type: "text" },
      { name: "maxTilt", type: "range", min: 0, max: 40, step: 1, unit: "°" },
      { name: "glareOpacity", type: "range", min: 0, max: 1, step: 0.05 },
      { name: "scaleOnHover", type: "range", min: 1, max: 1.3, step: 0.01 },
      { name: "width", type: "range", min: 160, max: 420, step: 2, unit: "px" },
      { name: "height", type: "range", min: 160, max: 460, step: 2, unit: "px" },
    ],
    propDocs: [
      { name: "children", type: "ReactNode", default: "gradient art", description: "Card contents." },
      { name: "title", type: "string", default: '"Nebula 01"', description: "Title of the default artwork." },
      { name: "maxTilt", type: "number", default: "14", description: "Maximum tilt angle, in degrees." },
      { name: "glareOpacity", type: "number", default: "0.35", description: "Strength of the glare sheen (0-1)." },
      { name: "scaleOnHover", type: "number", default: "1.05", description: "Scale while hovered." },
      { name: "width", type: "number", default: "280", description: "Card width, in px." },
      { name: "height", type: "number", default: "340", description: "Card height, in px." },
      { name: "className", type: "string", default: '""', description: "Extra classes." },
    ],
  }),
  item({
    slug: "pixel-transition-card",
    name: "Pixel Transition Card",
    exportName: "PixelTransitionCard",
    category: "Components",
    badge: "NEW",
    description: "Hover to dissolve between two faces through a grid of popping pixels.",
    dependencies: [],
    component: c(PixelTransitionCard),
    propControls: [
      { name: "gridSize", type: "range", min: 3, max: 30, step: 1 },
      { name: "pixelColor", type: "color" },
      { name: "animationDuration", type: "range", min: 0.1, max: 2, step: 0.05, unit: "s" },
      { name: "width", type: "range", min: 160, max: 420, step: 2, unit: "px" },
      { name: "height", type: "range", min: 160, max: 420, step: 2, unit: "px" },
    ],
    propDocs: [
      { name: "firstContent", type: "ReactNode", default: "icon face", description: "Shown at rest." },
      { name: "secondContent", type: "ReactNode", default: "gradient face", description: "Shown on hover." },
      { name: "gridSize", type: "number", default: "9", description: "Pixels per row and column." },
      { name: "pixelColor", type: "string", default: '"#ffffff"', description: "Colour of the transition pixels." },
      { name: "animationDuration", type: "number", default: "0.4", description: "Total transition time, in seconds." },
      { name: "width", type: "number", default: "280", description: "Card width, in px." },
      { name: "height", type: "number", default: "280", description: "Card height, in px." },
      { name: "className", type: "string", default: '""', description: "Extra classes." },
    ],
  }),
  item({
    slug: "particles-constellation-bg",
    name: "Particles Constellation",
    exportName: "ParticlesConstellationBg",
    category: "Backgrounds",
    badge: "POPULAR",
    description: "Drifting particles link up with fine lines when close to each other or the cursor.",
    dependencies: ["canvas"],
    component: c(ParticlesConstellationBg),
    fill: true,
    propControls: [
      { name: "particleCount", type: "range", min: 10, max: 250, step: 5 },
      { name: "linkDistance", type: "range", min: 40, max: 250, step: 5, unit: "px" },
      { name: "particleColor", type: "color" },
      { name: "speed", type: "range", min: 0, max: 2, step: 0.05 },
      { name: "particleSize", type: "range", min: 0.5, max: 4, step: 0.1, unit: "px" },
      { name: "mouseInteraction", type: "toggle" },
    ],
    propDocs: [
      { name: "particleCount", type: "number", default: "90", description: "Number of particles." },
      { name: "linkDistance", type: "number", default: "120", description: "Max distance for a link line, in px." },
      { name: "particleColor", type: "string", default: '"#c4b5fd"', description: "Particle and line colour (hex)." },
      { name: "speed", type: "number", default: "0.4", description: "Drift speed." },
      { name: "particleSize", type: "number", default: "1.6", description: "Particle radius, in px." },
      { name: "mouseInteraction", type: "boolean", default: "true", description: "Link particles to the cursor." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the canvas." },
    ],
  }),
  item({
    slug: "aurora-waves-bg",
    name: "Aurora Waves",
    exportName: "AuroraWavesBg",
    category: "Backgrounds",
    description: "Layered aurora light that slowly blends and drifts, moved only by GPU transforms.",
    dependencies: ["framer-motion"],
    component: c(AuroraWavesBg),
    fill: true,
    propControls: [
      { name: "colorA", type: "color", label: "colorStop 1" },
      { name: "colorB", type: "color", label: "colorStop 2" },
      { name: "colorC", type: "color", label: "colorStop 3" },
      { name: "baseColor", type: "color" },
      { name: "blendSpeed", type: "range", min: 0.1, max: 5, step: 0.1 },
      { name: "amplitude", type: "range", min: 0, max: 3, step: 0.1 },
      { name: "blur", type: "range", min: 0, max: 140, step: 2, unit: "px" },
    ],
    propDocs: [
      { name: "colorA", type: "string", default: '"#5b21b6"', description: "First colour stop." },
      { name: "colorB", type: "string", default: '"#a855f7"', description: "Second colour stop." },
      { name: "colorC", type: "string", default: '"#e9d5ff"', description: "Third colour stop." },
      { name: "baseColor", type: "string", default: '"#0e0b13"', description: "Colour behind the light." },
      { name: "blendSpeed", type: "number", default: "1", description: "Speed multiplier for the drift." },
      { name: "amplitude", type: "number", default: "1", description: "How far the layers travel." },
      { name: "blur", type: "number", default: "60", description: "Blur radius of each layer, in px." },
      { name: "className", type: "string", default: '""', description: "Extra classes." },
    ],
  }),
];

export const getComponent = (slug: string) => registry.find((r) => r.slug === slug);
export const byCategory = (cat: Category) => registry.filter((r) => r.category === cat);
export const categorySlug = (cat: Category) => cat.toLowerCase().replace(/\s+/g, "-");
export const categoryFromSlug = (s: string | null) =>
  (["Text Animations", "Animations", "Components", "Backgrounds"] as Category[]).find((c) => categorySlug(c) === s);

export const installCommand = (item: ComponentItem, lang: "ts" | "js" = "ts") =>
  `npx shadcn@latest add @motion-bits/${item.exportName}-${lang.toUpperCase()}-TW`;

export const npmDeps = (items: ComponentItem[]) =>
  Array.from(new Set(items.flatMap((i) => i.dependencies).filter((d) => d !== "canvas")));

/** JSX usage snippet reflecting the given (possibly customised) props. */
export function usageSnippet(item: ComponentItem, props: Record<string, PropValue>) {
  const attrs = Object.entries(props)
    .filter(([k]) => k !== "className")
    .map(([k, v]) => (typeof v === "string" ? `${k}="${v.replace(/"/g, "&quot;")}"` : `${k}={${v}}`));
  const tag =
    attrs.length > 2
      ? `<${item.exportName}\n${attrs.map((a) => `        ${a}`).join("\n")}\n      />`
      : `<${item.exportName} ${attrs.join(" ")} />`;
  const wrap = item.fill ? `<div style={{ width: "100%", height: 600, position: "relative" }}>\n      ${tag}\n    </div>` : tag;
  return `import ${item.exportName} from "./${item.exportName}";

export default function Example() {
  return (
    ${wrap}
  );
}`;
}
