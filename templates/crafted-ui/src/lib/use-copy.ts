"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";

/** Copies text and flips `copied` for 1.5s. */
export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const copy = useCallback(async (text: string, key = "default") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API blocked (insecure origin): fall back to a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1500);
  }, []);
  return { copied, copy };
}

const noop = () => () => {};
/** The site's own origin, so CLI commands point at wherever this build is served. */
export function useOrigin() {
  return useSyncExternalStore(noop, () => window.location.origin, () => "https://your-domain.com");
}
