"use client";

import {
  Clapperboard,
  Home,
  LayoutGrid,
  MessageCircle,
  Palette,
  ShoppingBag,
  Sparkles,
  Wrench,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, useState } from "react";

const items = [
  { label: "Hub", Icon: Home },
  { label: "Community", Icon: MessageCircle },
  { label: "Commerce", Icon: ShoppingBag },
  { label: "Toolboxes", Icon: Wrench },
  { label: "Tarot", Icon: Sparkles },
  { label: "Design", Icon: LayoutGrid },
  { label: "Canva", Icon: Palette },
  { label: "Stream", Icon: Clapperboard },
];

const BASE = 44;

function DockIcon({
  label,
  Icon,
  pointer,
  magnify,
  distance,
  labels,
}: (typeof items)[number] & {
  pointer: MotionValue<number>;
  magnify: number;
  distance: number;
  labels: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const gap = useTransform(pointer, (x) => {
    const r = ref.current?.getBoundingClientRect();
    return r ? x - (r.left + r.width / 2) : Infinity;
  });
  const scale = useSpring(useTransform(gap, [-distance, 0, distance], [1, magnify, 1]), {
    stiffness: 260,
    damping: 18,
  });
  // grow upward from the dock floor: lift by half of the extra height
  const y = useTransform(scale, (s) => (-(s - 1) * BASE) / 2);

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      style={{ scale, y, width: BASE, height: BASE }}
      className="relative flex shrink-0 items-center justify-center rounded-lg border border-(--em-ink-800) bg-(--em-ink-900) text-(--em-ink-100) outline-offset-2 focus-visible:outline-2 focus-visible:outline-(--em-blue-400)"
    >
      <Icon aria-hidden className="size-5" />
      <AnimatePresence>
        {labels && open && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-md border border-(--em-ink-800) bg-(--em-ink-950) px-2 py-0.5 text-[10px] whitespace-nowrap text-(--em-ink-100)"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/** Icons scale by their distance to the pointer (transform, never width); labels rise above. */
export function Dock({
  magnify = 1.6,
  distance = 140,
  labels = true,
}: {
  magnify?: number;
  distance?: number;
  labels?: boolean;
}) {
  const pointer = useMotionValue(Infinity);
  return (
    <div className="flex size-full min-h-48 items-end justify-center overflow-hidden bg-(--em-ink-975) px-4 pt-16 pb-8">
      <nav
        aria-label="ระบบในเครือ"
        onPointerMove={(e) => pointer.set(e.clientX)}
        onPointerLeave={() => pointer.set(Infinity)}
        className="flex max-w-full items-end gap-2 overflow-x-auto rounded-xl border border-(--em-ink-800) bg-(--em-ink-950)/80 p-2 [scrollbar-width:none]"
      >
        {items.map((it) => (
          <DockIcon
            key={it.label}
            {...it}
            pointer={pointer}
            magnify={magnify}
            distance={distance}
            labels={labels}
          />
        ))}
      </nav>
    </div>
  );
}
