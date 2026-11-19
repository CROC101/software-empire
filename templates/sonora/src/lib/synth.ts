/**
 * Renders a gentle ambient pad offline and returns a blob: URL of a WAV file.
 * Used when a stream cannot be loaded, so the <audio> element, lock-screen controls,
 * seeking and the equalizer keep working exactly as for a real track.
 */
const cache = new Map<number, Promise<string>>();

export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return Math.abs(h);
}

export function renderAmbient(seed: number, seconds = 90): Promise<string> {
  if (cache.has(seed)) return cache.get(seed)!;
  const job = (async () => {
    const rate = 22050;
    const ctx = new OfflineAudioContext(2, rate * seconds, rate);
    const roots = [220, 196, 246.94, 174.61, 261.63];
    const root = roots[seed % roots.length];
    const chords = [
      [1, 1.25, 1.5],
      [0.889, 1.111, 1.333],
      [0.75, 0.944, 1.125],
      [0.667, 0.833, 1],
    ];
    const bar = seconds / 8;
    const master = ctx.createGain();
    master.gain.value = 0.18;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    master.connect(lp).connect(ctx.destination);
    for (let b = 0; b < 8; b++) {
      const chord = chords[(b + seed) % chords.length];
      chord.forEach((ratio, i) => {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.value = root * ratio * (i === 0 ? 0.5 : 1);
        osc.detune.value = (i - 1) * 6;
        const g = ctx.createGain();
        const t0 = b * bar;
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.5, t0 + bar * 0.3);
        g.gain.linearRampToValueAtTime(0, t0 + bar * 1.05);
        osc.connect(g).connect(master);
        osc.start(t0);
        osc.stop(Math.min(seconds, t0 + bar * 1.1));
      });
      // soft pulse on each beat
      for (let beat = 0; beat < 4; beat++) {
        const t = b * bar + (beat * bar) / 4;
        const k = ctx.createOscillator();
        k.frequency.setValueAtTime(110, t);
        k.frequency.exponentialRampToValueAtTime(45, t + 0.25);
        const kg = ctx.createGain();
        kg.gain.setValueAtTime(0.6, t);
        kg.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        k.connect(kg).connect(master);
        k.start(t);
        k.stop(t + 0.32);
      }
    }
    const buf = await ctx.startRendering();
    return URL.createObjectURL(toWav(buf));
  })();
  cache.set(seed, job);
  return job;
}

function toWav(buf: AudioBuffer): Blob {
  const ch = buf.numberOfChannels;
  const len = buf.length * ch * 2;
  const view = new DataView(new ArrayBuffer(44 + len));
  const str = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  view.setUint32(4, 36 + len, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, ch, true);
  view.setUint32(24, buf.sampleRate, true);
  view.setUint32(28, buf.sampleRate * ch * 2, true);
  view.setUint16(32, ch * 2, true);
  view.setUint16(34, 16, true);
  str(36, 'data');
  view.setUint32(40, len, true);
  const chans = Array.from({ length: ch }, (_, i) => buf.getChannelData(i));
  let o = 44;
  for (let i = 0; i < buf.length; i++)
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  return new Blob([view], { type: 'audio/wav' });
}
