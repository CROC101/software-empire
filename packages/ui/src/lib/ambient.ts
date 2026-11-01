/**
 * Decorative loops (the swaying tree, snow, an idle liquid toggle) redraw at most this often while
 * nothing is interacting with them. A 120 Hz screen would otherwise run each of them 120 times a
 * second on the main thread, and that is what made the hub stutter; scrolling itself stays at the
 * screen's full rate. Anything the visitor drives (dragging, falling fruit) still runs every frame.
 */
export const AMBIENT_MS = 1000 / 30;

/** true when an idle ambient loop should skip this display frame */
export const ambientSkip = (now: number, lastDrawn: number) => now - lastDrawn < AMBIENT_MS - 1;
