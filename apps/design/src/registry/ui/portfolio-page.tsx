import ContactSplit from "./contact-split";
import FeaturesAlternating from "./features-alternating";
import FooterColumns from "./footer-columns";
import HeaderGlass from "./header-glass";
import HeroCentered from "./hero-centered";
import StepsTimeline from "./steps-timeline";
import TestimonialsWall from "./testimonials-wall";

/** A freelancer portfolio: intro, work, how we work, reviews and a contact form. */
export default function PortfolioPage() {
  return (
    <div className="bg-background text-foreground">
      <HeaderGlass demo={false} />
      <HeroCentered title="ออกแบบและสร้างเว็บที่ใช้งานได้จริง" cta="ดูผลงาน" />
      <FeaturesAlternating />
      <StepsTimeline />
      <TestimonialsWall />
      <ContactSplit />
      <FooterColumns />
    </div>
  );
}
