'use client';

import Link from 'next/link';
import { CheckCircle2, Crown, HardDriveDownload, ShieldCheck, SlidersHorizontal, Volume2 } from 'lucide-react';
import type { StreamQuality } from '@/types/spotify';
import { EQ_LABELS, EQ_PRESETS, MUSIC_CREDIT } from '@/data/seed-spotify';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import { useLibrary } from '@/context/LibraryContext';

const QUALITIES: { id: StreamQuality; label: string; note: string }[] = [
  { id: 'auto', label: 'Automatic', note: 'Adjusts to your connection' },
  { id: 'normal', label: 'Normal', note: '96 kbps' },
  { id: 'high', label: 'High', note: '160 kbps' },
  { id: 'veryhigh', label: 'Very high · Lossless', note: '320 kbps, up to lossless' },
];

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-green' : 'bg-[#727272]'}`}>
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-black transition-all ${on ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

function Card({ id, title, icon, children }: { id?: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 rounded-lg bg-card p-4 md:p-6">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        {icon} {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const pct = (v: number, min: number, max: number) => ({ '--fill': `${((v - min) / (max - min)) * 100}%` }) as React.CSSProperties;

export default function AccountPage() {
  const p = usePlayer();
  const lib = useLibrary();
  const storageMb = lib.offlineCount * 9.4;

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-6 px-4 pb-10 pt-6 md:px-6">
      <h1 className="font-title text-3xl font-bold">Account &amp; settings</h1>

      <section className="relative overflow-hidden rounded-lg bg-[linear-gradient(135deg,#1ed760_0%,#0d7a3a_45%,#121212_100%)] p-6">
        <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-xs font-bold tracking-widest">
          <Crown size={14} /> PREMIUM
        </span>
        <h2 className="mt-4 text-3xl font-bold text-black md:text-[40px]">Premium Individual · Unlocked</h2>
        <ul className="mt-4 grid gap-2 text-sm text-black/80 sm:grid-cols-2">
          {['Ad-free listening', 'Unlimited skips', 'Lossless / 320 kbps audio', 'Offline downloads', 'Studio equalizer', 'Crossfade up to 12 s'].map((f) => (
            <li key={f} className="flex items-center gap-2 font-bold">
              <CheckCircle2 size={16} /> {f}
            </li>
          ))}
        </ul>
        <div className="mt-6 max-w-[420px]">
          <div className="flex justify-between text-xs font-bold text-white">
            <span>Offline storage</span>
            <span>
              {storageMb.toFixed(1)} MB of 10 GB · {lib.offlineCount} songs
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(1, Math.min(100, (storageMb / 10240) * 100))}%` }} />
          </div>
        </div>
      </section>

      <Card id="equalizer" title="Equalizer" icon={<SlidersHorizontal size={20} />}>
        <div className="flex flex-wrap gap-2">
          {EQ_PRESETS.map((pr) => (
            <button key={pr.name} type="button" onClick={() => p.applyPreset(pr.name)} className={`h-8 rounded-full px-3 text-sm ${p.preset === pr.name ? 'bg-green font-bold text-black' : 'bg-white/10 hover:bg-white/20'}`}>
              {pr.name}
            </button>
          ))}
          {p.preset === 'Custom' && <span className="h-8 rounded-full bg-white px-3 text-sm font-bold leading-8 text-black">Custom</span>}
        </div>
        <div className="mt-6 flex justify-between gap-2 sm:justify-start sm:gap-10">
          {EQ_LABELS.map((label, i) => (
            <label key={label} className="flex flex-col items-center gap-2 text-xs text-subdued">
              <span className="tabular-nums text-white">
                {p.eq[i] > 0 ? '+' : ''}
                {p.eq[i]} dB
              </span>
              <input type="range" min={-12} max={12} step={1} value={p.eq[i]} onChange={(e) => p.setEqGain(i, Number(e.target.value))} aria-label={`${label} gain`} className="eq" />
              {label}
            </label>
          ))}
        </div>
        <p className="mt-4 text-xs text-subdued">{p.eqActive ? 'Equalizer is shaping playback now.' : 'Move a slider or pick a preset to switch the equalizer on.'}</p>
      </Card>

      <Card title="Playback" icon={<Volume2 size={20} />}>
        <fieldset>
          <legend className="text-sm font-bold">Streaming quality</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {QUALITIES.map((q) => (
              <label key={q.id} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${p.quality === q.id ? 'border-green' : 'border-white/10 hover:border-white/30'}`}>
                <input type="radio" name="quality" checked={p.quality === q.id} onChange={() => p.setQuality(q.id)} className="accent-[#1ed760]" />
                <span>
                  <span className="block text-sm font-bold">{q.label}</span>
                  <span className="block text-xs text-subdued">{q.note}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6">
          <div className="flex justify-between text-sm">
            <span className="font-bold">Crossfade songs</span>
            <span className="tabular-nums text-subdued">{p.crossfade} s</span>
          </div>
          <input type="range" min={0} max={12} step={1} value={p.crossfade} onChange={(e) => p.setCrossfade(Number(e.target.value))} aria-label="Crossfade seconds" className="bar mt-2 w-full" style={pct(p.crossfade, 0, 12)} />
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm">
            <span className="font-bold">Playback speed</span>
            <span className="tabular-nums text-subdued">{p.rate.toFixed(2)}×</span>
          </div>
          <input type="range" min={0.5} max={2} step={0.05} value={p.rate} onChange={(e) => p.setRate(Number(e.target.value))} aria-label="Playback speed" className="bar mt-2 w-full" style={pct(p.rate, 0.5, 2)} />
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-bold">Autoplay</span>
              <span className="block text-xs text-subdued">Keep playing similar songs when your music ends</span>
            </span>
            <Toggle on={p.autoplay} onChange={p.setAutoplay} label="Autoplay" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-bold">Normalize volume</span>
              <span className="block text-xs text-subdued">Same loudness for every song</span>
            </span>
            <Toggle on={p.normalize} onChange={p.setNormalize} label="Normalize volume" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-bold">Unlimited skips</span>
              <span className="block text-xs text-subdued">Included with Premium</span>
            </span>
            <CheckCircle2 size={22} className="text-green" />
          </div>
        </div>
      </Card>

      <Card title="Offline" icon={<HardDriveDownload size={20} />}>
        <p className="text-sm text-subdued">
          {lib.offlineCount} songs saved for offline. Tap the download arrow on any playlist to keep it on this device.
        </p>
        <Link href="/download" className="mt-4 inline-block h-10 rounded-full bg-white px-6 text-sm font-bold leading-10 text-black hover:scale-105">
          Install the app
        </Link>
      </Card>

      <Card id="support" title="Support" icon={<ShieldCheck size={20} />}>
        <ul className="flex flex-col gap-2 text-sm text-subdued">
          <li>Audio won&apos;t start? Tap play once — browsers need a tap before sound can play.</li>
          <li>Imported song plays an ambient pad? Its stream couldn&apos;t be reached, so a calm stand-in plays instead.</li>
          <li>Lock-screen controls work after the first play on phones that support them.</li>
        </ul>
      </Card>

      <section id="legal" className="scroll-mt-4 px-1 text-xs text-subdued">
        <h2 className="text-sm font-bold text-white">Legal &amp; credits</h2>
        <p className="mt-2">{MUSIC_CREDIT}</p>
        <p className="mt-1">Artist, album and playlist names are fictional. Cover art is generated. This is a demo player; no account or payment is involved.</p>
      </section>
    </div>
  );
}
