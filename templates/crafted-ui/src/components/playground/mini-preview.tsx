"use client";

import { useEffect, useRef, useState } from "react";
import type { RegistryComponent } from "@/types/registry";
import { defaultProps } from "@/data/components-registry";
import { cn } from "@/lib/utils";

/** Renders a registry component live at a fixed design width, scaled down to fit its frame. */
export function MiniPreview({ component, designWidth = 640, className }: { component: RegistryComponent; designWidth?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = box.w ? box.w / designWidth : 0;
  const { Component } = component;
  return (
    <div ref={ref} aria-hidden inert className={cn("relative overflow-hidden", component.canvas === "light" ? "bg-[#fafafa]" : "bg-[#09090b]", className)}>
      {scale > 0 && (
        <div
          className="absolute left-0 top-0 flex items-center justify-center"
          style={{ width: designWidth, height: box.h / scale, transform: `scale(${scale})`, transformOrigin: "0 0" }}
        >
          <Component {...defaultProps(component)} />
        </div>
      )}
    </div>
  );
}
