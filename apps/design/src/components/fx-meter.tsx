"use client";

import { fxStats } from "@empire/ui";
import { useEffect, useState } from "react";

/** Live readout of the shared fx clock: how smooth it is with everything on screen running. */
export function FxMeter() {
  const [s, setS] = useState<ReturnType<typeof fxStats> | null>(null);
  useEffect(() => {
    const id = setInterval(() => setS(fxStats()), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="font-mono text-xs text-muted-foreground tabular-nums" aria-live="off">
      {s && s.live
        ? `${s.fps} fps · กำลังเล่น ${s.live} จาก ${s.total} · ความละเอียด ${Math.round(s.quality * 100)}%`
        : "fps · รอเอฟเฟคขึ้นจอ"}
    </p>
  );
}
