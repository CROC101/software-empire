// One place to rebrand the whole app: name, wordmark, accent colour and fonts.
// Colours/fonts here are pushed into CSS variables at start-up (see main.tsx),
// so every Tailwind token that uses them (bg-accent, text-accent, font-sans...) follows.
export const brand = {
  name: 'LUMORA',
  /** Short line shown under the footer language picker, e.g. "LUMORA ไทย". */
  regionLabel: 'LUMORA ไทย',
  /** Wordmark text drawn as the logo (swap for an <img> in components/Logo.tsx if you have artwork). */
  wordmark: 'LUMORA',
  /** Single-letter mark used on posters and the favicon. */
  monogram: 'L',
  colors: {
    accent: '#e50914',
    accentHover: '#c11119',
    background: '#000000',
    appBackground: '#141414',
  },
  fonts: {
    sans: '"Noto Sans Thai Variable", "Helvetica Neue", "Segoe UI", Roboto, Ubuntu, sans-serif',
    display: '"Bebas Neue", "Noto Sans Thai Variable", sans-serif',
  },
  priceFrom: '99 บาท',
  phone: '1-800-000-000',
  /** true = play open-source Blender films from the web; false = bundled offline clips. */
  useOpenSourceStreams: true,
} as const;

export type Brand = typeof brand;
