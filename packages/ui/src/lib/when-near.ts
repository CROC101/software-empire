/**
 * Runs `start` once `el` comes within `margin` of the viewport (a screen by default), then never
 * watches again. For WebGL and other heavy set-up: creating a context and compiling shaders for
 * every canvas on a long page while it loads blocks the main thread for most of a second.
 * Returns a stop that also runs whatever `start` returned.
 */
export function whenNear(
  el: Element,
  start: () => (() => void) | undefined,
  margin = "100% 0px",
): () => void {
  let stop: (() => void) | undefined;
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      stop = start();
    },
    { rootMargin: margin },
  );
  io.observe(el);
  return () => {
    io.disconnect();
    stop?.();
  };
}
