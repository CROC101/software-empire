import FaqAccordion from "./faq-accordion";
import FooterColumns from "./footer-columns";
import HeroTerminal from "./hero-terminal";
import NewsletterBox from "./newsletter-box";
import PricingCompare from "./pricing-compare";
import StatsBand from "./stats-band";

/** A product launch page: terminal hero, numbers, waitlist, plan table and FAQ. */
export default function LaunchPage() {
  return (
    <div className="bg-background text-foreground">
      <HeroTerminal />
      <StatsBand />
      <NewsletterBox />
      <PricingCompare />
      <FaqAccordion />
      <FooterColumns />
    </div>
  );
}
