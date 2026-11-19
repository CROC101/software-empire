/**
 * One-file rebranding engine. Change values here and the whole app follows:
 * name, logo, colours (pushed into CSS variables), mascots, currency and locale.
 */
export interface BrandConfig {
  name: string;
  /** Wordmark shown next to the logo icon. */
  wordmark: string;
  tagline: string;
  /** Inline SVG markup for the logo icon (uses currentColor). */
  logoSvg: string;
  colors: { primary: string; secondary: string };
  mascots: { hero: string; empty: string; chat: string };
  currency: { code: string; symbol: string };
  locale: string;
  supportPhone: string;
  supportEmail: string;
  copyrightYear: number;
}

export const brand: BrandConfig = {
  name: 'crocwork',
  wordmark: 'crocwork',
  tagline: 'แหล่งรวมฟรีแลนซ์คุณภาพ ที่ธุรกิจทั่วไทยเลือกใช้',
  logoSvg:
    '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 22c0-7 4.5-12 11-12 4 0 7 2 9 5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M6 22h20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="21" cy="14.5" r="1.8" fill="currentColor"/></svg>',
  colors: { primary: '#1d6ce2', secondary: '#0b47a3' },
  mascots: {
    hero: process.env.TEMPLATE_BASE + '/assets/mascots/croc-peek.svg',
    empty: process.env.TEMPLATE_BASE + '/assets/mascots/croc-empty.svg',
    chat: process.env.TEMPLATE_BASE + '/assets/mascots/croc-chat.svg',
  },
  currency: { code: 'THB', symbol: '฿' },
  locale: 'th-TH',
  supportPhone: '02-xxx-xxxx',
  supportEmail: 'support@example.com',
  copyrightYear: 2026,
};

export function formatPrice(value: number): string {
  return `${brand.currency.symbol}${value.toLocaleString(brand.locale)}`;
}
