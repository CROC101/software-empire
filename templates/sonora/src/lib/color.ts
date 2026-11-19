import type { CoverArt } from '@/types/spotify';

/** Average colour of an image (CORS-enabled hosts only), darkened slightly so white text stays readable. */
export function extractDominantColor(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 24;
        const g = c.getContext('2d')!;
        g.drawImage(img, 0, 0, 24, 24);
        const d = g.getImageData(0, 0, 24, 24).data;
        let r = 0, gg = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) {
          const lum = d[i] + d[i + 1] + d[i + 2];
          if (lum < 40 || lum > 720) continue; // skip near-black and near-white pixels
          r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++;
        }
        if (!n) return resolve(null);
        const k = 0.85 / n;
        resolve(`#${[r, gg, b].map((v) => Math.round(v * k).toString(16).padStart(2, '0')).join('')}`);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Draws the generated cover on a canvas so the lock screen gets real artwork. */
export function coverDataUrl(cover: CoverArt, label: string, size = 512): string {
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, cover.color);
  grad.addColorStop(1, '#121212');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  g.fillStyle = cover.accent;
  g.globalAlpha = 0.85;
  g.beginPath();
  g.arc(size * 0.72, size * 0.3, size * 0.2, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
  g.fillStyle = '#ffffff';
  g.font = `800 ${size * 0.1}px sans-serif`;
  g.fillText(label.slice(0, 18), size * 0.07, size * 0.88);
  return c.toDataURL('image/png');
}
