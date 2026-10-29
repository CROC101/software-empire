"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

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
