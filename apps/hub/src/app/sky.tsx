"use client";

import { Ambience } from "@empire/ui";
import { usePathname } from "next/navigation";

/** The seasonal sky everywhere except sign-in: particles must never drift over form fields. */
export function Sky() {
  return usePathname().startsWith("/login") ? null : <Ambience rich />;
}
