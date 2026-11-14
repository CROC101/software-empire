import { cn } from "@empire/ui";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router";

export type DockItem = { to: string; label: string; icon: LucideIcon; active?: boolean };

const MotionLink = motion.create(Link);

/**
 * Floating glass dock (after dock-two on 21st.dev, rebuilt on motion/react and our tokens):
 * the bar bobs slowly, each button lifts on hover and dips on tap.
 */
export function Dock({ items, className }: { items: DockItem[]; className?: string }) {
  const still = useReducedMotion() ?? false;
  return (
    <motion.nav
      aria-label="เมนูลัด"
      // the slow swell: 2px up and down, never on reduced motion
      animate={still ? undefined : { y: [-2, 2, -2] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className={cn(
        "vt-live flex items-center gap-1 rounded-xl border border-border bg-background/90 p-1.5 shadow-lg backdrop-blur-lg",
        className,
      )}
    >
      {items.map(({ to, label, icon: Icon, active }) => (
        <MotionLink
          key={to}
          to={to}
          aria-current={active ? "page" : undefined}
          whileHover={still ? undefined : { scale: 1.1, y: -2 }}
          whileTap={still ? undefined : { scale: 0.95 }}
          className={cn(
            "flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[11px] hover:bg-muted",
            active ? "bg-muted font-semibold text-foreground" : "text-muted-foreground",
          )}
        >
          <Icon aria-hidden className="size-5" />
          {label}
        </MotionLink>
      ))}
    </motion.nav>
  );
}
