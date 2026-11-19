import type { ComponentProps, CSSProperties } from "react";
import { cn } from "../lib/cn";

export type OrbitGalleryProps = ComponentProps<"section"> & {
  /** pictures on the ring; they are decoration, so the ring is hidden from screen readers */
  images: readonly string[];
  /** seconds for one full turn */
  seconds?: number;
};

const css = `@keyframes em-orbit{to{transform:rotate(1turn)}}.em-orbit{animation:em-orbit var(--orbit-s) linear infinite}.em-orbit-tile{animation:em-orbit var(--orbit-s) linear infinite reverse}@media (prefers-reduced-motion:reduce){.em-orbit,.em-orbit-tile{animation:none}}`;

/**
 * A ring of pictures turning slowly round a still middle. Each picture turns back the other way at
 * the same speed, so it stays upright the whole way round. CSS only (transform), still under
 * reduced motion, and a soft fade of the page colour keeps the middle readable.
 */
export function OrbitGallery({
  images,
  seconds = 35,
  children,
  className,
  style,
  ...rest
}: OrbitGalleryProps) {
  return (
    <section
      {...rest}
      className={cn("relative isolate overflow-clip bg-background text-foreground", className)}
      style={
        {
          "--orbit-s": `${String(seconds)}s`,
          "--orbit-r": "clamp(12rem, 40vw, 31rem)",
          ...style,
        } as CSSProperties
      }
    >
      <style>{css}</style>
      {/* keyed on the pictures: ring and tiles must start their spins together or the tiles tilt */}
      <div
        key={images.join("|")}
        aria-hidden
        className="em-orbit vt-live absolute top-1/2 left-1/2 -z-20 size-0"
      >
        {images.map((src, i) => {
          const a = (i * 360) / images.length;
          return (
            <div
              key={`${src}-${String(i)}`}
              className="absolute top-0 left-0"
              style={{
                transform: `rotate(${String(a)}deg) translateX(var(--orbit-r)) rotate(${String(-a)}deg) translate(-50%, -50%)`,
              }}
            >
              <div className="em-orbit-tile aspect-video w-32 overflow-clip rounded-lg border border-border bg-muted shadow-lg sm:w-48">
                <img src={src} alt="" draggable={false} className="size-full object-cover" />
              </div>
            </div>
          );
        })}
      </div>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_42%_40%_at_center,var(--background)_45%,transparent)]"
      />
      {children}
    </section>
  );
}
