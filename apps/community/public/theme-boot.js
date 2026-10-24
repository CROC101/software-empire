// Generated from @empire/core/theme — keep identical in every app (theme-boot test).
// Runs before first paint: applies the shared em-theme cookie so no app flashes the wrong theme.
/* eslint-disable -- generated asset, linted as part of @empire/core/theme */
try {
  var m = /(?:^|;\s*)em-theme=([^;]*)/.exec(document.cookie);
  var c = m && (m[1] === "dark" || m[1] === "system") ? m[1] : "light";
  var d = c === "dark" || (c === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  var r = document.documentElement;
  r.classList.toggle("dark", d);
  r.classList.toggle("light", !d);
  r.dataset.theme = c;
  r.style.colorScheme = d ? "dark" : "light";
} catch {
  // cookies blocked: keep the default light theme
}
