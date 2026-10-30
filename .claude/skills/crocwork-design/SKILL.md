---
name: crocwork-design
description: Use for ANY UI work in software-empire (new page, new app, restyle, imported/cloned app, component, animation). Every screen must match the crocwork.studio design template — suisui-style ink + blue, torn paper, realistic iPhones, shared theme/ambience. Load before writing or changing UI.
---

# crocwork.studio design template — match it exactly

The owner's rule: **every app and page must look like it belongs to the same studio.** When work
starts from a reference (a screenshot, a video, a cloned project), copy its layout and motion
faithfully, then express it in this template's tokens and parts. Never invent a new palette,
font pair or corner style per app.

## 1. Tokens (never raw values)

- Colours: `packages/ui/src/palette.css` (`--em-*`) → semantic tokens in `styles.css`
  (`--background`, `--foreground`, `--primary`, `--muted-foreground`, …).
  Accent = crocwork blue `--em-blue-500/600/700`; neutrals = `--em-ink-*`; dark bands =
  `--em-ink-975`. Helpers in hub: `cw-blue` (text), `cw-btn-blue` (solid blue button).
- Fonts: body/headings **Noto Sans Thai UI** (heavy `font-black` for display), labels
  **Plus Jakarta Sans UI**, mono for eyebrows/terminals. Files live in each app's `public/fonts`.
- Corners: crisp. Buttons and cards are square or lightly rounded (≤ 0.75rem). Pills only for
  chips/tags.
- Imported apps with their own Tailwind classes: remap scales in the app's `globals.css` `@theme`
  (e.g. `--color-cyan-*` → blue, `--color-slate/gray-*` → ink, `--radius-*` tighter) instead of
  rewriting every class. See `apps/crocbyte/src/app/globals.css`.

## 2. Layout language (suisui-style)

- Sticky header: logo + name left, nav centre/right, theme toggle + ambience button + solid
  blue CTA (`→`). Below `lg`: hamburger `<dialog>` sheet (`apps/hub/src/app/mobile-menu.tsx`).
  Desktop nav is `NimbusNavbar` (WebGL water pill, the drop follows the section on screen; hub wrapper `site-nav.tsx`) with the nine-dot `AppLauncher` at its end; the launcher stands alone on mobile.
- Section opener: mono eyebrow (`font-mono text-xs uppercase tracking-[0.2em]`) → huge black
  headline, second line in blue → muted paragraph.
- Rhythm: light → dark (`--em-ink-975`) → light → blue. Bands meet with a **torn edge**
  (`TornEdge`, overlap 1px so no hairline shows).
- Boxes that matter (promise, good-fit, info cards) are **`TornPanel`**: ripped on all four
  sides, a grey sheet offset behind, optional faint grid inside (`apps/hub/src/app/sections.tsx`).
- Cinematic parts (`@empire/ui`): `ScrollAssemble` = pinned scroll interlude (letters fan in,
  items swing in; native scroll + sticky), `TidelineCta` = closing CTA whose water rises to a true
  level and loops seamlessly, `TearFooter` = torn-poster footer with a pushpin. Colours for canvas /
  shader / SVG maths come from `useTokenColors`, never hex literals. `CrocReveal` = poster torn by
  scroll, a crocodile surfaces (palette `--em-croc-*`). `LanyardBadge` = ID card on a Verlet strap
  (drag, flick to spin, tap to flip); faces take any content.
  Also (vendored originals, MIT): `PolaroidLineCarousel` (phone screenshots on a string),
  `WaterRippleCarousel` (desktop screenshots, tap to ripple), `MurmurationWordmark` (flock forms a
  word), `SkeletonKeyPreloader` (the first-visit intro, via hub `intro-gate.tsx` + `public/intro-boot.js`;
  one preloader per site). `IconFolder` (glass folder, icon tiles fan out; hub services). `PerspectiveTunnel` (cards fly past the camera, sticky + native scroll), `LaptopPreview` (lid opens on scroll, 16:10 screenshots + step cards). `ClothingRail` (garments on a rail, turn / lift / spin; hub "wardrobe" of roles). `GlassIconReveal` (WebGL2 glass droplet reveals a logo; hub sign-off above the footer, mark in `public/crocwork-mark.webp`). Branch on reduced motion only via `useReducedMotionAfterMount` (lib) or hydration breaks. Our own: `BlueprintReveal`, `PhosphorNotFound` (hub 404),
  `GlassClock`. Props from server components must be serialisable: label templates like `"{n} of {total}"`.
- Terminals for facts: `$ crocwork status`, real data only, blinking caret (`em-cursor`).
- Phones: `PhoneFrame` from `@empire/ui` (titanium edge, Dynamic Island, status bar 9:41) over
  paper-cut art (`PaperArt`); pairs fan out on hover. Screens are real screenshots
  (`apps/hub/public/previews/m-*.webp`), never mock text.
- Mascots: `MeshMascot` from `@empire/ui`, `kind="ghost"` (also `MeshGhost`) or `kind="owl"`
  (shader body, eyes follow the pointer). They dress for the current festival automatically.
  Colours come from palette tokens (resolved at runtime); never hard-code hex.
- Festivals are ambience values (`halloween`, `loykrathong`, `christmas`, `newyear`, `songkran`):
  pickable in the sky sheet, and `auto` switches by date (`festivalFor` in `@empire/core/theme`).
- Seasons in the portfolio: hub renders `<Ambience rich />`, so rain is `DataRain` over the whole
  page and the cool season / Christmas frost the screen's edges with `HoarfrostPane overlay`. The
  working apps keep the light CSS particles (no `rich`).
- Theme reveal default is `stream`: a live water curtain (no View Transition), so the page keeps
  scrolling during the switch. Never reintroduce a snapshot reveal as the default.
- Theme switch in the hub: `LiquidThemeToggle` (`@empire/ui`, a `LiquidToggle` drop of the navbar's
  water on the shared cookie, ink-drop page reveal). `SunMoonThemeToggle` stays in `HubSwitcher`.
- Glass: `.cw-glass` (hub) is the water-menu material for chips, cards and secondary buttons;
  `.pk-depth` / `.pk-depth-blue` give headlines the extruded depth look.
- Copy: first person, plain Thai, no em dashes, no buzzwords, only true numbers.

## 2b. เผ่าน้ำ (Water Tribe) — the owner's name for the house style

The hero is the reference (`SeasonTree` + `apps/hub/src/app/page.tsx`). Apply the same rules
anywhere water meets the page:

1. **One wave**: where anything meets water, use the shared lapping band `.cw-water` (two layers,
   7 s / 11 s, opposite ways) or a sum-of-sines waterline — never a ruled 1px line or a blob.
2. **Water is the only gradient**: light `--em-sky-500 → --em-blue-500 → --em-blue-700`; dark
   `--em-blue-700 → --em-ink-975`. Fuchsia / coral only for festivals.
3. **One light**: the moon (or day moon) at the top right. Solids are `--em-ink-800` with a rim
   of light on the side facing it.
4. **Two materials**: water things are glass (`.cw-glass`), land things are ink. Corners
   ≤ 0.75rem; pills only for chips.
5. **Two speeds**: a slow swell that never stops, and a quick reaction (ripple ~1.4 s) to a
   touch. Transform / opacity only; reduced motion = still water at its level.
6. **Things rise from the water**, never slide in sideways (`TideReveal`).
7. **What rests on water has a reflection** (~30–50%, broken by ripples).
8. **No boxes round scenes**: canvases fade out at their edges (`.stree` mask) so water runs off
   into the page; halos are never clipped.
9. **The croc visits, never stays**: head ridge and eyes at the waterline, a V of wake.
10. **Type**: `pk-depth` headlines; never letter-space Thai or set it in mono (mono is for Latin
    eyebrows only).

## 3. Shared across every app (wire these in, every time)

- `public/theme-boot.js` identical in every app + `<script src="/theme-boot.js">` in `<head>`
  (generate: `WRITE_THEME_BOOT=1 pnpm --filter @empire/core test`; the test fails otherwise).
- `HubSwitcher` (`@empire/ui`) somewhere visible: back to hub + other apps + theme toggle +
  ambience picker. Pass `cookieDomain`. Apps with their own animated scenes pass
  `ambience={false}` and bridge their scene switch to `em-ambience` (see
  `apps/crocbyte/src/lib/shared-prefs.ts`).
- Theme = cookie `em-theme`, ambience = cookie `em-ambience` (`@empire/core/theme`). Never
  localStorage for these — they must sync across apps.
- New app → add it to `packages/core/src/subsystems.ts` and `APP_URL_<SLUG>` in hub env.

## 4. Motion (cinematic, light)

- Animate **transform and opacity only**; CSS keyframes or `motion/react` (already installed —
  never add framer-motion, gsap or lenis; never hijack scrolling).
- Always honour `prefers-reduced-motion` (static fallback, ambience off).
- Page reveal: `<TideReveal/>` (`@empire/ui`, mounted once in hub `page.tsx`): every direct child
  of a `data-tide` element comes in once when it first reaches the screen, with a preset from
  `lib/fade.ts` (Web Animations, opacity / transform / filter only): `focus` for heading blocks,
  `develop` for pictures, lists and grids item by item, `tide` (rise out of the water) otherwise;
  `data-fade="mist|fade|..."` on a child overrides. For one-off blocks use `<FadeContent>` (same
  presets, after React Bits). Never gsap / ScrollTrigger, never SVG noise filters. Time-driven, never scroll-linked: no lag behind the finger, no tilt, no drift (scroll-
  linked depth on every section made people dizzy). Mark ordinary sections (or the inner container
  of a full-bleed band); never pinned / sticky scenes. Long lists of screens use `ScreenRail` +
  `useAutoplay` (scroll length fixed, whatever the count) instead of one scroll step per item.
- Anything that keeps moving gets `vt-live`; sticky/fixed chrome gets `vt-top` — otherwise it
  freezes or stacks wrongly during the theme-switch view transition. Both are suppressed while a
  `<dialog>` is open (styles.css handles it).
- Ambience particles: `<Ambience/>` (≤ 40 nodes, `contain: strict`); meteors in dark bands:
  `<Meteors/>`.

## 5. Before saying done

- `pnpm turbo run lint typecheck test build --filter=<app>` green.
- Screenshot desktop (1280–1366) **and** phone (390) and compare against the reference; check
  light + dark.
- No secrets in source (Firebase/Supabase config via `.env.local`), no `eval`, user HTML
  through DOMPurify.
