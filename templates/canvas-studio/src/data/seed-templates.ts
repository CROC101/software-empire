import type { CanvasElement, DesignPage, DesignPreset, DesignTemplate, FontCombo, Gradient, Paint, ShapeKind } from '@/types/canva';
import { GRID_PATTERN } from './assets';

// Deterministic ids so server and client render the same seed markup.
let seq = 0;
const nid = (p = 'e') => `${p}${++seq}`;

const lin = (a: string, b: string, angle = 135): Gradient => ({ kind: 'linear', stops: [a, b], angle });
const rad = (a: string, b: string): Gradient => ({ kind: 'radial', stops: [a, b] });

/** Text box; height estimated from wrapped line count (the editor re-measures on edit). */
function txt(text: string, x: number, y: number, w: number, o: Partial<CanvasElement> = {}): CanvasElement {
  const size = o.fontSize ?? 32;
  const lh = o.lineHeight ?? 1.2;
  const perLine = Math.max(1, Math.floor(w / (size * 0.52)));
  const lines = text.split('\n').reduce((s, p) => s + Math.max(1, Math.ceil(p.length / perLine)), 0);
  return {
    id: nid(), type: 'text', text, x, y, w, h: Math.ceil(lines * size * lh), rotation: 0, opacity: 1,
    fontFamily: 'Inter', fontSize: size, fontWeight: 400, color: '#FFFFFF', align: 'left', lineHeight: lh, letterSpacing: 0, ...o,
  };
}

function shp(shape: ShapeKind, x: number, y: number, w: number, h: number, fill: Paint, o: Partial<CanvasElement> = {}): CanvasElement {
  return { id: nid(), type: 'shape', shape, x, y, w, h, fill, rotation: 0, opacity: 1, ...o };
}

const img = (src: string, x: number, y: number, w: number, h: number, o: Partial<CanvasElement> = {}): CanvasElement => ({
  id: nid(), type: 'image', src, x, y, w, h, rotation: 0, opacity: 1, ...o,
});

const page = (background: Paint, elements: CanvasElement[], animation?: DesignPage['animation']): DesignPage => ({ id: nid('pg'), background, elements, animation });

const pillText = (label: string, x: number, y: number, w: number, h: number, fill: Paint, color = '#FFFFFF', size = 24, o: Partial<CanvasElement> = {}) => [
  shp('pill', x, y, w, h, fill, o),
  txt(label, x, y + (h - size * 1.2) / 2, w, { fontSize: size, fontWeight: 800, align: 'center', color, h: Math.ceil(size * 1.2), letterSpacing: 2 }),
];

const rise = { type: 'rise' as const, duration: 0.6, delay: 0 };

export const TEMPLATES: DesignTemplate[] = [
  {
    id: 'tpl-yt-tech', name: 'YouTube Viral Tech Review', category: 'YouTube', pro: true, width: 1280, height: 720,
    colors: ['#0B0B12', '#00C4CC', '#7D2AE8', '#FF007F', '#FFD400'],
    pages: [page(lin('#0B0B12', '#1A1030'), [
      shp('circle', 760, -120, 640, 640, rad('rgba(125,42,232,0.55)', 'rgba(125,42,232,0)'), { name: 'Glow' }),
      shp('roundedRect', 700, 120, 500, 480, lin('#00C4CC', '#7D2AE8'), { radius: 36, rotation: 6, shadow: true, name: 'Gradient card' }),
      shp('roundedRect', 740, 170, 420, 380, '#0F0F1A', { radius: 28, rotation: 6 }),
      txt('X1 ULTRA', 760, 310, 380, { fontFamily: 'Oswald', fontSize: 72, fontWeight: 700, align: 'center', rotation: 6, glow: true }),
      txt('IS IT\nWORTH IT?', 70, 160, 640, { fontFamily: 'Oswald', fontSize: 124, fontWeight: 700, lineHeight: 1, rotation: -4 }),
      txt('Honest review after 30 days', 76, 450, 560, { fontFamily: 'Space Grotesk', fontSize: 34, fontWeight: 600, color: '#00C4CC' }),
      ...pillText('2026 EDITION', 70, 70, 240, 54, '#FF007F'),
      shp('arrow', 520, 520, 200, 80, '#FFD400', { rotation: -20, name: 'Accent arrow' }),
    ], rise)],
  },
  {
    id: 'tpl-yt-code', name: 'YouTube Coding Tutorial', category: 'YouTube', pro: true, width: 1280, height: 720,
    colors: ['#0D1117', '#00C4CC', '#7D2AE8', '#7EE787'],
    pages: [page('#0D1117', [
      shp('roundedRect', 24, 24, 1232, 672, 'rgba(0,0,0,0)', { stroke: '#00C4CC', strokeWidth: 4, radius: 28, name: 'Neon border' }),
      shp('roundedRect', 640, 150, 560, 400, '#161B22', { radius: 18, stroke: '#30363D', strokeWidth: 2, shadow: true, name: 'Terminal' }),
      shp('roundedRect', 640, 150, 560, 46, '#21262D', { radius: 18 }),
      shp('circle', 664, 167, 13, 13, '#FF5F56'),
      shp('circle', 686, 167, 13, 13, '#FFBD2E'),
      shp('circle', 708, 167, 13, 13, '#27C93F'),
      txt('$ npx create-app\n> building...\n✓ ready in 1.2s\n\nconst app = build();', 672, 222, 500, { fontFamily: 'JetBrains Mono', fontSize: 26, color: '#7EE787', lineHeight: 1.5 }),
      txt('LEARN\nTYPESCRIPT', 80, 200, 560, { fontFamily: 'JetBrains Mono', fontSize: 80, fontWeight: 800, lineHeight: 1.05 }),
      txt('from zero to production', 80, 400, 520, { fontFamily: 'JetBrains Mono', fontSize: 30, color: '#8B949E' }),
      ...pillText('FULL COURSE', 80, 108, 250, 58, lin('#00C4CC', '#7D2AE8', 90)),
      txt('● 12 HOURS', 80, 500, 400, { fontFamily: 'JetBrains Mono', fontSize: 30, fontWeight: 700, color: '#FFBD2E' }),
    ])],
  },
  {
    id: 'tpl-ig-saas', name: 'Instagram SaaS Launch', category: 'Instagram', pro: true, width: 1080, height: 1080,
    colors: ['#1B1035', '#00C4CC', '#7D2AE8', '#FFFFFF'],
    pages: [page(rad('#1B1035', '#07060D'), [
      shp('circle', -160, -160, 620, 620, rad('rgba(0,196,204,0.55)', 'rgba(0,196,204,0)')),
      shp('circle', 640, 600, 600, 600, rad('rgba(125,42,232,0.6)', 'rgba(125,42,232,0)')),
      shp('roundedRect', 140, 220, 800, 640, 'rgba(255,255,255,0.08)', { stroke: 'rgba(255,255,255,0.22)', strokeWidth: 2, radius: 40, shadow: true, name: 'Glass card' }),
      ...pillText('NOW LIVE', 420, 280, 240, 52, 'rgba(0,196,204,0.18)', '#00C4CC', 22, { stroke: '#00C4CC', strokeWidth: 2 }),
      txt('Ship faster\nwith Flowbase', 180, 380, 720, { fontFamily: 'Space Grotesk', fontSize: 88, fontWeight: 700, align: 'center', lineHeight: 1.05 }),
      txt('Automate your entire workflow in minutes.', 200, 590, 680, { fontSize: 32, color: 'rgba(255,255,255,0.7)', align: 'center' }),
      ...pillText('Try it free →', 390, 700, 300, 84, lin('#00C4CC', '#7D2AE8', 90), '#FFFFFF', 30),
    ], { type: 'pop', duration: 0.5, delay: 0 })],
  },
  {
    id: 'tpl-ig-quote', name: 'Minimalist Quote Card', category: 'Instagram', pro: false, width: 1080, height: 1080,
    colors: ['#EDE6DA', '#2B2B2B', '#C8A97E'],
    pages: [page('#EDE6DA', [
      shp('rect', 60, 60, 960, 960, 'rgba(0,0,0,0)', { stroke: '#2B2B2B', strokeWidth: 2, name: 'Frame' }),
      txt('“', 120, 90, 300, { fontFamily: 'Playfair Display', fontSize: 320, color: '#C8A97E', lineHeight: 1, h: 320 }),
      txt('Simplicity is the ultimate form of sophistication.', 140, 380, 800, { fontFamily: 'Playfair Display', fontSize: 76, italic: true, color: '#2B2B2B', lineHeight: 1.2 }),
      shp('rect', 140, 720, 120, 4, '#C8A97E'),
      txt('LEONARDO DA VINCI', 140, 750, 600, { fontSize: 26, fontWeight: 600, letterSpacing: 6, color: '#2B2B2B' }),
      txt('@studio.notes', 140, 930, 400, { fontSize: 22, color: '#8A7F70' }),
      txt('”', 720, 640, 260, { fontFamily: 'Playfair Display', fontSize: 220, color: '#C8A97E', align: 'right', lineHeight: 1, h: 220 }),
    ], { type: 'fade', duration: 0.8, delay: 0 })],
  },
  {
    id: 'tpl-tiktok', name: 'TikTok / Reels Hook Cover', category: 'TikTok', pro: true, width: 1080, height: 1920,
    colors: ['#0A0A0A', '#FF007F', '#FFD400', '#00C4CC'],
    pages: [page(lin('#0A0A0A', '#1C0F2E', 180), [
      txt('POV:', 90, 260, 900, { fontFamily: 'Oswald', fontSize: 120, fontWeight: 700, color: '#FFD400' }),
      shp('rect', 70, 560, 780, 170, '#FF007F', { rotation: -2, name: 'Neon highlight' }),
      txt('you finally\nautomated\nyour job', 90, 410, 900, { fontFamily: 'Oswald', fontSize: 150, fontWeight: 700, lineHeight: 1, uppercase: true }),
      shp('circle', 240, 1000, 600, 600, rad('rgba(0,196,204,0.5)', 'rgba(0,196,204,0)')),
      shp('star', 440, 1150, 200, 200, '#00C4CC', { name: 'Star' }),
      txt('Watch till the end 👇', 90, 1560, 900, { fontSize: 64, fontWeight: 800, align: 'center' }),
      txt('@yourhandle', 90, 1680, 900, { fontSize: 40, color: 'rgba(255,255,255,0.6)', align: 'center' }),
    ], rise)],
  },
  {
    id: 'tpl-pitch-title', name: 'Startup Pitch Deck — Title', category: 'Presentations', pro: true, width: 1920, height: 1080,
    colors: ['#0B1026', '#2A1060', '#00C4CC', '#7D2AE8', '#FF007F'],
    pages: [
      page(lin('#0B1026', '#2A1060'), [
        shp('circle', 1200, -200, 1000, 1000, lin('#00C4CC', '#7D2AE8'), { opacity: 0.9 }),
        shp('triangle', 1450, 650, 380, 330, '#FF007F', { opacity: 0.85, rotation: 12 }),
        shp('hexagon', 1100, 600, 260, 230, 'rgba(255,255,255,0.08)', { stroke: 'rgba(255,255,255,0.4)', strokeWidth: 2 }),
        txt('SERIES A · 2026', 140, 300, 700, { fontSize: 32, fontWeight: 600, letterSpacing: 8, color: '#00C4CC' }),
        txt('Nova Labs', 140, 360, 1000, { fontFamily: 'Space Grotesk', fontSize: 180, fontWeight: 700, lineHeight: 1.1 }),
        txt('Making clean energy as easy as\nopening an app.', 140, 600, 900, { fontSize: 48, color: 'rgba(255,255,255,0.75)', lineHeight: 1.3 }),
        shp('rect', 140, 880, 200, 6, '#00C4CC'),
        txt('nova-labs.io', 140, 910, 500, { fontSize: 28, color: 'rgba(255,255,255,0.6)' }),
      ], rise),
      page(lin('#0B1026', '#2A1060'), [
        txt('01 — THE PROBLEM', 140, 140, 900, { fontSize: 30, fontWeight: 600, letterSpacing: 8, color: '#00C4CC' }),
        txt('Energy is still\nconfusing.', 140, 210, 1100, { fontFamily: 'Space Grotesk', fontSize: 120, fontWeight: 700, lineHeight: 1.05 }),
        txt('• 68% of homes overpay on their bills\n• Solar setup takes 4+ months\n• Zero real-time visibility', 140, 560, 1100, { fontSize: 46, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }),
        shp('circle', 1380, 360, 380, 380, lin('#00C4CC', '#7D2AE8')),
        txt('68%', 1380, 495, 380, { fontFamily: 'Space Grotesk', fontSize: 110, fontWeight: 700, align: 'center' }),
      ], rise),
    ],
  },
  {
    id: 'tpl-pitch-metrics', name: 'Startup Pitch Deck — Traction', category: 'Presentations', pro: true, width: 1920, height: 1080,
    colors: ['#0E0F14', '#00C4CC', '#7D2AE8', '#FF007F'],
    pages: [page('#0E0F14', [
      txt('Traction that speaks', 140, 110, 1400, { fontFamily: 'Space Grotesk', fontSize: 96, fontWeight: 700 }),
      txt('Q1 2026 → Q3 2026', 140, 240, 800, { fontSize: 36, color: '#8B8FA3' }),
      ...([[140, '#00C4CC', '+340%', 'Growth YoY'], [710, '#A855F7', '$1.2M', 'ARR'], [1280, '#FF007F', '50K', 'Active users']] as const).flatMap(([x, c, num, label]) => [
        shp('roundedRect', x, 380, 500, 480, '#1A1C24', { radius: 32, stroke: 'rgba(255,255,255,0.08)', strokeWidth: 2 }),
        shp('pill', x + 50, 430, 120, 10, c),
        txt(num, x + 50, 480, 420, { fontFamily: 'Space Grotesk', fontSize: 130, fontWeight: 700, color: c, lineHeight: 1.1 }),
        txt(label, x + 50, 660, 420, { fontSize: 40, color: '#C9CBD6' }),
      ]),
    ], { type: 'rise', duration: 0.6, delay: 0 })],
  },
  {
    id: 'tpl-resume-swe', name: 'Modern Software Engineer Resume', category: 'Resumes', pro: false, width: 794, height: 1123,
    colors: ['#FFFFFF', '#1E2230', '#7D2AE8', '#00C4CC'],
    pages: [page('#FFFFFF', [
      shp('rect', 0, 0, 260, 1123, '#1E2230', { name: 'Sidebar' }),
      shp('circle', 70, 60, 120, 120, lin('#00C4CC', '#7D2AE8')),
      txt('AR', 70, 94, 120, { fontFamily: 'Space Grotesk', fontSize: 44, fontWeight: 700, align: 'center' }),
      txt('CONTACT\n\nalex@mail.dev\n+1 555 0142\ngithub.com/alexr\nBerlin, DE', 30, 230, 200, { fontSize: 15, color: '#CFD3E0', lineHeight: 1.6 }),
      txt('SKILLS\n\nTypeScript · React\nNode.js · Go\nPostgreSQL · Redis\nAWS · Docker · K8s', 30, 470, 200, { fontSize: 15, color: '#CFD3E0', lineHeight: 1.6 }),
      txt('Alex Rivera', 300, 60, 460, { fontFamily: 'Space Grotesk', fontSize: 44, fontWeight: 700, color: '#141518' }),
      txt('Senior Software Engineer', 300, 120, 460, { fontSize: 20, fontWeight: 600, color: '#7D2AE8' }),
      shp('rect', 304, 200, 3, 760, '#E3E5EC'),
      txt('EXPERIENCE\n\nStaff Engineer — Cloudline (2023–now)\nLed a 9-person platform team; cut infra cost 38%.\n\nSenior Engineer — Pixelworks (2020–2023)\nBuilt realtime collaboration used by 2M users.\n\nSoftware Engineer — Finly (2017–2020)\nShipped payments APIs processing $40M/month.', 330, 190, 430, { fontSize: 15, color: '#2A2D38', lineHeight: 1.7 }),
    ])],
  },
  {
    id: 'tpl-resume-creative', name: 'Creative Designer Resume', category: 'Resumes', pro: true, width: 794, height: 1123,
    colors: ['#FAF7F2', '#FF6B6B', '#7D2AE8'],
    pages: [page('#FAF7F2', [
      shp('rect', 0, 0, 794, 260, lin('#FF6B6B', '#7D2AE8', 120), { name: 'Header banner' }),
      shp('circle', 600, 60, 140, 140, 'rgba(255,255,255,0.18)'),
      txt('Maya Chen', 60, 70, 600, { fontFamily: 'Playfair Display', fontSize: 64, fontWeight: 700 }),
      txt('Brand & Visual Designer', 60, 160, 600, { fontSize: 24, color: 'rgba(255,255,255,0.9)' }),
      txt('PORTFOLIO HIGHLIGHTS', 60, 310, 600, { fontSize: 18, fontWeight: 700, letterSpacing: 4, color: '#7D2AE8' }),
      shp('roundedRect', 60, 350, 200, 150, lin('#FFB199', '#FF6B6B'), { radius: 16 }),
      shp('roundedRect', 297, 350, 200, 150, lin('#A855F7', '#7D2AE8'), { radius: 16 }),
      shp('roundedRect', 534, 350, 200, 150, lin('#00C4CC', '#2DD4A3'), { radius: 16 }),
      txt('EXPERIENCE', 60, 550, 600, { fontSize: 18, fontWeight: 700, letterSpacing: 4, color: '#7D2AE8' }),
      txt('Lead Designer — Studio Mono (2022–now)\nRebranded 14 consumer apps; led a team of 6.\n\nVisual Designer — Brightside (2019–2022)\nDesigned campaigns reaching 20M people.', 60, 590, 674, { fontSize: 17, color: '#2A2D38', lineHeight: 1.7 }),
      txt('TOOLS', 60, 880, 600, { fontSize: 18, fontWeight: 700, letterSpacing: 4, color: '#7D2AE8' }),
      txt('Illustration · Motion · Typography · Prototyping', 60, 920, 674, { fontSize: 17, color: '#2A2D38' }),
    ])],
  },
  {
    id: 'tpl-logo-tech', name: 'Tech Brand Geometric Logo', category: 'Logos', pro: false, width: 500, height: 500,
    colors: ['#0E0F14', '#00C4CC', '#7D2AE8'],
    pages: [page('#0E0F14', [
      shp('hexagon', 150, 80, 200, 180, lin('#00C4CC', '#7D2AE8'), { name: 'Emblem' }),
      shp('hexagon', 190, 115, 120, 110, '#0E0F14'),
      txt('N', 190, 122, 120, { fontFamily: 'Space Grotesk', fontSize: 80, fontWeight: 700, align: 'center', lineHeight: 1.2 }),
      txt('NEXORA', 50, 300, 400, { fontFamily: 'Space Grotesk', fontSize: 56, fontWeight: 700, letterSpacing: 10, align: 'center' }),
      txt('CLOUD SYSTEMS', 50, 380, 400, { fontSize: 18, letterSpacing: 8, align: 'center', color: '#00C4CC' }),
    ], { type: 'pop', duration: 0.5, delay: 0 })],
  },
  {
    id: 'tpl-logo-esports', name: 'Esports Mascot Badge', category: 'Logos', pro: true, width: 500, height: 500,
    colors: ['#0A0A12', '#FF007F', '#7D2AE8', '#00C4CC'],
    pages: [page('#0A0A12', [
      shp('roundedRect', 130, 60, 240, 220, lin('#FF007F', '#7D2AE8', 180), { radius: 20, name: 'Shield' }),
      shp('triangle', 130, 270, 240, 130, '#7D2AE8', { rotation: 180 }),
      shp('star', 180, 100, 140, 140, '#00C4CC'),
      txt('VIPERS', 40, 300, 420, { fontFamily: 'Oswald', fontSize: 100, fontWeight: 700, italic: true, align: 'center', glow: true, rotation: -4, lineHeight: 1.1 }),
      ...pillText('ESPORTS', 130, 440, 240, 42, '#00C4CC', '#0A0A12', 24),
    ])],
  },
  {
    id: 'tpl-poster-festival', name: 'Electronic Music Festival Poster', category: 'Posters', pro: true, width: 1080, height: 1350,
    colors: ['#F2EDE4', '#FF4D1F', '#141518'],
    pages: [page('#F2EDE4', [
      shp('circle', 480, -120, 760, 760, '#FF4D1F'),
      shp('circle', 620, 60, 480, 480, '#141518'),
      txt('PULSE\nWAVE', 50, 200, 760, { fontFamily: 'Oswald', fontSize: 220, fontWeight: 700, lineHeight: 0.95, color: '#141518' }),
      txt('ELECTRONIC MUSIC FESTIVAL', 55, 640, 900, { fontSize: 34, fontWeight: 700, letterSpacing: 6, color: '#141518' }),
      shp('rect', 0, 720, 1080, 18, '#141518'),
      shp('rect', 0, 760, 1080, 18, '#141518'),
      shp('rect', 0, 800, 1080, 18, '#141518'),
      txt('KORA VEX · NIGHTLINE\nSOLAR TWINS · DJ MIRA\nECHO PARK · LUMEN', 60, 870, 760, { fontFamily: 'Oswald', fontSize: 56, lineHeight: 1.25, color: '#141518' }),
      shp('circle', 820, 1090, 200, 200, '#141518'),
      txt('12—14\nJUL', 820, 1140, 200, { fontFamily: 'Oswald', fontSize: 42, fontWeight: 700, align: 'center', color: '#F2EDE4', lineHeight: 1.1 }),
      txt('berlin · open air', 60, 1240, 600, { fontSize: 30, color: '#141518' }),
    ])],
  },
  {
    id: 'tpl-menu-cafe', name: 'Modern Cafe Menu Flyer', category: 'Flyers', pro: false, width: 1080, height: 1350,
    colors: ['#F4EBDD', '#5B3A29', '#A0714F', '#E3C9A8'],
    pages: (['COFFEE MENU', 'PASTRIES'] as const).map((title, i) =>
      page('#F4EBDD', [
        shp('circle', -80, 1150, 260, 260, '#E3C9A8'),
        txt('Brew & Bloom', 0, 80, 1080, { fontFamily: 'Pacifico', fontSize: 96, align: 'center', color: '#5B3A29', lineHeight: 1.4 }),
        txt(title, 0, 230, 1080, { fontSize: 28, fontWeight: 600, letterSpacing: 10, align: 'center', color: '#A0714F' }),
        shp('rect', 440, 290, 200, 3, '#A0714F'),
        shp('roundedRect', 90, 340, 900, 760, '#FFF9F0', { radius: 36, shadow: true }),
        txt(i === 0 ? 'Espresso\nCappuccino\nFlat White\nCaramel Latte\nCold Brew\nMatcha Latte' : 'Butter Croissant\nPain au Chocolat\nCinnamon Roll\nBlueberry Muffin\nAlmond Tart\nBanana Bread', 150, 400, 560, { fontFamily: 'Playfair Display', fontSize: 44, lineHeight: 1.9, color: '#3E2A1E' }),
        txt(i === 0 ? '$3.0\n$4.5\n$4.8\n$5.2\n$4.9\n$5.5' : '$3.2\n$3.8\n$4.2\n$3.5\n$4.6\n$3.9', 730, 400, 200, { fontFamily: 'Playfair Display', fontSize: 44, lineHeight: 1.9, color: '#A0714F', align: 'right' }),
        txt('Open daily 7am – 6pm · 21 Maple St.', 0, 1180, 1080, { fontSize: 28, align: 'center', color: '#5B3A29' }),
      ]),
    ),
  },
  {
    id: 'tpl-bizcard', name: 'Executive Dark Business Card', category: 'Business Cards', pro: true, width: 1050, height: 600,
    colors: ['#111214', '#C9A86A', '#F5F1E8'],
    pages: [page('#111214', [
      shp('rect', 0, 0, 12, 600, lin('#C9A86A', '#7D5A2A', 180)),
      shp('circle', 80, 80, 110, 110, 'rgba(0,0,0,0)', { stroke: '#C9A86A', strokeWidth: 3 }),
      txt('JM', 80, 108, 110, { fontFamily: 'Playfair Display', fontSize: 44, align: 'center', color: '#C9A86A' }),
      txt('James Morgan', 80, 300, 600, { fontFamily: 'Playfair Display', fontSize: 64, color: '#F5F1E8' }),
      txt('Managing Partner', 80, 390, 600, { fontSize: 24, letterSpacing: 4, color: '#C9A86A', uppercase: true }),
      shp('rect', 640, 350, 340, 2, 'rgba(201,168,106,0.4)'),
      txt('james@morgan.co\n+44 20 7946 0958\nmorgan.co', 640, 380, 340, { fontSize: 22, align: 'right', color: '#BDB7AA', lineHeight: 1.6 }),
    ])],
  },
  {
    id: 'tpl-linkedin', name: 'LinkedIn Developer Banner', category: 'Banners', pro: false, width: 1584, height: 396,
    colors: ['#0D1117', '#00C4CC', '#7D2AE8'],
    pages: [page('#0D1117', [
      img(GRID_PATTERN, 0, 0, 1584, 396, { name: 'Grid' }),
      shp('circle', 1000, -200, 700, 700, rad('rgba(0,196,204,0.35)', 'rgba(0,196,204,0)')),
      txt('Building fast, accessible\nweb products.', 560, 80, 900, { fontFamily: 'Space Grotesk', fontSize: 54, fontWeight: 700, lineHeight: 1.15 }),
      ...(['React', 'TypeScript', 'Next.js', 'Go'] as const).flatMap((t, i) =>
        pillText(t, 560 + i * 170, 260, 150, 50, 'rgba(255,255,255,0.06)', '#E6EDF3', 20, { stroke: 'rgba(0,196,204,0.6)', strokeWidth: 2 }),
      ),
      txt('</>', 1360, 130, 180, { fontFamily: 'JetBrains Mono', fontSize: 80, fontWeight: 700, color: '#00C4CC', glow: true }),
    ])],
  },
  {
    id: 'tpl-flash-sale', name: 'Flash Sale Promo Banner', category: 'Banners', pro: true, width: 1200, height: 628,
    colors: ['#FFD400', '#FF007F', '#141518'],
    pages: [page('#FFD400', [
      shp('rect', -100, -120, 1500, 160, '#FF007F', { rotation: -8 }),
      shp('rect', -100, 430, 1500, 200, '#141518', { rotation: -8 }),
      txt('FLASH SALE', 60, 90, 760, { fontFamily: 'Oswald', fontSize: 110, fontWeight: 700, color: '#141518' }),
      txt('50% OFF', 60, 200, 780, { fontFamily: 'Oswald', fontSize: 190, fontWeight: 700, color: '#FF007F', lineHeight: 1.05 }),
      txt('Ends tonight at midnight', 80, 470, 700, { fontSize: 40, fontWeight: 700, color: '#FFD400', rotation: -8 }),
      shp('star', 930, 40, 190, 190, '#FF007F', { rotation: 15 }),
      ...pillText('SHOP NOW', 860, 260, 280, 90, '#141518', '#FFD400', 36),
    ], { type: 'pop', duration: 0.45, delay: 0 })],
  },
];

export const TEMPLATE_CATEGORIES = Array.from(new Set(TEMPLATES.map((t) => t.category)));

export const PRESETS: DesignPreset[] = [
  { id: 'yt', label: 'YouTube Thumbnail', width: 1280, height: 720, group: 'Videos' },
  { id: 'ig', label: 'Instagram Post', width: 1080, height: 1080, group: 'Social Media' },
  { id: 'tt', label: 'TikTok / Reels', width: 1080, height: 1920, group: 'Social Media' },
  { id: 'pres', label: 'Presentation 16:9', width: 1920, height: 1080, group: 'Presentations' },
  { id: 'a4', label: 'A4 Resume', width: 794, height: 1123, group: 'Docs' },
  { id: 'logo', label: 'Logo', width: 500, height: 500, group: 'Social Media' },
  { id: 'wb', label: 'Whiteboard', width: 1920, height: 1440, group: 'Whiteboards' },
  { id: 'video', label: 'Video 1080p', width: 1920, height: 1080, group: 'Videos' },
  { id: 'web', label: 'Website Hero', width: 1440, height: 900, group: 'Websites' },
  { id: 'doc', label: 'Doc', width: 816, height: 1056, group: 'Docs' },
];

export const HOME_TABS = ['For you', 'Docs', 'Whiteboards', 'Presentations', 'Social Media', 'Videos', 'Websites', 'Custom Size'] as const;

export const MAGIC_SIZES = [
  { label: 'Instagram Post', width: 1080, height: 1080 },
  { label: 'YouTube Thumbnail', width: 1280, height: 720 },
  { label: 'TikTok / Story', width: 1080, height: 1920 },
  { label: 'Presentation', width: 1920, height: 1080 },
];

export const FONT_COMBOS: FontCombo[] = [
  { id: 'fc-cyber', name: 'Cyber Glitch', heading: { text: 'SYSTEM ONLINE', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 72, color: '#00F0FF', glow: true, letterSpacing: 4 }, sub: { text: '> access granted', fontFamily: 'JetBrains Mono', fontSize: 28, color: '#FF007F' } },
  { id: 'fc-lux', name: 'Luxury Editorial', heading: { text: 'Maison Lumière', fontFamily: 'Playfair Display', fontWeight: 700, italic: true, fontSize: 76, color: '#C8A97E' }, sub: { text: 'AUTUMN COLLECTION', fontFamily: 'Inter', fontSize: 22, letterSpacing: 10, color: '#E8E6E3' } },
  { id: 'fc-yt', name: 'Youtube Clickbait Bold', heading: { text: 'YOU WON’T BELIEVE THIS', fontFamily: 'Oswald', fontWeight: 700, fontSize: 88, color: '#FFD400', uppercase: true, shadow: true }, sub: { text: 'gone wrong (not clickbait)', fontFamily: 'Inter', fontWeight: 800, fontSize: 34, color: '#FFFFFF' } },
  { id: 'fc-term', name: 'Code Terminal', heading: { text: 'npm run ship', fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: 64, color: '#7EE787' }, sub: { text: '// compiled in 0.4s', fontFamily: 'JetBrains Mono', fontSize: 26, color: '#8B949E' } },
  { id: 'fc-neon', name: 'Neon Glow', heading: { text: 'Open Late', fontFamily: 'Pacifico', fontSize: 96, color: '#FF4FD8', glow: true }, sub: { text: 'COCKTAILS · MUSIC', fontFamily: 'Oswald', fontSize: 30, letterSpacing: 8, color: '#00F0FF', glow: true } },
  { id: 'fc-swiss', name: 'Minimal Swiss', heading: { text: 'Form follows function.', fontFamily: 'Inter', fontWeight: 800, fontSize: 70, color: '#FFFFFF', letterSpacing: -2 }, sub: { text: 'Design principles, vol. 2', fontFamily: 'Inter', fontSize: 26, color: '#9AA0AE' } },
  { id: 'fc-retro', name: 'Retro Diner', heading: { text: 'Good Vibes', fontFamily: 'Pacifico', fontSize: 84, color: '#FF6B6B' }, sub: { text: 'EST. 1985', fontFamily: 'Oswald', fontWeight: 700, fontSize: 32, letterSpacing: 10, color: '#FECA57' } },
  { id: 'fc-startup', name: 'Startup Clean', heading: { text: 'Launch week', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 80, color: '#FFFFFF' }, sub: { text: 'Five days. Five drops.', fontFamily: 'Inter', fontWeight: 500, fontSize: 30, color: '#00C4CC' } },
];
