import { Hero } from "@/components/home/hero";
import { BuiltFor, Cta, Faq, MoreThan, OtherTools, UsedBy } from "@/components/home/sections";
import { Footer } from "@/components/site/footer";

export default function Page() {
  return (
    <>
      <main className="mx-auto max-w-6xl">
        <Hero>
          <UsedBy />
        </Hero>
        <MoreThan />
        <BuiltFor />
        <OtherTools />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
