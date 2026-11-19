"use client";

import { useEffect, useState } from "react";
import { animate, motion } from "framer-motion";
import { Activity, DollarSign, TrendingUp, Users } from "lucide-react";

export interface BentoMetricsGridProps {
  accent?: string;
  duration?: number;
  currency?: string;
  showSparklines?: boolean;
  density?: "compact" | "comfortable";
}

const METRICS = [
  { label: "Revenue", value: 45231.89, money: true, delta: "+20.1%", Icon: DollarSign, points: [4, 6, 5, 8, 7, 10, 12] },
  { label: "Active users", value: 2350, money: false, delta: "+180", Icon: Users, points: [3, 4, 6, 5, 8, 9, 11] },
  { label: "Conversion", value: 12.4, money: false, delta: "+2.4%", Icon: TrendingUp, points: [6, 5, 7, 6, 8, 7, 9] },
  { label: "Uptime", value: 99.98, money: false, delta: "30 days", Icon: Activity, points: [9, 9, 10, 9, 10, 10, 10] },
];

function Counter({ to, duration, prefix, decimals }: { to: number; duration: number; prefix: string; decimals: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const controls = animate(0, to, { duration, ease: "easeOut", onUpdate: setV });
    return () => controls.stop();
  }, [to, duration]);
  return (
    <span className="tabular-nums">
      {prefix}
      {v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const max = Math.max(...points);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * 100},${30 - (p / max) * 26}`).join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-full" aria-hidden>
      <motion.path d={d} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
    </svg>
  );
}

export function BentoMetricsGrid({
  accent = "#10b981",
  duration = 1.6,
  currency = "$",
  showSparklines = true,
  density = "comfortable",
}: BentoMetricsGridProps) {
  const pad = density === "compact" ? "p-3" : "p-5";
  return (
    <div className="grid w-full max-w-2xl grid-cols-2 gap-3 p-4 sm:grid-cols-4">
      {METRICS.map(({ label, value, money, delta, Icon, points }, i) => (
        <motion.div
          key={label}
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`rounded-xl border border-white/10 bg-zinc-900/70 ${pad} ${i === 0 ? "col-span-2" : ""}`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-400">
            {label}
            <Icon className="size-3.5" />
          </div>
          <div className="mt-2 text-xl font-semibold tracking-tight text-white">
            <Counter to={value} duration={duration} prefix={money ? currency : ""} decimals={value % 1 === 0 ? 0 : 2} />
            {label === "Conversion" || label === "Uptime" ? "%" : ""}
          </div>
          <div className="mt-1 text-xs" style={{ color: accent }}>{delta}</div>
          {showSparklines && <Sparkline points={points} color={accent} />}
        </motion.div>
      ))}
    </div>
  );
}

export default BentoMetricsGrid;
