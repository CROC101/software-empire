// One place to rebrand the whole app: name, logo colours, accent colours and fonts.
export const brand = {
  name: 'Lumigram',
  company: 'Lumi Labs',
  handle: 'lumigram',
  tagline: { lead: 'See everyday moments from your', highlight: 'close friends' },
  year: 2026,
  /** Gradient stops used by the logo, story rings and highlighted words. */
  logoGradient: ['#ffc23d', '#ff6a2b', '#ff1f7a', '#c42bd8', '#6a3cff'],
  fonts: {
    ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display: 'Optimistic, "Segoe UI Historic", "Segoe UI", Helvetica, Arial, sans-serif',
    headline: '"Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif',
  },
  light: {
    accent: '#0064e0',
    accentSoft: '#0095f6',
    text: '#111112',
    textSecondary: '#737373',
    textMuted: '#686a6e',
    bg: '#ffffff',
    bgElevated: '#ffffff',
    bgSubtle: '#f3f4f5',
    bgHover: '#0000000d',
    border: '#e0e2e4',
    inputBorder: '#ccd0d5',
    danger: '#ed4956',
    heart: '#ff3040',
  },
  dark: {
    accent: '#4a9bff',
    accentSoft: '#0095f6',
    text: '#f5f5f5',
    textSecondary: '#a8a8a8',
    textMuted: '#a8a8a8',
    bg: '#000000',
    bgElevated: '#262626',
    bgSubtle: '#1f1f1f',
    bgHover: '#ffffff1a',
    border: '#262626',
    inputBorder: '#3a3a3a',
    danger: '#ff5a66',
    heart: '#ff3040',
  },
} as const;

export type ThemeTokens = { -readonly [K in keyof typeof brand.light]: string };

/** Writes the brand colours and fonts into CSS variables so every component follows them. */
export function applyTheme(mode: 'light' | 'dark') {
  const root = document.documentElement;
  const tokens: ThemeTokens = brand[mode];
  for (const [k, v] of Object.entries(tokens)) root.style.setProperty(`--${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`, v);
  root.style.setProperty('--font-ui', brand.fonts.ui);
  root.style.setProperty('--font-display', brand.fonts.display);
  root.style.setProperty('--font-headline', brand.fonts.headline);
  root.style.setProperty('--brand-gradient', `linear-gradient(45deg, ${brand.logoGradient.join(', ')})`);
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
}
