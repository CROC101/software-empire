import { CurvedLens } from "@empire/ui";
import { appUrl } from "@/lib/apps";
import { subsystems } from "@/lib/subsystems";

// subsystem logo art, 4:5 cut from the 2048px masters (public/lens/<slug>.webp, ~1219 × 1524)
const LOGOS = [
  "community",
  "commerce",
  "tarot",
  "canva",
  "design",
  "toolboxes",
  "stream",
  "crocbyte",
];

/** Section 2: the subsystem logos, seen through a curved lens; the centred card opens the app. */
export function LensSection() {
  const slides = LOGOS.flatMap((slug) => {
    const s = subsystems.find((x) => x.slug === slug);
    return s
      ? [{ title: s.name, kicker: slug, image: `/lens/${slug}.webp`, href: appUrl(slug) }]
      : [];
  });
  return (
    <section id="lens" aria-label="ระบบย่อย" className="h-[min(48rem,100svh)]">
      <CurvedLens slides={slides} label="Subsystems" name="ระบบย่อย" />
    </section>
  );
}
