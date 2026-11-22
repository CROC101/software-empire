import { CurvedLens } from "@empire/ui";
import { appUrl } from "@/lib/apps";
import { subsystems } from "@/lib/subsystems";

// subsystems that have a phone screenshot in public/previews/m-<slug>.webp (780 × 1688, sharp at 2x)
const PHONE = ["community", "commerce", "tarot", "canva", "design", "toolboxes", "stream"];

/** Section 2: the subsystems on phones, seen through a curved lens; the centred card opens the app. */
export function LensSection() {
  const slides = PHONE.flatMap((slug) => {
    const s = subsystems.find((x) => x.slug === slug);
    return s
      ? [{ title: s.name, kicker: slug, image: `/previews/m-${slug}.webp`, href: appUrl(slug) }]
      : [];
  });
  return (
    <section id="lens" aria-label="ระบบย่อยบนมือถือ" className="h-[min(48rem,100svh)]">
      <CurvedLens slides={slides} label="Subsystems · on a phone" name="ระบบย่อยบนมือถือ" />
    </section>
  );
}
