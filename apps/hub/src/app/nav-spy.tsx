"use client";

import { ArrowUp } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

/** Header links; the underline glides (spring) to whichever section is on screen. */
export function NavSpy({ items }: { items: readonly { href: string; label: string }[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(`#${e.target.id}`);
      },
      // current = the section crossing the band 35–45% down the screen
      { rootMargin: "-35% 0px -55% 0px" },
    );
    for (const { href } of items) {
      const el = document.getElementById(href.slice(1));
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [items]);

  return (
    <ul className="hidden items-center gap-6 lg:flex">
      {items.map((item) => (
        <li key={item.href} className="relative">
          <a
            href={item.href}
            aria-current={active === item.href ? "location" : undefined}
            className={`block py-1 text-sm transition-colors duration-300 ${
              active === item.href
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </a>
          {active === item.href && (
            <motion.span
              layoutId="nav-underline"
              className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-[var(--em-blue-600)]"
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

/** Round button bottom-right, shown once the hero has scrolled away. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const top = document.getElementById("top");
    if (!top) return;
    const io = new IntersectionObserver(([e]) => setShow(!e?.isIntersecting), {
      rootMargin: "400px 0px 0px 0px",
    });
    io.observe(top);
    return () => io.disconnect();
  }, []);
  return (
    <a
      href="#top"
      aria-label="กลับขึ้นด้านบน"
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      className={`vt-top cw-btn-blue fixed bottom-6 right-6 z-40 grid size-12 place-items-center shadow-lg transition-[opacity,transform] duration-500 ${
        show ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp aria-hidden className="size-5" />
    </a>
  );
}
