import {
  currentAmbience,
  currentChoice,
  osDark,
  resolve,
  setAmbience,
  setThemeChoice,
} from "@empire/core/theme";

/*
 * CrocByte's own dark/light and underwater/snow switches, bridged onto the portfolio-wide
 * cookies so flipping them here flips every other app too (and the other way round).
 * Underwater is CrocByte's default scene, so it maps to the shared "auto" sky.
 */

const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;

export const getSharedTheme = (): "dark" | "light" => resolve(currentChoice(), osDark());

export const setSharedTheme = (theme: string) =>
  setThemeChoice(theme === "light" ? "light" : "dark", domain);

export const getSharedScene = (): "underwater" | "snow" =>
  currentAmbience() === "snow" ? "snow" : "underwater";

export const setSharedScene = (scene: string) =>
  setAmbience(scene === "snow" ? "snow" : "auto", domain);
