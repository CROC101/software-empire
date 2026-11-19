// Writes public/icon-192.png and public/icon-512.png: the original Sonora mark
// (white disc, four black bars) on #121212. Run once: node scripts/make-icons.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};

// Bars in the 32-unit logo grid: [x, y, w, h], same as components/layout/Logo.tsx.
const BARS = [[8, 13, 3, 8], [12.5, 9, 3, 14], [17, 11, 3, 11], [21.5, 14, 3, 6]];

function pixel(u, v) {
  // u, v in logo units (0..32); disc fills 80% of the icon so it survives maskable cropping.
  const d = Math.hypot(u - 16, v - 16);
  if (d > 16) return [18, 18, 18];
  for (const [x, y, w, h] of BARS) {
    const r = 1.5;
    const cx = Math.min(Math.max(u, x + r), x + w - r);
    const cy = Math.min(Math.max(v, y + r), y + h - r);
    if (Math.hypot(u - cx, v - cy) <= r) return [0, 0, 0];
  }
  return [255, 255, 255];
}

function png(size) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  const scale = 32 / (size * 0.8);
  const off = size * 0.1;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel((x + 0.5 - off) * scale, (y + 0.5 - off) * scale);
      const i = y * (size * 3 + 1) + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

for (const s of [192, 512]) writeFileSync(new URL(`../public/icon-${s}.png`, import.meta.url), png(s));
console.log('icons written');
