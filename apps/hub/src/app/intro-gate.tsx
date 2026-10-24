"use client";

import "@fontsource/fleur-de-leah/400.css";
import "@fontsource/caveat/500.css";
import { SkeletonKeyPreloader, useTokenColors } from "@empire/ui";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const SEEN = "em-intro-seen"; // same flag as public/intro-boot.js

// the boot script decides once, before paint; the server never shows the intro
const noSubscribe = () => () => {};
const bootSaysIntro = () => document.documentElement.classList.contains("em-intro");
const serverSaysNo = () => false;

/**
 * The first-visit intro. public/intro-boot.js puts `em-intro` on <html> before paint (home page,
 * first visit this session or ?intro, motion allowed); until this mounts, `.intro-cover` holds the
 * screen so the page never flashes. Skip with the button or Escape; the flag is set either way.
 */
export function IntroGate() {
  const wanted = useSyncExternalStore(noSubscribe, bootSaysIntro, serverSaysNo);
  const [finished, setFinished] = useState(false);
  const live = wanted && !finished;
  const colors = useTokenColors(["--em-ink-975", "--em-ink-0"]);

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(SEEN, "1");
    } catch {
      // storage blocked: the intro may show again next visit, nothing breaks
    }
    document.documentElement.classList.remove("em-intro");
    const url = new URL(window.location.href);
    if (url.searchParams.has("intro")) {
      url.searchParams.delete("intro");
      window.history.replaceState(null, "", url);
    }
    setFinished(true);
  }, []);

  useEffect(() => {
    if (!live) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [live, finish]);

  const [paper, ink] = colors ?? [];
  if (!live || !paper || !ink) return <div aria-hidden className="intro-cover" />;

  return (
    <div className="intro-layer">
      <SkeletonKeyPreloader
        greeting="welcome to"
        word="crocwork"
        tags={["#crocwork", "#solo", "#design", "#code"]}
        name="crocwork.studio"
        about={["software studio", "building systems", "that ship."]}
        links={["crocwork.studio", "github.com/CROC101"]}
        signature="crocwork"
        release="1.0"
        metal="gold"
        paper={paper}
        ink={ink}
        durationMs={3400}
        faces={{
          grotesk: "var(--font-heading)",
          script: '"Fleur De Leah", cursive',
          hand: "Caveat, cursive",
          mono: "ui-monospace, Menlo, Consolas, monospace",
        }}
        onComplete={finish}
      />
      <button type="button" className="intro-skip" onClick={finish}>
        ข้าม
      </button>
    </div>
  );
}
