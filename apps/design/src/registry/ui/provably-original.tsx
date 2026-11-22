/*
 * Provably: the hero as given to crocwork.studio (D:/projects/Exclusive/22-11-69/provably.tsx).
 * The demo that came with it, props word for word. Left out: the embedded font file (the site
 * already serves Plus Jakarta Sans) and the cover-capture switch.
 */
"use client";

import { Provably, type ProvablyCredential } from "@empire/ui";

const CREDENTIALS: ProvablyCredential[] = [
  {
    title: "Product Design",
    recipient: "Alex Rivera",
    accent: "#5a4ff0",
    icon: "pen",
    skills: ["User research", "Interaction design", "Prototyping", "Design systems"],
  },
  {
    title: "Data Analysis",
    recipient: "Sam Okafor",
    accent: "#3d6ff0",
    icon: "chart",
    skills: ["SQL", "Data visualisation", "Statistics", "Dashboards"],
  },
  {
    title: "UX Writing",
    recipient: "Mia Chen",
    accent: "#a24ee8",
    icon: "type",
    skills: ["Microcopy", "Voice & tone", "Content testing", "Information architecture"],
  },
];

export default function Part() {
  return (
    <Provably
      brand={{ name: "Provably", href: "#top" }}
      navLinks={[
        { label: "Certifications", href: "#certifications" },
        { label: "For Business", href: "#business" },
        { label: "Resources", href: "#resources" },
      ]}
      navCta={{ label: "Contact us", href: "#contact" }}
      copy={{
        eyebrow: "Certification platform",
        lines: ["We make", "skills"],
        lastWord: "official.",
        subtext:
          "We turn your skills into trusted, shareable credentials that open new opportunities.",
      }}
      links={{
        explore: { label: "Explore Certifications", href: "#certifications" },
        howItWorks: { label: "See how it works", href: "#how-it-works" },
      }}
      toggle={{
        label: "Verify skills",
        hint: { pointer: "Click to verify", touch: "Tap to verify" },
      }}
      stats={{
        value: 125000,
        suffix: "+",
        word: "Skills",
        states: { off: "completed", on: "verified" },
        note: "Across every Provably learner",
      }}
      certificate={{
        kicker: "Certificate",
        type: "Professional Certificate",
        sampleLabel: "Sample Credential",
        demoNote: "Demonstration credential, not an issued certificate",
        recipientLabel: "Awarded to",
        recipientNote: "example recipient",
        status: { on: "Verified", off: "Not Yet Verified" },
        statusDetail: {
          on: "Every skill on this sample has been checked.",
          off: "Switch verification on to see this sample verified.",
        },
        hover: "Inspect credential",
        share: { idle: "Copy share link", done: "Link copied", locked: "Verify to share" },
        tilt: { rest: 9, verified: 4, hover: 0 },
      }}
      credentials={CREDENTIALS}
      statusBadge={{
        off: "READY TO VERIFY",
        on: "OFFICIALLY VERIFIED",
        tail: "TRUSTED CREDENTIALS",
        stampTilt: -6,
        hint: "Inspect seal",
        back: {
          title: "Digital Verification",
          text: "Credentials can be checked for authenticity and shared with confidence.",
          action: "Back",
        },
      }}
      trust={{
        label: "Trusted by leading organizations",
        logos: ["google", "microsoft", "ibm", "aws", "spotify", "adobe"],
      }}
    />
  );
}
