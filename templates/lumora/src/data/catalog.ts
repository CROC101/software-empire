// 28 original, fictional titles (films + multi-season series). All names, people and synopses are made up.
import { backdrop, boxart, poster, stillFrame, type Palette } from '../lib/art';
import { brand } from '../brand.config';

export type Kind = 'movie' | 'series';
export interface Episode {
  id: string;
  season: number;
  number: number;
  title: string;
  synopsis: string;
  duration: number; // seconds (display only, playback uses media length)
  still: string;
  video: string;
}
export interface Season {
  number: number;
  episodes: Episode[];
}
export interface Title {
  id: string;
  title: string;
  kind: Kind;
  year: number;
  maturity: '7+' | '13+' | '16+' | '18+' | 'ทั่วไป';
  match: number;
  durationLabel: string;
  genres: string[];
  tags: string[];
  cast: string[];
  creators: string[];
  synopsis: string;
  quality: { uhd: boolean; spatial: boolean };
  isNew: boolean;
  poster: string;
  backdrop: string;
  boxart: string;
  trailer: string;
  video: string;
  seasons: Season[];
  extras: { id: string; title: string; still: string; video: string }[];
}

const LOCAL = ['/media/clip-a.mp4', '/media/clip-b.mp4', '/media/clip-c.mp4'];
// Open-source Blender Foundation films (CC-BY), used only when brand.useOpenSourceStreams is true.
const REMOTE = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
];
const FEATURE = '/media/feature.mp4';
const src = (i: number, full = false) =>
  brand.useOpenSourceStreams ? REMOTE[i % REMOTE.length] : full ? FEATURE : LOCAL[i % LOCAL.length];

const PALETTES: Palette[] = [
  ['#3a0ca3', '#0b0b1e', '#f72585'],
  ['#7f1d1d', '#0a0a0a', '#f59e0b'],
  ['#064e3b', '#020617', '#34d399'],
  ['#1e3a8a', '#030712', '#60a5fa'],
  ['#78350f', '#1c1917', '#fbbf24'],
  ['#581c87', '#111827', '#e879f9'],
  ['#134e4a', '#0f172a', '#5eead4'],
  ['#9f1239', '#18181b', '#fda4af'],
  ['#1f2937', '#000000', '#e50914'],
  ['#365314', '#0c0a09', '#bef264'],
];

type Seed = [title: string, kind: Kind, year: number, maturity: Title['maturity'], genres: string[], tags: string[], synopsis: string, seasons?: number];
const SEEDS: Seed[] = [
  ['Midnight Harbor', 'series', 2026, '16+', ['ซีรีส์ระทึกขวัญ', 'อาชญากรรม'], ['ลุ้นระทึก', 'มืดหม่น'], 'นักสืบหญิงกลับบ้านเกิดริมทะเล เพื่อไขคดีเรือหายที่พ่อของเธอเคยปิดไม่ลง', 3],
  ['Paper Lanterns', 'movie', 2025, '13+', ['ภาพยนตร์โรแมนติก', 'ดราม่า'], ['อบอุ่นหัวใจ', 'โรแมนติก'], 'ช่างทำโคมกระดาษกับนักดนตรีข้างถนน ได้พบกันในคืนเทศกาลที่ฝนตกหนักที่สุดในรอบสิบปี'],
  ['Orbit Kitchen', 'series', 2024, 'ทั่วไป', ['รายการเรียลลิตี้', 'อาหาร'], ['สนุกสนาน', 'สร้างแรงบันดาลใจ'], 'เชฟหกคนต้องทำอาหารบนสถานีอวกาศจำลอง ใครพลาดต้องกลับโลกก่อน', 2],
  ['The Quiet Valley', 'movie', 2023, '16+', ['ภาพยนตร์สยองขวัญ'], ['น่าขนลุก', 'ลุ้นระทึก'], 'ครอบครัวหนึ่งย้ายเข้าบ้านกลางหุบเขา ที่ทุกเสียงดังจะทำให้บางอย่างตื่นขึ้น'],
  ['Neon Runners', 'series', 2026, '16+', ['ซีรีส์แอ็คชั่น', 'ไซไฟ'], ['ตื่นเต้น', 'อนาคต'], 'แก๊งส่งของใต้ดินในเมืองแห่งแสงไฟ รับงานที่อาจล้มทั้งระบบเมือง', 2],
  ['Grandma’s Recipe', 'movie', 2022, 'ทั่วไป', ['ภาพยนตร์ครอบครัว', 'คอมเมดี้'], ['อบอุ่นหัวใจ', 'ตลก'], 'หลานสามคนแข่งกันหาสูตรแกงลับของยายให้ทันงานวันเกิดครบแปดสิบ'],
  ['Steel Monsoon', 'movie', 2026, '18+', ['ภาพยนตร์แอ็คชั่น'], ['ดุเดือด', 'ตื่นเต้น'], 'อดีตนักบินกู้ภัยต้องพาคนทั้งเกาะหนีพายุที่ใหญ่ที่สุดในประวัติศาสตร์'],
  ['Echoes of Siam', 'series', 2025, '13+', ['ซีรีส์ย้อนยุค', 'ดราม่า'], ['ย้อนยุค', 'ทรงพลัง'], 'เรื่องราวสามรุ่นของตระกูลช่างทอผ้า ตั้งแต่ยุคเรือสำเภาถึงยุคโรงงาน', 3],
  ['Pixel Pals', 'series', 2024, '7+', ['รายการเด็ก', 'แอนิเมชัน'], ['สดใส', 'ตลก'], 'เพื่อนซี้ตัวพิกเซลออกผจญภัยในเกมที่เปลี่ยนด่านทุกวัน', 2],
  ['Last Train to Chiang Rai', 'movie', 2021, '13+', ['ภาพยนตร์ดราม่า'], ['ซึ้ง', 'การเดินทาง'], 'คนแปลกหน้าสองคนบนรถไฟเที่ยวสุดท้าย แลกเรื่องเล่าที่ไม่เคยบอกใคร'],
  ['Code Zero', 'series', 2026, '16+', ['ซีรีส์ระทึกขวัญ', 'ไซไฟ'], ['ฉลาด', 'ลุ้นระทึก'], 'โปรแกรมเมอร์สาวพบว่าแอปที่เธอเขียนเริ่มทำนายอาชญากรรมได้จริง', 2],
  ['Mango Season', 'movie', 2024, 'ทั่วไป', ['ภาพยนตร์โรแมนติก', 'คอมเมดี้'], ['ตลก', 'โรแมนติก'], 'ทายาทสวนมะม่วงกับนักวิจารณ์อาหารหัวแข็ง ต้องร่วมมือกันกู้แบรนด์ครอบครัว'],
  ['Deep Blue Archive', 'series', 2023, 'ทั่วไป', ['สารคดี'], ['น่าตื่นตา', 'ธรรมชาติ'], 'ดำดิ่งสู่ท้องทะเลลึกที่กล้องยังไม่เคยไปถึง พร้อมเสียงบรรยายชวนฟัง', 2],
  ['Ghost Market', 'movie', 2025, '16+', ['ภาพยนตร์สยองขวัญ', 'คอมเมดี้'], ['น่าขนลุก', 'ตลก'], 'พ่อค้าตลาดนัดกลางคืนพบว่าลูกค้าบางคนจ่ายเงินด้วยเหรียญที่เลิกใช้ไปแล้วร้อยปี'],
  ['Skyward', 'movie', 2026, '7+', ['แอนิเมชัน', 'ภาพยนตร์ครอบครัว'], ['สร้างแรงบันดาลใจ', 'ผจญภัย'], 'เด็กหญิงประดิษฐ์ว่าวยักษ์ เพื่อพาเมืองทั้งเมืองบินหนีน้ำท่วม'],
  ['The Accountant’s Daughter', 'series', 2025, '16+', ['ซีรีส์อาชญากรรม', 'ดราม่า'], ['ฉลาด', 'มืดหม่น'], 'ลูกสาวนักบัญชีที่หายตัวไป ไล่ตามรอยเงินที่โยงถึงคนใหญ่คนโต', 2],
  ['Stand-Up Saturday', 'series', 2024, '18+', ['สแตนด์อัพคอมเมดี้'], ['ตลก', 'กวน'], 'นักเล่าเรื่องรุ่นใหม่ขึ้นเวทีทุกคืนวันเสาร์ แบบไม่มีบทและไม่มีกั๊ก', 1],
  ['Iron Petals', 'movie', 2023, '16+', ['ภาพยนตร์แอ็คชั่น', 'ดราม่า'], ['ดุเดือด', 'ทรงพลัง'], 'นักมวยหญิงวัยสี่สิบกลับขึ้นสังเวียน เพื่อชิงค่ายมวยของพ่อคืน'],
  ['Small Town Signals', 'series', 2026, '13+', ['ซีรีส์ไซไฟ', 'วัยรุ่น'], ['ลึกลับ', 'วัยรุ่น'], 'วิทยุเก่าในห้องเก็บของโรงเรียน เริ่มรับสัญญาณจากอีกยี่สิบปีข้างหน้า', 2],
  ['Wild Kingdoms', 'series', 2022, 'ทั่วไป', ['สารคดี', 'ธรรมชาติ'], ['น่าตื่นตา', 'ผ่อนคลาย'], 'ตามติดสัตว์ป่าห้าทวีปตลอดหนึ่งปี ในฤดูกาลที่ตัดสินชีวิต', 1],
  ['Velvet Static', 'movie', 2024, '13+', ['ภาพยนตร์ดนตรี', 'ดราม่า'], ['มีสไตล์', 'ซึ้ง'], 'วงดนตรีอินดี้ที่แตกวงไปสิบปี ได้รับข้อเสนอเล่นคอนเสิร์ตครั้งสุดท้าย'],
  ['Rice Field Detective', 'series', 2025, '13+', ['ซีรีส์อาชญากรรม', 'คอมเมดี้'], ['ตลก', 'ฉลาด'], 'ตำรวจเมืองกรุงถูกย้ายมาประจำหมู่บ้าน ที่คดีเล็กๆ ไม่เคยเล็กอย่างที่คิด', 2],
  ['Afterglow', 'movie', 2026, '16+', ['ภาพยนตร์โรแมนติก', 'ไซไฟ'], ['โรแมนติก', 'ลึกลับ'], 'ทุกครั้งที่พระอาทิตย์ตก เขาจะลืมเธอ และเธอต้องทำให้เขารักอีกครั้ง'],
  ['Kaiju Kindergarten', 'series', 2024, '7+', ['รายการเด็ก', 'แอนิเมชัน'], ['สดใส', 'ตลก'], 'สัตว์ประหลาดตัวจิ๋วไปโรงเรียนอนุบาลวันแรก แต่เพื่อนๆ ตัวโตกว่าตึก', 2],
  ['Borderline', 'movie', 2022, '18+', ['ภาพยนตร์ระทึกขวัญ'], ['ลุ้นระทึก', 'มืดหม่น'], 'ล่ามที่ด่านชายแดนได้ยินบทสนทนาที่ไม่ควรได้ยิน และมีเวลาแค่หนึ่งคืน'],
  ['The Long Table', 'series', 2026, 'ทั่วไป', ['รายการเรียลลิตี้', 'อาหาร'], ['อบอุ่นหัวใจ', 'สนุกสนาน'], 'ครอบครัวสองฝั่งต้องร่วมโต๊ะอาหารทุกสัปดาห์ ก่อนงานแต่งของลูกๆ', 1],
  ['Saltwater Saints', 'movie', 2025, '13+', ['ภาพยนตร์ผจญภัย'], ['ผจญภัย', 'ตื่นเต้น'], 'เด็กชาวเลสามคนออกตามหาเรืออับปางในตำนาน ก่อนนายทุนจะมาถึง'],
  ['Hyperlocal', 'series', 2025, '16+', ['ซีรีส์คอมเมดี้'], ['กวน', 'ตลก'], 'สำนักข่าวเล็กที่สุดในประเทศ ทำข่าวได้แค่ซอยเดียว แต่ดราม่าไม่แพ้ช่องใหญ่', 2],
];

const FIRST = ['ณิชา', 'ภาคิน', 'ธารา', 'กันต์', 'พิมพ์', 'วศิน', 'มายด์', 'ปวริศ', 'ชนม์', 'อรุณ', 'ไอริน', 'ต้นกล้า'];
const LAST = ['ศรีสุข', 'ทองดี', 'วงศ์ใหญ่', 'แก้วงาม', 'มั่นคง', 'บุญมา', 'รุ่งเรือง', 'ใจดี'];
const EP_WORDS = ['จุดเริ่มต้น', 'เงาในน้ำ', 'คำสัญญา', 'ทางแยก', 'คืนที่ไม่มีดาว', 'ความลับ', 'กลับบ้าน', 'บทสุดท้าย'];

const pad = (n: number) => String(n).padStart(2, '0');

export const TITLES: Title[] = SEEDS.map((s, i) => {
  const [title, kind, year, maturity, genres, tags, synopsis, seasonCount = 0] = s;
  const id = String(81000 + i * 37);
  const pal = PALETTES[i % PALETTES.length];
  const kindArt = i % 5;
  const name = (k: number) => `${FIRST[(i * 3 + k) % FIRST.length]} ${LAST[(i + k * 5) % LAST.length]}`;
  const seasons: Season[] = Array.from({ length: seasonCount }, (_, si) => ({
    number: si + 1,
    episodes: Array.from({ length: 6 + ((i + si) % 3) * 2 }, (_, ei) => ({
      id: `${id}-s${si + 1}e${ei + 1}`,
      season: si + 1,
      number: ei + 1,
      title: `ตอนที่ ${ei + 1}: ${EP_WORDS[(ei + si + i) % EP_WORDS.length]}`,
      synopsis: `${synopsis.split(' ')[0]} — เรื่องราวในตอนนี้พาไปสู่${EP_WORDS[(ei + 2) % EP_WORDS.length]} ที่ทุกคนต้องเลือกทางของตัวเอง`,
      duration: (38 + ((ei * 7 + i) % 20)) * 60,
      still: stillFrame(i * 100 + si * 10 + ei + 3, pal, (kindArt + ei) % 5),
      video: src(i + ei, true),
    })),
  }));
  const minutes = 88 + ((i * 13) % 50);
  return {
    id,
    title,
    kind,
    year,
    maturity,
    match: 72 + ((i * 7) % 27),
    durationLabel: kind === 'movie' ? `${Math.floor(minutes / 60)} ชม. ${pad(minutes % 60)} นาที` : `${seasonCount} ซีซั่น`,
    genres,
    tags,
    cast: [name(0), name(1), name(2), name(3)],
    creators: [name(4)],
    synopsis,
    quality: { uhd: i % 3 !== 1, spatial: i % 4 === 0 },
    isNew: year >= 2026,
    poster: poster(i + 11, title, pal, kindArt),
    backdrop: backdrop(i + 11, null, pal, kindArt),
    boxart: boxart(i + 11, title, pal, kindArt),
    trailer: src(i),
    video: src(i, true),
    seasons,
    extras: [0, 1, 2].map((k) => ({ id: `${id}-x${k}`, title: k === 0 ? 'ตัวอย่างหลัก' : k === 1 ? 'ทีเซอร์' : 'เบื้องหลังการถ่ายทำ', still: stillFrame(i * 7 + k + 900, pal, (kindArt + k + 1) % 5), video: src(i + k + 1) })),
  };
});

export const byId = (id: string) => TITLES.find((t) => t.id === id);

export const GENRES = Array.from(new Set(TITLES.flatMap((t) => t.genres))).sort();

export function similarTo(t: Title, n = 9) {
  const score = (o: Title) => o.genres.filter((g) => t.genres.includes(g)).length * 2 + o.tags.filter((g) => t.tags.includes(g)).length + (o.kind === t.kind ? 0.5 : 0);
  return TITLES.filter((o) => o.id !== t.id).sort((a, b) => score(b) - score(a)).slice(0, n);
}

export function search(q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return TITLES.filter((t) => [t.title, ...t.cast, ...t.creators, ...t.genres, ...t.tags].some((f) => f.toLowerCase().includes(s)));
}

export interface RowDef {
  id: string;
  title: string;
  items: Title[];
  variant?: 'top10' | 'continue';
}

const pick = (f: (t: Title) => boolean) => TITLES.filter(f);
const rotate = <T,>(a: T[], k: number) => a.slice(k).concat(a.slice(0, k));

export function homeRows(filter: 'all' | 'tv' | 'movies' = 'all', genre?: string): RowDef[] {
  const pool = TITLES.filter((t) => (filter === 'all' ? true : filter === 'tv' ? t.kind === 'series' : t.kind === 'movie')).filter((t) => !genre || t.genres.includes(genre));
  const rows: RowDef[] = [
    { id: 'trending', title: 'กำลังฮิต', items: rotate(pool, 3) },
    { id: 'top10', title: filter === 'movies' ? 'ภาพยนตร์ 10 อันดับแรกในประเทศไทยวันนี้' : filter === 'tv' ? 'ซีรีส์ 10 อันดับแรกในประเทศไทยวันนี้' : '10 อันดับแรกในประเทศไทยวันนี้', items: rotate(pool, 1).slice(0, 10), variant: 'top10' },
    { id: 'new', title: 'มาใหม่', items: pool.filter((t) => t.year >= 2025) },
  ];
  const genres = Array.from(new Set(pool.flatMap((t) => t.genres)));
  for (const g of genres) {
    const items = pool.filter((t) => t.genres.includes(g));
    if (items.length >= 2) rows.push({ id: `g-${g}`, title: g, items });
  }
  rows.push({ id: 'critics', title: 'ยอดนิยมจากนักวิจารณ์', items: pick((t) => t.match > 88 && pool.includes(t)) });
  return rows.filter((r) => r.items.length > 0);
}
