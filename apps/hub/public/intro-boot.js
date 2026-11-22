// First-visit build tour, decided before first paint: home page, first visit ever in this browser (or ?intro),
// motion allowed.
// The flag name matches the one BuildTour (@empire/ui) sets when it finishes.
try {
  if (
    location.pathname === "/" &&
    // ?intro replays it on demand
    (location.search.includes("intro") || !localStorage.getItem("em-intro-seen")) &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    document.documentElement.classList.add("em-intro");
} catch {
  // storage blocked: skip the intro rather than risk showing it on every page
}
