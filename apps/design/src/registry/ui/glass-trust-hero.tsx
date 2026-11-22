// V.original: the 21st.dev "glassmorphism-trust-hero", kept as written apart from: palette tokens
// instead of zinc / white / yellow / green and the gold hex, a local orbit shot instead of the CDN
// background, and the inline keyframes renamed so they cannot clash with the page.
import {
  ArrowRight,
  Play,
  Target,
  Crown,
  Star,
  // Brand Icons
  Hexagon,
  Triangle,
  Command,
  Ghost,
  Gem,
  Cpu,
} from "lucide-react";

// --- MOCK BRANDS ---
// Replaced PNGs with Lucide icons to simulate tech logos
const CLIENTS = [
  { name: "Acme Corp", icon: Hexagon },
  { name: "Quantum", icon: Triangle },
  { name: "Command+Z", icon: Command },
  { name: "Phantom", icon: Ghost },
  { name: "Ruby", icon: Gem },
  { name: "Chipset", icon: Cpu },
];

// --- SUB-COMPONENTS ---
const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center justify-center transition-transform hover:-translate-y-1 cursor-default">
    <span className="text-xl font-bold text-(--em-ink-0) sm:text-2xl">{value}</span>
    <span className="text-[10px] uppercase tracking-wider text-(--em-ink-500) font-medium sm:text-xs">
      {label}
    </span>
  </div>
);

// --- MAIN COMPONENT ---
export default function GlassTrustHero() {
  return (
    <div className="relative w-full bg-(--em-ink-975) text-(--em-ink-0) overflow-hidden font-sans">
      {/* 
        SCOPED ANIMATIONS 
      */}
      <style>{`
        @keyframes gth-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gth-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .gth-fade {
          animation: gth-in 0.8s ease-out forwards;
          opacity: 0;
        }
        .gth-run {
          animation: gth-marquee 40s linear infinite; /* Slower for readability */
        }
        .gth-d100 { animation-delay: 0.1s; }
        .gth-d200 { animation-delay: 0.2s; }
        .gth-d300 { animation-delay: 0.3s; }
        .gth-d400 { animation-delay: 0.4s; }
        .gth-d500 { animation-delay: 0.5s; }
        @media (prefers-reduced-motion: reduce) { .gth-fade, .gth-run { animation: none; opacity: 1; } }
      `}</style>

      {/* Background Image with Gradient Mask */}
      <div
        className="absolute inset-0 z-0 bg-[url(/orbit/deep-galaxy.webp)] bg-cover bg-center opacity-40"
        style={{
          maskImage: "linear-gradient(180deg, transparent, black 0%, black 70%, transparent)",
          WebkitMaskImage: "linear-gradient(180deg, transparent, black 0%, black 70%, transparent)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 md:pt-32 md:pb-20 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-start">
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-8 pt-8">
            {/* Badge */}
            <div className="gth-fade gth-d100">
              <div className="inline-flex items-center gap-2 rounded-full border border-(--em-ink-0)/10 bg-(--em-ink-0)/5 px-3 py-1.5 backdrop-blur-md transition-colors hover:bg-(--em-ink-0)/10">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-(--em-ink-300) flex items-center gap-2">
                  Award-Winning Design
                  <Star className="w-3.5 h-3.5 text-(--em-gold-300) fill-(--em-gold-300)" />
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1
              className="gth-fade gth-d200 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-medium tracking-tighter leading-[0.9]"
              style={{
                maskImage: "linear-gradient(180deg, black 0%, black 80%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(180deg, black 0%, black 80%, transparent 100%)",
              }}
            >
              Crafting Digital
              <br />
              <span className="bg-gradient-to-br from-(--em-ink-0) via-(--em-ink-0) to-(--em-gold-300) bg-clip-text text-transparent">
                Experiences
              </span>
              <br />
              That Matter
            </h1>

            {/* Description */}
            <p className="gth-fade gth-d300 max-w-xl text-lg text-(--em-ink-400) leading-relaxed">
              We design interfaces that combine beauty with functionality, creating seamless
              experiences that users love and businesses thrive on.
            </p>

            {/* CTA Buttons */}
            <div className="gth-fade gth-d400 flex flex-col sm:flex-row gap-4">
              <button className="group inline-flex items-center justify-center gap-2 rounded-full bg-(--em-ink-0) px-8 py-4 text-sm font-semibold text-(--em-ink-975) transition-all hover:scale-[1.02] hover:bg-(--em-ink-200) active:scale-[0.98]">
                View Portfolio
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button className="group inline-flex items-center justify-center gap-2 rounded-full border border-(--em-ink-0)/10 bg-(--em-ink-0)/5 px-8 py-4 text-sm font-semibold text-(--em-ink-0) backdrop-blur-sm transition-colors hover:bg-(--em-ink-0)/10 hover:border-(--em-ink-0)/20">
                <Play className="w-4 h-4 fill-current" />
                Watch Showreel
              </button>
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="lg:col-span-5 space-y-6 lg:mt-12">
            {/* Stats Card */}
            <div className="gth-fade gth-d500 relative overflow-hidden rounded-3xl border border-(--em-ink-0)/10 bg-(--em-ink-0)/5 p-8 backdrop-blur-xl shadow-2xl">
              {/* Card Glow Effect */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-(--em-ink-0)/5 blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--em-ink-0)/10 ring-1 ring-(--em-ink-0)/20">
                    <Target className="h-6 w-6 text-(--em-ink-0)" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tight text-(--em-ink-0)">150+</div>
                    <div className="text-sm text-(--em-ink-400)">Projects Delivered</div>
                  </div>
                </div>

                {/* Progress Bar Section */}
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-(--em-ink-400)">Client Satisfaction</span>
                    <span className="text-(--em-ink-0) font-medium">98%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-(--em-ink-800)/50">
                    <div className="h-full w-[98%] rounded-full bg-gradient-to-r from-(--em-ink-0) to-(--em-ink-400)" />
                  </div>
                </div>

                <div className="h-px w-full bg-(--em-ink-0)/10 mb-6" />

                {/* Mini Stats Grid */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <StatItem value="5+" label="Years" />
                  <div className="w-px h-full bg-(--em-ink-0)/10 mx-auto" />
                  <StatItem value="24/7" label="Support" />
                  <div className="w-px h-full bg-(--em-ink-0)/10 mx-auto" />
                  <StatItem value="100%" label="Quality" />
                </div>

                {/* Tag Pills */}
                <div className="mt-8 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-(--em-ink-0)/10 bg-(--em-ink-0)/5 px-3 py-1 text-[10px] font-medium tracking-wide text-(--em-ink-300)">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--em-success) opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-(--em-success-dark)"></span>
                    </span>
                    ACTIVE
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-(--em-ink-0)/10 bg-(--em-ink-0)/5 px-3 py-1 text-[10px] font-medium tracking-wide text-(--em-ink-300)">
                    <Crown className="w-3 h-3 text-(--em-gold-500)" />
                    PREMIUM
                  </div>
                </div>
              </div>
            </div>

            {/* Marquee Card */}
            <div className="gth-fade gth-d500 relative overflow-hidden rounded-3xl border border-(--em-ink-0)/10 bg-(--em-ink-0)/5 py-8 backdrop-blur-xl">
              <h3 className="mb-6 px-8 text-sm font-medium text-(--em-ink-400)">
                Trusted by Industry Leaders
              </h3>

              <div
                className="relative flex overflow-hidden"
                style={{
                  maskImage:
                    "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
                }}
              >
                <div className="gth-run flex gap-12 whitespace-nowrap px-4">
                  {/* Triple list for seamless loop */}
                  {[...CLIENTS, ...CLIENTS, ...CLIENTS].map((client, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 opacity-50 transition-all hover:opacity-100 hover:scale-105 cursor-default grayscale hover:grayscale-0"
                    >
                      {/* Brand Icon */}
                      <client.icon className="h-6 w-6 text-(--em-ink-0) fill-current" />
                      {/* Brand Name */}
                      <span className="text-lg font-bold text-(--em-ink-0) tracking-tight">
                        {client.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
