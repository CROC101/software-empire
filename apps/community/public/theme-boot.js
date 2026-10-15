// Runs before first paint so dark-theme users don't see a light flash. External file: CSP allows no inline scripts.
try {
  var c = localStorage.getItem("nx:theme");
  var dark =
    c === "dark" || (c === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
} catch (e) {}
