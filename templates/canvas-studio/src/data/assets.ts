import type { BrandKit, Paint } from '@/types/canva';
import { svgDataUri } from '@/lib/design';

const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

export interface SvgAsset {
  id: string;
  name: string;
  w: number;
  h: number;
  src: string;
}

const asset = (id: string, name: string, w: number, h: number, body: string): SvgAsset => ({ id, name, w, h, src: svgDataUri(svg(w, h, body)) });

const grad = (id: string, a: string, b: string) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;

export const BADGES: SvgAsset[] = [
  asset('b-new', 'New badge', 200, 200, `${grad('g', '#00C4CC', '#7D2AE8')}<path fill="url(#g)" d="M100 4l22 26 34-6 4 34 30 16-16 30 16 30-30 16-4 34-34-6-22 26-22-26-34 6-4-34-30-16 16-30-16-30 30-16 4-34 34 6z"/><text x="100" y="114" font-family="Arial,sans-serif" font-weight="900" font-size="40" fill="#fff" text-anchor="middle">NEW</text>`),
  asset('b-sale', 'Sale tag', 240, 120, `<path fill="#FF007F" d="M30 0h210v120H30L0 60z"/><circle cx="34" cy="60" r="9" fill="#fff"/><text x="140" y="76" font-family="Arial,sans-serif" font-weight="900" font-size="44" fill="#fff" text-anchor="middle">SALE</text>`),
  asset('b-pro', 'Pro crown', 200, 200, `${grad('g', '#FFD54A', '#A855F7')}<circle cx="100" cy="100" r="96" fill="#1E1F23"/><circle cx="100" cy="100" r="88" fill="none" stroke="url(#g)" stroke-width="6"/><path fill="url(#g)" d="M48 128l-8-60 36 26 24-40 24 40 36-26-8 60z"/><rect x="48" y="134" width="104" height="14" rx="4" fill="url(#g)"/>`),
  asset('b-check', 'Verified check', 200, 200, `<path fill="#00C4CC" d="M100 6l24 18 30-2 8 28 26 16-10 28 10 28-26 16-8 28-30-2-24 18-24-18-30 2-8-28-26-16 10-28-10-28 26-16 8-28 30 2z"/><path fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" d="M64 102l24 24 50-52"/>`),
  asset('b-stars', 'Five stars', 300, 60, Array.from({ length: 5 }, (_, i) => `<path transform="translate(${i * 60} 0)" fill="#FFC531" d="M30 2l8 18 20 2-15 13 5 20-18-11-18 11 5-20L2 22l20-2z"/>`).join('')),
  asset('b-ribbon', 'Best seller ribbon', 320, 110, `<path fill="#7D2AE8" d="M0 20h40v80L20 90 0 100zM280 20h40v80l-20-10-20 10z"/><rect x="20" y="0" width="280" height="80" rx="10" fill="#A855F7"/><text x="160" y="52" font-family="Arial,sans-serif" font-weight="900" font-size="30" fill="#fff" text-anchor="middle" letter-spacing="3">BEST SELLER</text>`),
  asset('b-live', 'Live pill', 200, 70, `<rect width="200" height="70" rx="35" fill="#FF2D55"/><circle cx="42" cy="35" r="11" fill="#fff"/><text x="118" y="47" font-family="Arial,sans-serif" font-weight="900" font-size="32" fill="#fff" text-anchor="middle">LIVE</text>`),
  asset('b-percent', 'Discount burst', 200, 200, `<path fill="#FFD400" d="M100 0l18 30 34-12 2 36 36 4-14 32 26 26-32 16 6 36-36-4-14 34-28-22-28 22-14-34-36 4 6-36-32-16 26-26-14-32 36-4 2-36 34 12z"/><text x="100" y="118" font-family="Arial,sans-serif" font-weight="900" font-size="48" fill="#141518" text-anchor="middle">-30%</text>`),
];

export const STICKERS: SvgAsset[] = [
  asset('s-sparkle', 'Sparkle', 160, 160, `${grad('g', '#00C4CC', '#7D2AE8')}<path fill="url(#g)" d="M80 0c6 46 34 74 80 80-46 6-74 34-80 80-6-46-34-74-80-80 46-6 74-34 80-80z"/>`),
  asset('s-blob', 'Blob', 220, 200, `${grad('g', '#FF6B6B', '#A855F7')}<path fill="url(#g)" d="M170 30c40 34 50 96 14 132s-110 46-150 12S-6 86 22 46 130-4 170 30z"/>`),
  asset('s-squiggle', 'Squiggle', 260, 60, `<path fill="none" stroke="#FF007F" stroke-width="10" stroke-linecap="round" d="M8 30c20-30 40-30 60 0s40 30 60 0 40-30 60 0 40 30 60 0"/>`),
  asset('s-heart', 'Heart', 180, 160, `<path fill="#FF4D6D" d="M90 156S0 100 0 46C0 18 22 0 46 0c20 0 36 12 44 28C98 12 114 0 134 0c24 0 46 18 46 46 0 54-90 110-90 110z"/>`),
  asset('s-bolt', 'Lightning', 120, 200, `<path fill="#FFD400" stroke="#141518" stroke-width="6" stroke-linejoin="round" d="M74 4L10 116h44l-14 80 70-120H64z"/>`),
  asset('s-curve-arrow', 'Curved arrow', 220, 140, `<path fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" d="M10 120C40 30 130 10 190 50"/><path fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" d="M160 30l32 20-16 32"/>`),
  asset('s-dots', 'Dot grid', 200, 200, Array.from({ length: 25 }, (_, i) => `<circle cx="${20 + (i % 5) * 40}" cy="${20 + Math.floor(i / 5) * 40}" r="7" fill="#00C4CC"/>`).join('')),
  asset('s-wave', 'Wave', 300, 80, `<path fill="#7D2AE8" d="M0 40c50-40 100-40 150 0s100 40 150 0v40H0z"/>`),
  asset('s-ring', 'Gradient ring', 200, 200, `${grad('g', '#00C4CC', '#FF007F')}<circle cx="100" cy="100" r="80" fill="none" stroke="url(#g)" stroke-width="24"/>`),
  asset('s-sun', 'Sun', 200, 200, `<circle cx="100" cy="100" r="46" fill="#FFB020"/>${Array.from({ length: 12 }, (_, i) => `<rect x="96" y="6" width="8" height="30" rx="4" fill="#FFB020" transform="rotate(${i * 30} 100 100)"/>`).join('')}`),
];

export const ILLUSTRATIONS: SvgAsset[] = [
  asset('i-mountain', 'Mountain sunrise', 400, 300, `${grad('sky', '#FFB199', '#7D2AE8')}<rect width="400" height="300" fill="url(#sky)"/><circle cx="280" cy="120" r="44" fill="#FFE29A"/><path fill="#3B1C6E" d="M0 300l120-170 70 90 60-60 150 140z"/><path fill="#22104A" d="M0 300l90-90 80 90z"/>`),
  asset('i-rocket', 'Rocket', 300, 300, `<circle cx="150" cy="150" r="150" fill="#1E1F23"/><path fill="#E8E6E3" d="M150 40c40 30 54 90 40 150h-80c-14-60 0-120 40-150z"/><circle cx="150" cy="120" r="20" fill="#00C4CC"/><path fill="#FF007F" d="M110 190l-30 40 40-10zM190 190l30 40-40-10z"/><path fill="#FFB020" d="M130 200h40l-20 60z"/>`),
  asset('i-plant', 'Potted plant', 260, 320, `<path fill="#2DD4A3" d="M130 190C70 170 40 110 60 60c40 20 70 70 70 130zM130 190c60-20 90-80 70-130-40 20-70 70-70 130z"/><rect x="128" y="120" width="4" height="80" fill="#1F9E78"/><path fill="#C2703D" d="M70 200h120l-16 110H86z"/>`),
  asset('i-laptop', 'Laptop', 340, 220, `<rect x="40" y="10" width="260" height="170" rx="12" fill="#25262B"/><rect x="54" y="24" width="232" height="140" rx="4" fill="#00C4CC"/><rect x="74" y="50" width="120" height="12" rx="6" fill="#fff"/><rect x="74" y="74" width="180" height="10" rx="5" fill="#ffffff99"/><rect x="74" y="94" width="150" height="10" rx="5" fill="#ffffff99"/><path fill="#3a3b42" d="M0 186h340l-20 30H20z"/>`),
  asset('i-chat', 'Chat bubbles', 320, 240, `<rect x="10" y="10" width="200" height="110" rx="24" fill="#7D2AE8"/><path fill="#7D2AE8" d="M40 110l-10 40 40-30z"/><rect x="110" y="110" width="200" height="110" rx="24" fill="#00C4CC"/><path fill="#00C4CC" d="M280 200l10 34-40-24z"/><rect x="40" y="46" width="140" height="12" rx="6" fill="#fff"/><rect x="40" y="70" width="100" height="12" rx="6" fill="#fff"/><rect x="140" y="146" width="140" height="12" rx="6" fill="#fff"/>`),
];

export const BACKDROPS: { id: string; name: string; paint: Paint }[] = [
  { id: 'bd-aurora', name: 'Aurora', paint: { kind: 'linear', angle: 135, stops: ['#00C4CC', '#7D2AE8'] } },
  { id: 'bd-sunset', name: 'Sunset', paint: { kind: 'linear', angle: 160, stops: ['#FF9F43', '#EE5A9B'] } },
  { id: 'bd-night', name: 'Night', paint: { kind: 'radial', stops: ['#2A1060', '#07060D'] } },
  { id: 'bd-mint', name: 'Mint', paint: { kind: 'linear', angle: 180, stops: ['#E0FFF6', '#7EE8C8'] } },
  { id: 'bd-sand', name: 'Sand', paint: { kind: 'linear', angle: 180, stops: ['#F7F1E6', '#E3C9A8'] } },
  { id: 'bd-ocean', name: 'Ocean', paint: { kind: 'linear', angle: 200, stops: ['#0F2027', '#2C5364'] } },
];

export const GRID_PATTERN = svgDataUri(
  svg(1584, 396, `<defs><pattern id="p" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1"/></pattern></defs><rect width="1584" height="396" fill="url(#p)"/>`),
);

export const SEED_BRAND: BrandKit = {
  palettes: [
    { id: 'pal-obsidian', name: 'CrocWork Obsidian', colors: ['#0B0B0F', '#1E1F23', '#2DD4A3', '#E8E6E3', '#7D2AE8'] },
    { id: 'pal-neon', name: 'Cyber Neon', colors: ['#0A0A12', '#00F0FF', '#FF007F', '#B6FF00', '#7D2AE8'] },
    { id: 'pal-editorial', name: 'Minimalist Editorial', colors: ['#F4F1EA', '#1A1A1A', '#C8A97E', '#8A7F70', '#FFFFFF'] },
    { id: 'pal-sunset', name: 'Sunset Gradient', colors: ['#FF6B6B', '#FF9F43', '#FECA57', '#EE5A9B', '#5F27CD'] },
  ],
  activePaletteId: 'pal-obsidian',
  typography: {
    heading: { family: 'Space Grotesk', weight: 700 },
    subheading: { family: 'Inter', weight: 600 },
    body: { family: 'Inter', weight: 400 },
  },
  logos: [
    { id: 'lg-croc', name: 'CrocWork monogram', w: 240, h: 240, src: svgDataUri(svg(240, 240, `${grad('g', '#2DD4A3', '#7D2AE8')}<rect width="240" height="240" rx="56" fill="#0B0B0F"/><rect x="10" y="10" width="220" height="220" rx="48" fill="none" stroke="url(#g)" stroke-width="6"/><text x="120" y="152" font-family="Arial,sans-serif" font-weight="900" font-size="104" fill="url(#g)" text-anchor="middle">CW</text>`)) },
    { id: 'lg-watermark', name: 'Watermark', w: 360, h: 80, src: svgDataUri(svg(360, 80, `<text x="180" y="54" font-family="Arial,sans-serif" font-weight="700" font-size="40" fill="#ffffff" fill-opacity="0.55" text-anchor="middle" letter-spacing="6">© CROCWORK</text>`)) },
    { id: 'lg-seal', name: 'Quality seal', w: 220, h: 220, src: svgDataUri(svg(220, 220, `<circle cx="110" cy="110" r="104" fill="#E8E6E3"/><circle cx="110" cy="110" r="88" fill="none" stroke="#0B0B0F" stroke-width="3" stroke-dasharray="6 6"/><text x="110" y="104" font-family="Georgia,serif" font-weight="700" font-size="34" fill="#0B0B0F" text-anchor="middle">CROC</text><text x="110" y="140" font-family="Arial,sans-serif" font-size="18" fill="#2DD4A3" text-anchor="middle" letter-spacing="4">WORK · 2026</text>`)) },
  ],
};
