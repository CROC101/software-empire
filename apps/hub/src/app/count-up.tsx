"use client";

import { useEffect, useState } from "react";

/** Ticks from 0 to `to` once on load; shows the final number straight away for reduced motion. */
export function CountUp({ to, ms = 1200 }: { to: number; ms?: number }) {
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / ms);
      setValue(Math.round(to * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [to, ms]);

  // server HTML carries the real number, so no-JS and crawlers never see 0
  return <span className="tabular-nums">{value.toLocaleString("th-TH")}</span>;
}
