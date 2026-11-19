import type {
  Comment, Creator, Drama, Music, Notice, Order, Product, Thread, Video, Voucher, LogisticsEvent,
} from '@/types/tiktok';

export const ME = 'crocbyte';
const S = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/';

export const creators: Creator[] = [
  { handle: 'crocbyte', name: 'Croc Byte', bio: 'Building things at night. Desk setups, code & coffee.', verified: false, isShop: false, hue: ['#10b981', '#064e3b'], followers: 1284, following: 6, likes: 20450 },
  { handle: 'crocbyte_official', name: 'CrocByte Official', bio: 'Official store • Tech lifestyle drops every Friday', link: 'crocbyte.shop/drops', verified: true, isShop: true, hue: ['#22c55e', '#14532d'], followers: 812000, following: 12, likes: 9400000, rating: 4.9 },
  { handle: 'mech_keyboards_th', name: 'Mech Keyboards TH', bio: 'Custom keyboards, switches & sound tests. Ships from Bangkok.', link: 'mechkb.th/store', verified: true, isShop: true, hue: ['#f59e0b', '#7c2d12'], followers: 455000, following: 41, likes: 6100000, rating: 4.8 },
  { handle: 'cyber_gear', name: 'Cyber Gear', bio: 'RGB everything. Chargers, lights, cables that last.', link: 'cybergear.store', verified: true, isShop: true, hue: ['#8b5cf6', '#1e1b4b'], followers: 298000, following: 18, likes: 3800000, rating: 4.7 },
  { handle: 'synth_studio', name: 'Synth Studio', bio: 'Beats, synths and studio audio gear reviews.', link: 'synthstudio.fm', verified: true, isShop: true, hue: ['#ec4899', '#4a044e'], followers: 640000, following: 77, likes: 12000000, rating: 4.9 },
  { handle: 'ai_builders', name: 'AI Builders', bio: 'Ship AI apps in public. Daily coding clips.', link: 'aibuilders.dev', verified: true, isShop: false, hue: ['#06b6d4', '#083344'], followers: 1210000, following: 103, likes: 21000000 },
  { handle: 'bts_official_bighit', name: 'Bright Seven', bio: 'New single out now', link: 'brightseven.example/new', verified: true, isShop: false, hue: ['#1f2937', '#000000'], followers: 81100000, following: 4, likes: 1800000000 },
  { handle: 'nina.codes', name: 'Nina Codes', bio: 'Frontend dev • cats', verified: false, isShop: false, hue: ['#f97316', '#7c2d12'], followers: 5400, following: 230, likes: 81000 },
  { handle: 'ploy.travels', name: 'Ploy Travels', bio: 'Weekend trips around Thailand', verified: false, isShop: false, hue: ['#14b8a6', '#134e4a'], followers: 12800, following: 340, likes: 230000 },
  { handle: 'tor_dev', name: 'Tor Dev', bio: 'Rust + coffee', verified: false, isShop: false, hue: ['#3b82f6', '#1e3a8a'], followers: 2100, following: 150, likes: 19000 },
  { handle: 'mint.makes', name: 'Mint Makes', bio: 'DIY desk mods', verified: false, isShop: false, hue: ['#84cc16', '#365314'], followers: 9300, following: 410, likes: 120000 },
  // generated placeholder accounts so Following has a full suggestion grid like the capture (~40 cards)
  ...Array.from({ length: 39 }, (_, i): Creator => {
    const first = ['Aom', 'Bam', 'Mild', 'Fah', 'Ice', 'Jay', 'Kim', 'Lin', 'Max', 'Nat'][i % 10];
    const topic = ['Cooks', 'Dances', 'Draws', 'Lifts', 'Plays', 'Sings', 'Styles', 'Vlogs', 'Builds', 'Rides'][(i * 3 + Math.floor(i / 10)) % 10];
    const hues: [string, string][] = [['#f43f5e', '#4c0519'], ['#0ea5e9', '#082f49'], ['#a855f7', '#2e1065'], ['#eab308', '#422006'], ['#10b981', '#022c22'], ['#64748b', '#0f172a']];
    return { handle: `${first}.${topic}`.toLowerCase(), name: `${first} ${topic}`, bio: 'Daily clips', verified: i % 3 === 0, isShop: false, hue: hues[i % hues.length], followers: 20000 + i * 7919, following: 50 + i * 7, likes: 400000 + i * 33331 };
  }),
];

export const music: Music[] = [
  { id: 'night-drive-synth', title: 'Night Drive Synth', artist: 'synth_studio', hue: ['#ec4899', '#312e81'] },
  { id: 'thock-lofi', title: 'Thock Lo-Fi Loop', artist: 'mech_keyboards_th', hue: ['#f59e0b', '#451a03'] },
  { id: 'neon-pulse', title: 'Neon Pulse', artist: 'cyber_gear', hue: ['#8b5cf6', '#0f172a'] },
  { id: 'deploy-friday', title: 'Deploy Friday', artist: 'ai_builders', hue: ['#06b6d4', '#0c4a6e'] },
  { id: 'jungle-byte', title: 'Jungle Byte', artist: 'crocbyte_official', hue: ['#22c55e', '#052e16'] },
  { id: 'original-crocbyte', title: 'original sound', artist: 'crocbyte', hue: ['#10b981', '#022c22'] },
  { id: 'bright-seven-single', title: 'New Single', artist: 'bts_official_bighit', hue: ['#6b7280', '#111827'] },
];

export const tags = ['techtok', 'mechanicalkeyboard', 'desksetup', 'aicoding', 'fashion', 'gaming', 'music', 'lifestyle', 'tiktokshop', 'flashsale', 'synth', 'rgb'];

export const exploreCategories = ['All', 'Tech & Gadgets', 'Mechanical Keyboards', 'AI & Coding', 'Fashion', 'Gaming', 'Music', 'Lifestyle'] as const;

const v = (id: string, handle: string, file: string, caption: string, t: string[], musicId: string, hue: [string, string], category: string, likes: number, comments: number, saves: number, shares: number, productIds: string[], daysAgo: number): Video => ({
  id, handle, src: S + file, caption, tags: t, musicId, hue, category, likes, comments, saves, shares, views: likes * 9, productIds,
  createdAt: new Date(Date.UTC(2026, 10, 17) - daysAgo * 86400000).toISOString(),
});

export const videos: Video[] = [
  v('7301', 'mech_keyboards_th', 'ForBiggerBlazes.mp4', 'Sound test: lubed linear switches on an aluminium 75% board. Which one do you prefer?', ['mechanicalkeyboard', 'desksetup', 'tiktokshop'], 'thock-lofi', ['#f59e0b', '#1c1917'], 'Mechanical Keyboards', 302600, 5107, 10900, 17600, ['p1', 'p6'], 1),
  v('7302', 'crocbyte_official', 'ForBiggerEscapes.mp4', 'Desk glow-up in 30 seconds. Lamp + hoodie combo is unbeatable', ['desksetup', 'lifestyle', 'tiktokshop'], 'jungle-byte', ['#22c55e', '#0f172a'], 'Lifestyle', 128400, 2210, 8100, 4300, ['p2', 'p4'], 2),
  v('7303', 'ai_builders', 'ForBiggerFun.mp4', 'Built a voice-to-code agent in one evening. Repo in bio', ['aicoding', 'techtok'], 'deploy-friday', ['#06b6d4', '#0b1120'], 'AI & Coding', 512000, 9800, 64000, 22000, [], 1),
  v('7304', 'synth_studio', 'ForBiggerJoyrides.mp4', 'Late night jam with the new studio headphones. Bass check!', ['music', 'synth', 'tiktokshop'], 'night-drive-synth', ['#ec4899', '#1e1b4b'], 'Music', 221000, 3400, 15000, 6100, ['p3'], 3),
  v('7305', 'cyber_gear', 'ForBiggerMeltdowns.mp4', 'One charger for the whole setup: laptop, phone, earbuds at once.', ['techtok', 'rgb', 'flashsale'], 'neon-pulse', ['#8b5cf6', '#020617'], 'Tech & Gadgets', 98700, 1200, 5300, 2800, ['p5', 'p9'], 4),
  v('7306', 'mech_keyboards_th', 'BigBuckBunny.mp4', 'Building a keyboard from scratch, every step', ['mechanicalkeyboard', 'techtok'], 'thock-lofi', ['#eab308', '#292524'], 'Mechanical Keyboards', 76000, 980, 4200, 1500, ['p6'], 5),
  v('7307', 'ai_builders', 'ElephantsDream.mp4', 'Prompt engineering is dead? Here is what replaced it', ['aicoding', 'techtok'], 'deploy-friday', ['#0ea5e9', '#082f49'], 'AI & Coding', 187000, 6100, 21000, 9100, [], 6),
  v('7308', 'crocbyte_official', 'Sintel.mp4', 'Streetwear for people who code all night', ['fashion', 'lifestyle', 'tiktokshop'], 'jungle-byte', ['#16a34a', '#1f2937'], 'Fashion', 64000, 700, 3000, 900, ['p4', 'p10'], 7),
  v('7309', 'cyber_gear', 'TearsOfSteel.mp4', 'Gaming setup tour with full RGB sync', ['gaming', 'rgb', 'desksetup'], 'neon-pulse', ['#a855f7', '#111827'], 'Gaming', 143000, 2600, 9900, 3700, ['p7', 'p2'], 2),
  v('7310', 'synth_studio', 'WeAreGoingOnBullrun.mp4', 'Turning keyboard clicks into a beat', ['music', 'mechanicalkeyboard'], 'night-drive-synth', ['#db2777', '#18181b'], 'Music', 88000, 1500, 6200, 2400, ['p8'], 8),
  v('7311', 'ai_builders', 'SubaruOutbackOnStreetAndDirt.mp4', 'Road trip while my agents fix bugs. Living the dream?', ['lifestyle', 'aicoding'], 'deploy-friday', ['#22d3ee', '#164e63'], 'Lifestyle', 45000, 800, 2100, 600, [], 9),
  v('7312', 'cyber_gear', 'VolkswagenGTIReview.mp4', 'Unboxing the smartwatch everyone is asking about', ['techtok', 'flashsale'], 'neon-pulse', ['#7c3aed', '#0f172a'], 'Tech & Gadgets', 59000, 900, 2700, 1100, ['p11'], 10),
  v('7313', 'crocbyte_official', 'WhatCarCanYouGetForAGrand.mp4', 'Carry your whole desk in one bag', ['lifestyle', 'tiktokshop'], 'jungle-byte', ['#4ade80', '#14532d'], 'Lifestyle', 33000, 400, 1900, 500, ['p12'], 11),
  v('7314', 'bts_official_bighit', 'ForBiggerBlazes.mp4', 'New single out now', ['music'], 'bright-seven-single', ['#374151', '#030712'], 'Music', 2400000, 88000, 120000, 76000, [], 3),
];

const rv = (id: string, user: string, stars: number, text: string, variant: string, d: number) => ({ id, user, stars, text, variant, at: new Date(Date.UTC(2026, 9, 30) - d * 86400000).toISOString() });
const REVIEWS = [
  rv('r1', 'nina.codes', 5, 'Exactly like the video. Packaging was great and it arrived in 2 days.', '', 2),
  rv('r2', 'tor_dev', 5, 'Build quality is way better than the price suggests.', '', 5),
  rv('r3', 'ploy.travels', 4, 'Very good, colour slightly darker than photos.', '', 9),
  rv('r4', 'mint.makes', 5, 'Second one I bought. Fast shipping with Flash Express.', '', 12),
];
const reviews = (variant: string) => REVIEWS.map((r, i) => ({ ...r, id: r.id + variant + i, variant }));

function stockFor(groups: { name: string; options: string[] }[], base: number): Record<string, number> {
  if (groups.length === 0) return { '': base };
  const keys = groups.reduce<string[]>((acc, g) => acc.flatMap((a) => g.options.map((o) => (a ? a + '|' + o : o))), ['']);
  return Object.fromEntries(keys.map((k, i) => [k, Math.max(0, base - i * 7) % 61 + (i % 3 === 2 ? 0 : 4)]));
}

const p = (o: Omit<Product, 'stock' | 'reviews'> & { base: number }): Product => {
  const { base, ...rest } = o;
  const first = o.variantGroups.map((g) => g.options[0]).join(' / ');
  return { ...rest, stock: stockFor(o.variantGroups, base), reviews: reviews(first) };
};

export const products: Product[] = [
  p({ id: 'p1', name: 'Custom 75% Mechanical Keyboard (Hot-swap, Aluminium)', shopHandle: 'mech_keyboards_th', category: 'Keyboards & Gear', price: 2890, originalPrice: 3990, rating: 4.9, sold: 2400, freeShipping: true, flashSale: true, hue: ['#f59e0b', '#78350f'], icon: 'keyboard', description: 'Gasket-mount 75% layout, CNC aluminium case, south-facing RGB and pre-lubed switches. Tri-mode: USB-C, 2.4 GHz and Bluetooth.', variantGroups: [{ name: 'Switch Type', options: ['Linear Red', 'Tactile Brown', 'Clicky Blue'] }, { name: 'Color', options: ['Space Grey', 'Silver', 'Navy'] }], base: 58 }),
  p({ id: 'p2', name: 'MagSafe RGB Desk Light Bar', shopHandle: 'cyber_gear', category: 'Electronics', price: 590, originalPrice: 990, rating: 4.8, sold: 5100, freeShipping: true, flashSale: true, hue: ['#8b5cf6', '#1e1b4b'], icon: 'lamp', description: 'Monitor light bar with asymmetric beam, 16M colour back-glow and a magnetic wireless remote.', variantGroups: [{ name: 'Color', options: ['Black', 'White'] }], base: 40 }),
  p({ id: 'p3', name: 'Noise-Cancelling Studio Headphones', shopHandle: 'synth_studio', category: 'Audio', price: 3490, originalPrice: 4590, rating: 4.9, sold: 1800, freeShipping: true, flashSale: false, hue: ['#ec4899', '#500724'], icon: 'headphones', description: 'Hybrid ANC with 40 mm drivers, 60-hour battery and a flat studio EQ mode for mixing.', variantGroups: [{ name: 'Color', options: ['Midnight', 'Sand', 'Rose'] }], base: 33 }),
  p({ id: 'p4', name: 'Minimalist Tech Hoodie', shopHandle: 'crocbyte_official', category: 'Apparel', price: 790, originalPrice: 1190, rating: 4.7, sold: 3300, freeShipping: false, flashSale: true, hue: ['#22c55e', '#14532d'], icon: 'shirt', description: 'Heavyweight cotton hoodie with hidden cable pass-through pocket and reflective logo.', variantGroups: [{ name: 'Color', options: ['Black', 'Forest', 'Oat'] }, { name: 'Size', options: ['S', 'M', 'L', 'XL'] }], base: 44 }),
  p({ id: 'p5', name: 'USB-C GaN 100W Charger (4 ports)', shopHandle: 'cyber_gear', category: 'Electronics', price: 990, originalPrice: 1490, rating: 4.8, sold: 7200, freeShipping: true, flashSale: true, hue: ['#6366f1', '#0f172a'], icon: 'plug', description: 'Charge a laptop, tablet, phone and earbuds at once. Foldable plug, smart power sharing.', variantGroups: [], base: 120 }),
  p({ id: 'p6', name: 'Lubed Linear Switch Pack (70 pcs)', shopHandle: 'mech_keyboards_th', category: 'Keyboards & Gear', price: 450, originalPrice: 650, rating: 4.9, sold: 9800, freeShipping: false, flashSale: false, hue: ['#fbbf24', '#451a03'], icon: 'box', description: 'Factory-lubed 5-pin linear switches, 45 g actuation, deep thocky sound.', variantGroups: [{ name: 'Weight', options: ['45g', '55g', '63.5g'] }], base: 90 }),
  p({ id: 'p7', name: 'Ultralight Wireless Gaming Mouse', shopHandle: 'cyber_gear', category: 'Accessories', price: 1290, originalPrice: 1890, rating: 4.6, sold: 2700, freeShipping: true, flashSale: false, hue: ['#a855f7', '#2e1065'], icon: 'mouse', description: '54 g honeycomb-free shell, 26K DPI sensor and 90-hour battery.', variantGroups: [{ name: 'Color', options: ['Black', 'White', 'Lilac'] }], base: 25 }),
  p({ id: 'p8', name: 'USB Podcast Microphone', shopHandle: 'synth_studio', category: 'Audio', price: 1590, originalPrice: 2190, rating: 4.7, sold: 1100, freeShipping: true, flashSale: false, hue: ['#f472b6', '#3b0764'], icon: 'mic', description: 'Cardioid condenser mic with zero-latency monitoring and tap-to-mute.', variantGroups: [], base: 18 }),
  p({ id: 'p9', name: 'Braided USB-C Cable 240W (2 m)', shopHandle: 'cyber_gear', category: 'Accessories', price: 190, originalPrice: 350, rating: 4.8, sold: 15400, freeShipping: false, flashSale: true, hue: ['#818cf8', '#1e1b4b'], icon: 'cable', description: 'E-marker chip, 40 Gbps data and a 30,000-bend tested braid.', variantGroups: [{ name: 'Length', options: ['1 m', '2 m'] }], base: 200 }),
  p({ id: 'p10', name: 'Everyday Tech Backpack 20L', shopHandle: 'crocbyte_official', category: 'Accessories', price: 1490, originalPrice: 1990, rating: 4.8, sold: 860, freeShipping: true, flashSale: false, hue: ['#34d399', '#064e3b'], icon: 'backpack', description: 'Water-resistant shell, 16" laptop sleeve and a clam-shell main compartment.', variantGroups: [{ name: 'Color', options: ['Black', 'Olive'] }], base: 30 }),
  p({ id: 'p11', name: 'AMOLED Smartwatch with GPS', shopHandle: 'cyber_gear', category: 'Electronics', price: 2290, originalPrice: 3290, rating: 4.6, sold: 1900, freeShipping: true, flashSale: true, hue: ['#7c3aed', '#020617'], icon: 'watch', description: '1.43" AMOLED, dual-band GPS and 14-day battery.', variantGroups: [{ name: 'Strap', options: ['Silicone', 'Nylon'] }], base: 22 }),
  p({ id: 'p12', name: 'Portable Bluetooth Speaker', shopHandle: 'synth_studio', category: 'Audio', price: 1190, originalPrice: 1590, rating: 4.7, sold: 3200, freeShipping: true, flashSale: false, hue: ['#e879f9', '#4a044e'], icon: 'speaker', description: 'IP67, 20-hour playtime and stereo pairing.', variantGroups: [{ name: 'Color', options: ['Black', 'Pink', 'Teal'] }], base: 35 }),
];

export const vouchers: Voucher[] = [
  { id: 'v100', label: '฿100 OFF', detail: 'Min. spend ฿500', kind: 'amount', value: 100, minSpend: 500 },
  { id: 'vship', label: 'Free Shipping', detail: 'Covers up to ฿45 shipping', kind: 'shipping', value: 45, minSpend: 0 },
  { id: 'vcash', label: '15% Cashback', detail: 'Up to ฿150 • Min. spend ฿990', kind: 'percent', value: 15, minSpend: 990, cap: 150 },
];

export const HUBS = {
  carrierA: 'Flash Express',
  carrierB: 'Kerry Express',
};

/** The 8 logistics scans an order walks through; stage is the 5-step stepper index. */
export const SCANS: { stage: number; title: string; location: string }[] = [
  { stage: 0, title: 'Order placed', location: 'Pulse Shop' },
  { stage: 1, title: 'Seller packed the parcel, shipping label printed', location: 'Seller warehouse, Bangkok' },
  { stage: 1, title: 'Handed to courier, parcel picked up', location: 'Lat Phrao pickup point' },
  { stage: 2, title: 'Arrived at regional sorting hub', location: 'Bang Na Sorting Hub' },
  { stage: 2, title: 'Departed sorting hub', location: 'Bang Na Sorting Hub → Chiang Mai DC' },
  { stage: 2, title: 'Arrived at delivery center', location: 'Chiang Mai Delivery Center' },
  { stage: 3, title: 'Out for delivery, courier Somchai K. (081-234-5678)', location: 'Chiang Mai Delivery Center' },
  { stage: 4, title: 'Delivered & signed by recipient', location: 'Recipient address' },
];

export const STAGES = ['Order Placed', 'Seller Packed & Handed to Courier', 'In Transit at Regional Sorting Hub', 'Out for Delivery by Courier', 'Delivered & Signed'];

export const ORDER_POOL = Array.from({ length: 60 }, (_, i) => `ORD${1001 + i}`);
export const PRODUCT_POOL = Array.from({ length: 30 }, (_, i) => `pn${i + 1}`);
export const UPLOAD_POOL = Array.from({ length: 30 }, (_, i) => `u${i + 1}`);

const ev = (scan: number, iso: string): LogisticsEvent => ({ scan, stage: SCANS[scan].stage, title: SCANS[scan].title, location: SCANS[scan].location, at: iso });
const hours = (base: string, h: number) => new Date(new Date(base).getTime() + h * 3600000).toISOString();
const ADDR = { name: 'Croc Byte', phone: '081-555-0199', province: 'Chiang Mai', district: 'Mueang', postal: '50200', street: '88/12 Nimmanhaemin Rd.' };

const item = (pid: string, variantKey: string, qty: number) => {
  const pr = products.find((x) => x.id === pid)!;
  return { productId: pid, name: pr.name, variantKey, qty, price: pr.price, hue: pr.hue, icon: pr.icon, shopHandle: pr.shopHandle };
};

const T1 = '2026-11-15T09:12:00.000Z';
const T2 = '2026-11-02T14:40:00.000Z';
export const orders: Order[] = [
  { id: 'ORD1001', tracking: 'TH2026TT889412', carrier: 'Flash Express', items: [item('p1', 'Linear Red|Space Grey', 1), item('p9', '2 m', 2)], address: ADDR, shipping: 'standard', payment: 'promptpay', subtotal: 3270, shippingFee: 0, discount: 100, total: 3170, vouchers: ['v100'], createdAt: T1, events: [0, 1, 2, 3, 4].map((s) => ev(s, hours(T1, s * 6 + 1))), received: false, cancelled: false, reviewed: false },
  { id: 'ORD1002', tracking: 'TH2026TT771035', carrier: 'Kerry Express', items: [item('p3', 'Midnight', 1)], address: ADDR, shipping: 'sameday', payment: 'card', subtotal: 3490, shippingFee: 45, discount: 45, total: 3490, vouchers: ['vship'], createdAt: T2, events: [0, 1, 2, 3, 4, 5, 6, 7].map((s) => ev(s, hours(T2, s * 3 + 1))), received: true, cancelled: false, reviewed: true },
];

const c = (i: number, videoId: string, handle: string, text: string, likes: number): Comment => ({ id: `c${videoId}-${i}`, videoId, handle, text, likes, at: '2026-11-16T10:00:00.000Z' });
export const comments: Comment[] = videos.flatMap((vd) => [
  c(1, vd.id, 'nina.codes', 'This is so satisfying to watch', 1240),
  c(2, vd.id, 'tor_dev', 'Where did you get that? Link please!', 312),
  c(3, vd.id, 'ploy.travels', 'Just ordered, arrives Friday', 88),
  c(4, vd.id, 'mint.makes', 'Part 2 when?', 41),
]);

const m = (id: string, from: 'me' | 'them', text: string, at: string, card?: Thread['messages'][number]['card']) => ({ id, from, text, at, card });
export const threads: Thread[] = [
  { id: 't-mech', handle: 'mech_keyboards_th', kind: 'shop', unread: 1, messages: [
    m('m1', 'me', 'Hi! Is my keyboard shipped yet?', '2026-11-15T10:00:00.000Z', { kind: 'order', orderId: 'ORD1001' }),
    m('m2', 'them', 'Hello! Yes, it is with Flash Express now and should reach Chiang Mai tomorrow.', '2026-11-15T10:04:00.000Z'),
    m('m3', 'them', 'You may also like our switch pack, 30% off this week:', '2026-11-15T10:05:00.000Z', { kind: 'product', productId: 'p6' }),
  ] },
  { id: 't-nina', handle: 'nina.codes', kind: 'friend', unread: 2, messages: [
    m('m4', 'them', 'Did you see the keyboard sound test video?', '2026-11-16T08:30:00.000Z'),
    m('m5', 'them', 'I want that board so bad', '2026-11-16T08:31:00.000Z'),
  ] },
  { id: 't-synth', handle: 'synth_studio', kind: 'shop', unread: 0, messages: [
    m('m6', 'them', 'Thanks for your order! How are the headphones?', '2026-11-05T12:00:00.000Z', { kind: 'order', orderId: 'ORD1002' }),
    m('m7', 'me', 'Amazing, the ANC is great.', '2026-11-05T12:20:00.000Z'),
  ] },
  { id: 't-tor', handle: 'tor_dev', kind: 'friend', unread: 0, messages: [m('m8', 'them', 'Coffee tomorrow?', '2026-11-14T18:00:00.000Z')] },
];

export const notices: Notice[] = [
  { id: 'n1', text: 'Your parcel TH2026TT889412 is in transit at Bang Na Sorting Hub', at: '2h', href: '/orders/ORD1001' },
  { id: 'n2', text: 'Flash Sale starts now: up to 50% off keyboards', at: '5h', href: '/shop' },
  { id: 'n3', text: 'nina.codes liked your video', at: '1d', href: '/profile' },
  { id: 'n4', text: 'mech_keyboards_th went LIVE: Switch sound test', at: '1d', href: '/live' },
];

const shortDramaGenres = ['Fantasy', 'Workplace', 'Revenge', 'Second chance', 'Family bonds', 'Urban life', 'Secret identity', 'Married life'];
const dramaTitles: [string, string][] = [
  ['The Billionaire Next Door', 'High society'], ['Midnight Contract', 'Workplace'], ['Return of the Lost Heir', 'Family bonds'], ['Moonlit Wolf Pact', 'Fantasy'],
  ['Campus Crown', 'Urban life'], ['Second Chance Chef', 'Second chance'], ['The Silent Bodyguard', 'Action'], ['Twin Fortunes', 'Body double'],
  ['Queen of the Night Market', 'Boss lady'], ['Rise from the Rice Fields', 'Rural life'], ['Seven Brothers, One Secret', 'Family bonds'], ['The Masked Investor', 'Secret identity'],
  ['Thunder Sect Disciple', 'Cultivation'], ['Love Clause 27', 'Married life'], ['Lucky Baby Tycoon', 'Lucky baby'], ['Reborn at Eighteen', 'Transmigration'],
  ['The Vampire Landlord', 'Vampire'], ['Desert Survival Pact', 'Survival'], ['Code of the Hacker Bride', 'Workplace'], ['The Last Kingdom Chef', 'Fantasy'],
  // the captured catalogue has ~49 shows; the rest are generated placeholder titles
  ...Array.from({ length: 50 }, (_, i): [string, string] => [
    `${['The Hidden', 'Golden', 'Fallen', 'The Secret', 'Return of the', 'Crowned', 'The Fake', 'Lucky', 'The Silent', 'Reborn'][i % 10]} ${['Heiress', 'Tycoon', 'Chef', 'Bodyguard', 'Princess', 'Doctor', 'Racer', 'Landlord', 'Twin', 'Dragon', 'Teacher'][(i * 3) % 11]}${i >= 10 ? ` ${['II', 'III', 'IV', 'V'][Math.floor(i / 10) - 1]}` : ''}`,
    shortDramaGenres[i % shortDramaGenres.length],
  ]),
];
const dHues: [string, string][] = [['#b45309', '#1c1917'], ['#be123c', '#1f0a12'], ['#1d4ed8', '#020617'], ['#6d28d9', '#0f0a1e'], ['#0f766e', '#04201d'], ['#c2410c', '#1c0d05'], ['#334155', '#020617'], ['#a21caf', '#1a0520']];
export const dramas: Drama[] = dramaTitles.map(([title, genre], i) => ({
  id: 'd' + (i + 1), title, genre, episodes: 40 + ((i * 7) % 60), views: `${((i * 13.7) % 180 + 3).toFixed(1)}M`, isNew: i % 9 === 0, hue: dHues[i % dHues.length],
}));

export const shortDramaFilters = [
  ['All settings', 'Fantasy', 'Cultivation', 'Celebrity', 'Workplace', 'Werewolf', 'Martial arts', 'Survival', 'Vampire', 'High society', 'Urban life', 'Royal', 'Rural life'],
  ['All characters', 'Tangled romance', 'Revenge', 'Betrayal', 'Married life', 'Adventure', 'Mystery', 'Sudden wealth', 'Action', 'Crime', 'Sports', 'Medical'],
  ['All stories', 'Second chance', 'Body double', 'Lucky baby', 'Group favorite', 'Elite', 'Power couple', 'Boss lady', 'Secret identity', 'Transmigration', 'Family bonds'],
  ['All releases', 'In 7 Days', 'In 30 Days'],
];

export const gifts = [
  { id: 'rose', name: 'Rose', cost: 1, emoji: '🌹' },
  { id: 'gg', name: 'GG', cost: 5, emoji: '🎮' },
  { id: 'rocket', name: 'Rocket', cost: 100, emoji: '🚀' },
  { id: 'universe', name: 'Universe', cost: 500, emoji: '🌌' },
];

export const liveStreams = [
  { id: 'live1', handle: 'mech_keyboards_th', title: 'Switch sound test + Flash Sale', viewers: 12840, productId: 'p1', videoId: '7301', category: 'For You' },
  { id: 'live2', handle: 'cyber_gear', title: 'RGB setup build, ask me anything', viewers: 5310, productId: 'p2', videoId: '7309', category: 'Gaming' },
  { id: 'live3', handle: 'synth_studio', title: 'Beat making night', viewers: 8020, productId: 'p3', videoId: '7304', category: 'Following' },
];
