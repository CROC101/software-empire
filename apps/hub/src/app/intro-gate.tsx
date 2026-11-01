"use client";

import { DitherVeil, useTokenColors } from "@empire/ui";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const SEEN = "em-intro-seen"; // same flag as public/intro-boot.js
/** the logo knits in from dots (1.1 s), shimmers, then the scene opens into the hub */
const HOLD_MS = 2600;
const EXIT_MS = 900;

// the boot script decides once, before paint; the server never shows the intro
const noSubscribe = () => () => {};
const bootSaysIntro = () => document.documentElement.classList.contains("em-intro");
const serverSaysNo = () => false;

/**
 * The first-visit intro: the crocwork mark in 1-bit dither on ink, a window of real colour
 * drifting across it (a glint on the chrome), then the whole scene flies past the camera into the
 * hub (transform and opacity only, so it holds the screen's frame rate). public/intro-boot.js puts
 * `em-intro` on <html> before paint (home page, first visit this session or ?intro, motion
 * allowed); until this mounts, `.intro-cover` holds the screen. Skip with the button or Escape.
 */
export function IntroGate() {
  const wanted = useSyncExternalStore(noSubscribe, bootSaysIntro, serverSaysNo);
  const [finished, setFinished] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const live = wanted && !finished;
  const colors = useTokenColors(["--em-ink-975", "--em-ink-0", "--em-blue-500"]);

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
    if (!live || !colors) return;
    const out = window.setTimeout(() => setLeaving(true), HOLD_MS);
    const done = window.setTimeout(finish, HOLD_MS + EXIT_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(out);
      window.clearTimeout(done);
      window.removeEventListener("keydown", onKey);
    };
  }, [live, colors, finish]);

  const [ink, paper, glint] = colors ?? [];
  if (!live || !ink || !paper || !glint) return <div aria-hidden className="intro-cover" />;

  return (
    <div className={leaving ? "intro-layer intro-layer--out" : "intro-layer"}>
      <div aria-hidden className="intro-veil">
        <DitherVeil
          src="/crocwork-logo.webp"
          fit="contain"
          pattern="floyd"
          pixelSize={2}
          inkColor={ink}
          paperColor={paper}
          contrast={1.25}
          revealRadius={160}
          softness={0.7}
          linger={0.8}
          rimColor={glint}
          rim={0.3}
          wander
        />
      </div>
      <p className="intro-name">crocwork.studio</p>
      <button type="button" className="intro-skip" onClick={finish}>
        ข้าม
      </button>
    </div>
  );
}
