"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const QUERY = "(min-width: 1024px)";

const subscribe = (onChange: () => void) => {
  const media = matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

/**
 * Mounts its children only on screens wide enough to show the brand panel. CSS `hidden` would
 * still run their animation loops (WebGL, 72 tracing paths) on phones, warming them for nothing.
 */
export function DesktopOnly({ children }: { children: ReactNode }) {
  const wide = useSyncExternalStore(
    subscribe,
    () => matchMedia(QUERY).matches,
    () => false,
  );
  return wide ? children : null;
}
