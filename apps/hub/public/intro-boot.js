// Keyhole intro, decided before first paint: home page, first visit this session, motion allowed.
// The flag name matches INTRO_KEY in @empire/ui keyhole-intro.tsx.
try {
  if (
    location.pathname === "/" &&
    !sessionStorage.getItem("em-intro-seen") &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    document.documentElement.classList.add("em-intro");
} catch {
  // storage blocked: skip the intro rather than risk showing it on every page
}
