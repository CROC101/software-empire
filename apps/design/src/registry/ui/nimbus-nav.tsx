"use client";

import { NimbusNavbar, useTokenColors, type NimbusNavItem } from "@empire/ui";
import { Briefcase, HelpCircle, LayoutGrid, UserRound, Workflow } from "lucide-react";
import { useSyncExternalStore } from "react";

const items: NimbusNavItem[] = [
  { label: "เกี่ยวกับ", icon: <UserRound aria-hidden />, fx: "wave" },
  { label: "ผลงาน", icon: <LayoutGrid aria-hidden />, fx: "spin" },
  { label: "บริการ", icon: <Briefcase aria-hidden />, fx: "pop" },
  { label: "ขั้นตอน", icon: <Workflow aria-hidden />, fx: "glow" },
  { label: "คำถาม", icon: <HelpCircle aria-hidden />, fx: "drop" },
];

const narrow = "(max-width: 639px)";
const subscribe = (cb: () => void) => {
  const m = matchMedia(narrow);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/** A pill nav where a drop of water slides to the picked link and each icon plays its own little scene. */
export default function NimbusNav({ compact = false }: { compact?: boolean }) {
  const bg = useTokenColors(["--background"])?.[0];
  const tone = bg && parseInt(bg.slice(1, 3), 16) < 128 ? "dark" : "light";
  // five labels never fit across a phone, so the bar shows icons only there
  const phone = useSyncExternalStore(
    subscribe,
    () => matchMedia(narrow).matches,
    () => false,
  );
  return (
    <div className="grid size-full min-h-56 place-items-center bg-background p-6">
      <NimbusNavbar
        label="ส่วนต่าง ๆ ของหน้า"
        items={items}
        compact={compact || phone}
        tone={tone}
      />
    </div>
  );
}
