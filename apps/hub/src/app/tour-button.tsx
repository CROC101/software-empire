"use client";

import { BUILD_TOUR_EVENT, useReducedMotionAfterMount } from "@empire/ui";

/** Replays the build tour: the agents take the page apart and build it again. */
export function TourButton() {
  // the tour never plays with reduced motion, so the button would do nothing
  if (useReducedMotionAfterMount()) return null;
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(BUILD_TOUR_EVENT))}
      // sits on the cloud sky: the same see-through glass as the hero's other secondary action
      className="inline-flex items-center gap-2 rounded-xl border border-(--em-ink-0)/40 bg-(--em-ink-0)/10 px-5 py-3 text-sm font-bold text-(--em-ink-0) backdrop-blur-sm transition-transform hover:-translate-y-0.5"
    >
      <span aria-hidden>▶</span> ดูการสร้างเว็บนี้
    </button>
  );
}
