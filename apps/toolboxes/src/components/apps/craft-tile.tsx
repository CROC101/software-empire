import type { CSSProperties } from "react";
import { craftHue, type CraftApp } from "@/lib/craft-apps";

/** An app's colour tile with its glyph (the cards, the grid and the hero all use it). */
export function CraftTile({ app, size = 64 }: { app: CraftApp; size?: number }) {
  return (
    <span
      className="ch-tile grid shrink-0 place-items-center rounded-xl bg-(--hue) text-white shadow-md"
      style={{ "--hue": craftHue(app.slug), width: size, height: size } as CSSProperties}
    >
      <app.icon aria-hidden style={{ width: size / 2, height: size / 2 }} strokeWidth={1.75} />
    </span>
  );
}
