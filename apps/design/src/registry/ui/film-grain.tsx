"use client";

import { useFx } from "@empire/ui";
import { useRef } from "react";

/**
 * A layer of moving film grain over a card or picture. A small noise tile is redrawn every few
 * frames and repeated across the box, so it costs almost nothing.
 */
export default function FilmGrain({
  alpha = 0.12,
  refresh = 3,
}: {
  alpha?: number;
  refresh?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useFx(
    ref,
    (ctx, s) => {
      const tile = document.createElement("canvas");
      tile.width = tile.height = 128;
      const g = tile.getContext("2d");
      const img = g?.createImageData(128, 128);
      let frame = 0;
      return {
        draw: () => {
          if (!g || !img) return;
          if (frame++ % refresh === 0) {
            const d = img.data;
            for (let i = 0; i < d.length; i += 4) {
              const v = Math.random() * 255;
              d[i] = d[i + 1] = d[i + 2] = v;
              d[i + 3] = 255;
            }
            g.putImageData(img, 0, 0);
          }
          ctx.clearRect(0, 0, s.w, s.h);
          const pat = ctx.createPattern(tile, "repeat");
          if (!pat) return;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = pat;
          ctx.fillRect(0, 0, s.w, s.h);
          ctx.globalAlpha = 1;
        },
      };
    },
    [alpha, refresh],
  );
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <figure className="relative aspect-4/3 w-full max-w-sm overflow-hidden rounded-xl bg-linear-to-b from-(--em-sky-500) via-(--em-blue-500) to-(--em-blue-700)">
        <span className="absolute top-[20%] right-[22%] size-14 rounded-full bg-(--em-ink-50)" />
        <figcaption className="absolute inset-x-0 bottom-0 p-5 font-heading text-2xl font-black text-(--em-ink-0)">
          ฟิล์มเก่าริมทะเล
        </figcaption>
        <canvas
          ref={ref}
          aria-hidden
          className="vt-live pointer-events-none absolute inset-0 size-full mix-blend-overlay"
        />
      </figure>
    </div>
  );
}
