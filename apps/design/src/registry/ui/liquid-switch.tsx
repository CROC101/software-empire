"use client";

import { LiquidToggle, NimbusToggleIcons, useTokenColors } from "@empire/ui";

/** A toggle whose knob is a drop of water: it stretches, snaps and ripples. The water follows the theme. */
export default function LiquidSwitch({
  size = 36,
  sound = false,
}: {
  size?: number;
  sound?: boolean;
}) {
  const bg = useTokenColors(["--background"])?.[0];
  const tone = bg && parseInt(bg.slice(1, 3), 16) < 128 ? "dark" : "light";
  return (
    <div className="grid size-full min-h-56 place-items-center bg-background p-6 text-foreground">
      <div className="flex flex-wrap items-center justify-center gap-8">
        <LiquidToggle
          label="โหมดมืด"
          size={size}
          sound={sound}
          tone={tone}
          icons={{ off: NimbusToggleIcons.sun, on: NimbusToggleIcons.moon }}
        />
        <LiquidToggle label="แจ้งเตือน" size={size} sound={sound} tone={tone} defaultChecked />
      </div>
    </div>
  );
}
