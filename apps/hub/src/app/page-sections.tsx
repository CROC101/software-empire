import type { ReactNode } from "react";
import { subsystems } from "@/lib/subsystems";
import { getContent, HUB_HOME, HUB_SUBSYSTEMS } from "@/lib/cms";
import { Stage } from "./stage";
import { ActivitySkyline } from "./activity-skyline";
import { WhereSection } from "./where-section";
import { CodebaseHexes } from "./codebase-hexes";
import { PocketSection } from "./pocket-section";
import { Wardrobe } from "./wardrobe";
import {
  AboutSection,
  ContactSection,
  FaqSection,
  HowSection,
  LaptopSection,
  ServicesSection,
  ShotsSection,
  SkillsSection,
  StatusSection,
  TeamSection,
  WorkSection,
} from "./sections";
import { StackCard } from "./stack-card";
import { headerCta } from "./site-shell";

/** Which CMS sections live on which page. Order inside a page still comes from /admin. */
export const PAGE_SECTIONS = {
  home: ["status", "work", "contact"],
  work: ["work", "shots", "laptop", "pocket", "codebase"],
  services: ["services", "how", "faq", "contact"],
  about: ["about", "team", "skills", "wardrobe", "activity", "where"],
} as const;

/** The page's sections in the owner's order, hidden ones left out. */
export async function PageSections({ page }: { page: keyof typeof PAGE_SECTIONS }) {
  const [home, cards, cta] = await Promise.all([
    getContent(HUB_HOME),
    getContent(HUB_SUBSYSTEMS),
    headerCta(),
  ]);
  const summaries = Object.fromEntries(
    subsystems.map((x) => [x.slug, cards.text(`${x.slug}.summary`)]),
  );
  const build: Record<string, () => ReactNode> = {
    status: () => (
      <StatusSection
        title1={home.text("status.title1")}
        title2={home.text("status.title2")}
        intro={home.text("status.intro")}
        rounds={home.number("status.rounds")}
      />
    ),
    about: () => <AboutSection />,
    work: () => <WorkSection summaries={summaries} />,
    shots: () => <ShotsSection summaries={summaries} />,
    laptop: () => <LaptopSection />,
    pocket: () => <PocketSection />,
    skills: () => <SkillsSection />,
    activity: () => <ActivitySkyline />,
    codebase: () => <CodebaseHexes />,
    services: () => <ServicesSection aside={<StackCard href="/work#subsystems" />} />,
    how: () => <HowSection />,
    team: () => <TeamSection />,
    wardrobe: () => <Wardrobe />,
    faq: () => <FaqSection />,
    where: () => <WhereSection />,
    contact: () => <ContactSection cta={cta} />,
  };
  const keys: readonly string[] = PAGE_SECTIONS[page];
  return home
    .sections()
    .filter((x) => x.visible && keys.includes(x.key))
    .map((x) => <Stage key={x.key}>{build[x.key]?.()}</Stage>);
}
