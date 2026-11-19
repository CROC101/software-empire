import CtaTide from "./cta-tide";
import FaqAccordion from "./faq-accordion";
import FeaturesBento from "./features-bento";
import FooterColumns from "./footer-columns";
import HeaderGlass from "./header-glass";
import HeroSplit from "./hero-split";
import LogoCloud from "./logo-cloud";
import PricingTiers from "./pricing-tiers";
import StatsBand from "./stats-band";
import TestimonialsWall from "./testimonials-wall";

/** A whole software landing page: ten blocks stacked in the order a buyer reads them. */
export default function SaasLanding() {
  return (
    <div className="bg-background text-foreground">
      <HeaderGlass demo={false} />
      <HeroSplit />
      <LogoCloud />
      <FeaturesBento />
      <StatsBand />
      <TestimonialsWall />
      <PricingTiers />
      <FaqAccordion />
      <CtaTide />
      <FooterColumns />
    </div>
  );
}
