"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// decoration only: its code and first frames stay out of hydration (mobile Total Blocking Time)
const Ambience = dynamic(() => import("@empire/ui").then((ui) => ui.Ambience), { ssr: false });

/** The seasonal sky everywhere except sign-in: particles must never drift over form fields. */
export function Sky() {
  const login = usePathname().startsWith("/login");
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    // shortcut: Safari has no requestIdleCallback, a 1 s timer stands in
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(() => setIdle(true), { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(() => setIdle(true), 1000);
    return () => clearTimeout(id);
  }, []);

  return login || !idle ? null : <Ambience rich />;
}
