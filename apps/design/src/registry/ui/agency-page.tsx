import BlogCards from "./blog-cards";
import CtaTide from "./cta-tide";
import FeaturesGrid from "./features-grid";
import FooterColumns from "./footer-columns";
import HeaderMega from "./header-mega";
import HeroSplit from "./hero-split";
import TeamGrid from "./team-grid";

/** An agency site: big menu, services, team, latest posts and a closing call to talk. */
export default function AgencyPage() {
  return (
    <div className="bg-background text-foreground">
      <HeaderMega />
      <HeroSplit title="ทีมเล็กที่ส่งงานใหญ่" accent="ตรงเวลา" cta="คุยกับเรา" />
      <FeaturesGrid title="บริการของเรา" />
      <TeamGrid />
      <BlogCards />
      <CtaTide />
      <FooterColumns />
    </div>
  );
}
