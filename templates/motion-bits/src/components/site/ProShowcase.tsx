"use client";

import AuroraWavesBg from "@/components/reactbits/AuroraWavesBg";
import ParticlesConstellationBg from "@/components/reactbits/ParticlesConstellationBg";
import ShinyMetallicText from "@/components/reactbits/ShinyMetallicText";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { id: "components", label: "Components" },
  { id: "blocks", label: "Blocks" },
  { id: "app-ui", label: "App UI" },
  { id: "templates", label: "Templates" },
  { id: "agent-kit", label: "Agent Kit" },
];

function Mock({ rows = 3, title }: { rows?: number; title: string }) {
  return (
    <div className="relative z-10 w-[min(560px,90%)] rounded-xl border border-white/10 bg-[#0b090e]/85 p-5 shadow-float backdrop-blur">
      <p className="text-[15px] font-medium text-white">{title}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {Array.from({ length: rows * 3 }, (_, i) => (
          <div key={i} className="h-10 rounded-md bg-white/[0.05]" style={{ opacity: 1 - i * 0.06 }} />
        ))}
      </div>
    </div>
  );
}

export default function ProShowcase() {
  return (
    <Tabs defaultValue="components" className="mt-14 items-center gap-6 max-lg:mt-8">
      <div className="card-shell w-full">
        {TABS.map((t) => (
          <TabsContent key={t.id} value={t.id} className="relative flex h-[440px] items-center justify-center overflow-hidden rounded-[11px] max-lg:h-[200px]">
            {t.id === "components" && (
              <>
                <div className="absolute inset-0">
                  <AuroraWavesBg colorA="#312e81" colorB="#7c3aed" colorC="#c4b5fd" baseColor="#0b090e" />
                </div>
                <div className="relative">
                  <ShinyMetallicText text="Glowing Ridges" fontSize={56} />
                </div>
              </>
            )}
            {t.id === "blocks" && <Mock title="Pricing section · 3 tiers" />}
            {t.id === "app-ui" && <Mock title="Analytics dashboard" rows={4} />}
            {t.id === "templates" && <Mock title="Portfolio template · 6 pages" rows={2} />}
            {t.id === "agent-kit" && (
              <>
                <div className="absolute inset-0">
                  <ParticlesConstellationBg particleCount={70} />
                </div>
                <pre className="relative rounded-xl border border-white/10 bg-[#0b090e]/85 p-5 font-mono text-[12.5px] leading-[1.8] text-white/75">
                  {"> build a launch page that feels designed\n✓ loaded skill: dark-studio\n✓ composed hero, features, pricing"}
                </pre>
              </>
            )}
          </TabsContent>
        ))}
      </div>
      <TabsList className="h-10 flex-wrap justify-center gap-1 bg-transparent p-0 max-sm:h-auto">
        {TABS.map((t) => (
          <TabsTrigger
            key={t.id}
            value={t.id}
            className="h-9 flex-none rounded-[10px] px-4 text-[13.5px] text-white/55 data-active:bg-white/[0.08] data-active:text-white dark:data-active:border-transparent dark:data-active:bg-white/[0.08]"
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
