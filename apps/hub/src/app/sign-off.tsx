"use client";

import { GlassIconReveal, ParticleTitle, useTokenColors } from "@empire/ui";

/**
 * The page's sign-off, between the contact band and the footer: a glass droplet lands, bends the
 * S-wave mark into colour at its rim, then lets go and leaves the logo. Plays once on arrival;
 * click it to play again. The canvas paints the page background, so it follows the theme.
 */
export function SignOff() {
  const colors = useTokenColors(["--background"]);
  const bg = colors?.[0];
  const dark = bg ? parseInt(bg.slice(1, 3), 16) < 128 : false;
  return (
    <section aria-label="crocwork.studio" className="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6">
      {bg && (
        <GlassIconReveal
          logo="/crocwork-logo.webp"
          label="โลโก้ crocwork.studio กดเพื่อเล่นอีกครั้ง"
          look={dark ? "dark" : "light"}
          background={bg}
          plateColor={bg}
          originalColors
          tileSize={220}
          finalScale={0.95}
          className="mx-auto h-[22rem] w-full max-w-xl sm:h-[26rem]"
        />
      )}
      {/* the line under the mark: dissolves into dust in the glow and gathers back */}
      <ParticleTitle text="ทำคนเดียว ตั้งใจทุกชิ้น" className="-mt-16 sm:-mt-20" />
      <p className="-mt-10 text-center font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
        crocwork.studio · since 2569
      </p>
    </section>
  );
}
