import { cn } from "../lib/cn";

/**
 * A subsystem's tile artwork. Both theme versions ship and the theme class on <html> (set by
 * theme-boot.js from the em-theme cookie) shows one, so it swaps with the toggle and never flashes.
 * `base` = the hub's logo folder plus the slug, e.g. "/logos/tarot" or "https://hub…/logos/tarot".
 */
export function SubsystemLogo({ base, className }: { base: string; className?: string }) {
  return (
    <>
      {(["light", "dark"] as const).map((tone) => (
        <img
          key={tone}
          src={`${base}-${tone}.webp`}
          alt=""
          width={256}
          height={256}
          loading="lazy"
          decoding="async"
          draggable={false}
          className={cn(`em-logo-${tone}`, className)}
        />
      ))}
    </>
  );
}
