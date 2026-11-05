/**
 * Decorative loops (the swaying tree, snow, an idle liquid toggle) redraw at most this often while
 * nothing is interacting with them. A 120 Hz screen would otherwise run each of them 120 times a
 * second on the main thread, and that is what made the hub stutter; scrolling itself stays at the
 * screen's full rate. Anything the visitor drives (dragging, falling fruit) still runs every frame.
 */
export const AMBIENT_MS = 1000 / 30;

/** How long after the last scroll event the page still counts as scrolling. */
const SCROLL_REST_MS = 160;
let scrolledAt = -Infinity;
let listening = false;

/**
 * true when an idle ambient loop should skip this display frame: it drew less than a frame ago,
 * or the page is scrolling. Decoration holds still while the page moves, so every GPU frame goes
 * to the scroll itself; on a large desktop screen that is the difference between smooth and not.
 */
export const ambientSkip = (now: number, lastDrawn: number) => {
  if (!listening && typeof window !== "undefined") {
    listening = true;
    window.addEventListener(
      "scroll",
      () => {
        scrolledAt = performance.now();
      },
      { passive: true, capture: true },
    );
  }
  return now - lastDrawn < AMBIENT_MS - 1 || now - scrolledAt < SCROLL_REST_MS;
};
