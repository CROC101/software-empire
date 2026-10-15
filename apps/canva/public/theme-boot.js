// Runs before first paint so dark-theme users don't see a light flash. External file: CSP allows no inline scripts.
try {
  var t = localStorage.getItem("cv-canvas:theme");
  document.documentElement.dataset.theme = t === "dark" || t === "system" ? t : "light";
} catch (e) {
  document.documentElement.dataset.theme = "light";
}
