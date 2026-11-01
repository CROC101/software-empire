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
try {
  // LITE: em-lite=on|off, or auto = phones and data-saver. Every effect already falls back to a
  // still frame for reduced motion, so LITE answers that media query with "reduce".
  var l = /(?:^|;\s*)em-lite=(on|off)(?:;|$)/.exec(document.cookie);
  var n = navigator.connection;
  var lite = l
    ? l[1] === "on"
    : (matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 768) ||
      (n && n.saveData) === true;
  document.documentElement.dataset.lite = lite ? "on" : "off";
  if (lite) {
    var mm = window.matchMedia.bind(window);
    window.matchMedia = function (q) {
      return /prefers-reduced-motion/.test(q)
        ? mm(/no-preference/.test(q) ? "not all" : "all")
        : mm(q);
    };
    // the device's own answer, for the few things that keep moving in LITE (see osReducedMotion)
    window.matchMedia.real = mm;
  }
} catch {
  // no matchMedia or cookies: full effects, as before
}
