"use client";

import type { ComponentType } from "react";
import { AuroraTide } from "./aurora-tide";
import { BeamButton } from "./beam-button";
import { ClickSpark } from "./click-spark";
import { Constellation } from "./constellation";
import { DecodeText } from "./decode-text";
import { Dock } from "./dock";
import { Island } from "./island";
import { Marquee } from "./marquee";
import type { Values } from "./meta";
import { MetricBento } from "./metric-bento";
import { PixelCard } from "./pixel-card";
import { RevealText } from "./reveal-text";
import { SpotlightCard } from "./spotlight-card";

const parts = {
  "aurora-tide": AuroraTide,
  "decode-text": DecodeText,
  "reveal-text": RevealText,
  "spotlight-card": SpotlightCard,
  "pixel-card": PixelCard,
  "click-spark": ClickSpark,
  constellation: Constellation,
  "beam-button": BeamButton,
  dock: Dock,
  island: Island,
  "metric-bento": MetricBento,
  marquee: Marquee,
} satisfies Record<string, ComponentType<never>>;

/** Renders one registry part with playground values (validated against its controls upstream). */
export function Part({ slug, values }: { slug: string; values: Values }) {
  const C = (parts as Record<string, ComponentType<Values> | undefined>)[slug];
  return C ? <C {...values} /> : null;
}

export const partSlugs = Object.keys(parts);
