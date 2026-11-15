"use client";

import { startBeacon } from "@empire/core/presence";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

/** Signed-in hub pages: log each page and keep the "online" heartbeat (hub.visits / hub.online). */
export function Beacon() {
  const path = usePathname();
  const beacon = useRef<ReturnType<typeof startBeacon> | null>(null);
  useEffect(() => {
    beacon.current = startBeacon(createBrowserClient(), "hub");
    return () => beacon.current?.stop();
  }, []);
  useEffect(() => beacon.current?.page(path), [path]);
  return null;
}
