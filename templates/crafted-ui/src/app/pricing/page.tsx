import type { Metadata } from "next";
import { Pricing } from "@/components/pricing/pricing";
import { Faq } from "@/components/home/sections";
import { Footer } from "@/components/site/footer";
import { BRAND } from "@/components/site/logo";

export const metadata: Metadata = { title: `Pricing | ${BRAND}` };

const FAQ = [
  ["What do I get for free?", "Browse the whole library, copy 2 components a day at no cost, and try AI with 5 credits. Paid plans have no limit on copies."],
  ["What is an AI credit?", "One credit is one generation or edit of any component, from a button to ASCII art. Each plan uses a monthly allowance; then you can top up. A large page was about 17 credits."],
  ["How do Team seats work?", "Pick 2 to 50 seats. Each seat gets every Builder + AI feature and the credits are pooled."],
  ["Can I cancel anytime?", "Yes. You keep access until the end of the period you paid for."],
  ["Can I switch plans later?", "Yes, upgrades apply right away and downgrades at the next renewal."],
  ["Does it work with my AI tools?", "Yes. Every component ships with a prompt, a CLI command and an MCP entry."],
];

export default function PricingPage() {
  return (
    <>
      <main className="mx-auto max-w-6xl">
        <Pricing />
        <Faq title="Questions about plans" items={FAQ} className="pb-[72px] md:pb-[72px] lg:pb-[115px]" />
      </main>
      <Footer />
    </>
  );
}
