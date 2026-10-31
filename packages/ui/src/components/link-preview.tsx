"use client";

import * as HoverCard from "@radix-ui/react-hover-card";
import { useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { cn } from "../lib/cn";

/**
 * Link that pops a screenshot card on hover, leaning toward the cursor.
 * Static images only: no third-party screenshot API ever sees our URLs (and it couldn't
 * reach a local or private app anyway). Keyboard focus opens it too; touch just follows the link.
 */
export function LinkPreview({
  href,
  imageSrc,
  children,
  className,
  width = 240,
  height = 150,
}: {
  href: string;
  /** a same-site screenshot, e.g. /previews/community.webp */
  imageSrc: string;
  children: ReactNode;
  className?: string;
  width?: number;
  height?: number;
}) {
  const [open, setOpen] = useState(false);
  const x = useMotionValue(0);
  const lean = useSpring(x, { stiffness: 100, damping: 15 });

  const follow = (event: MouseEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) / 2);
  };

  return (
    <HoverCard.Root openDelay={50} closeDelay={100} onOpenChange={setOpen}>
      <HoverCard.Trigger asChild>
        <a
          href={href}
          onMouseMove={follow}
          className={cn("font-bold underline-offset-4 hover:underline", className)}
        >
          {children}
        </a>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content side="top" align="center" sideOffset={10} className="z-50">
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: "spring", stiffness: 260, damping: 20 },
                }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                style={{ x: lean }}
                className="rounded-xl shadow-xl"
              >
                <a
                  href={href}
                  tabIndex={-1}
                  className="block rounded-xl border-2 border-transparent bg-card p-1 hover:border-border"
                >
                  <img
                    src={imageSrc}
                    width={width}
                    height={height}
                    alt=""
                    loading="lazy"
                    className="rounded-lg object-cover object-top"
                    style={{ width, height }}
                  />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
