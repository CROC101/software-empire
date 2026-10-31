// Keyhole intro, decided before first paint: home page, first visit this session (or ?intro),
// motion allowed.
// The flag name matches SEEN in apps/hub/src/app/intro-gate.tsx.
try {
  if (
    location.pathname === "/" &&
    // ?intro replays it on demand
    (location.search.includes("intro") || !sessionStorage.getItem("em-intro-seen")) &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    document.documentElement.classList.add("em-intro");
} catch {
  // storage blocked: skip the intro rather than risk showing it on every page
}
