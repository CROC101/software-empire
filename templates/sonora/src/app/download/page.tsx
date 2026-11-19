'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, MonitorDown } from 'lucide-react';
import { TRACKS } from '@/data/seed-spotify';
import Logo from '@/components/layout/Logo';
import Cover from '@/components/ui/Cover';

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function DownloadPage() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [hint, setHint] = useState('');

  useEffect(() => {
    setInstalled(window.matchMedia('(display-mode: standalone)').matches);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (prompt) {
      await prompt.prompt();
      if ((await prompt.userChoice).outcome === 'accepted') setInstalled(true);
      setPrompt(null);
    } else {
      setHint('On iPhone: tap Share, then “Add to Home Screen”. On desktop: use the install icon in the address bar.');
    }
  };

  return (
    <div className="min-h-full bg-[#5fae9a] p-4 md:p-10">
      <div className="mx-auto max-w-[1100px] overflow-hidden rounded-xs bg-[linear-gradient(180deg,#eea2d5_0%,#c7a6c5_35%,#9fb5ad_70%,#8fb8a8_100%)] px-5 pt-10 text-black md:px-10">
        <div className="flex items-center gap-2 text-black">
          <Logo size={32} />
          <span className="text-xl font-bold tracking-tight">Sonora</span>
        </div>
        <h1 className="mt-8 font-title text-3xl font-bold leading-tight tracking-[-0.02em]">Install Sonora on this device</h1>
        <p className="mt-8 max-w-[800px] text-base leading-7 md:text-xl md:leading-7">
          Lossless audio, offline playlists, the 5-band equalizer and lock-screen controls — in its own window, without the browser around it.
        </p>
        <button type="button" onClick={install} disabled={installed} className="mt-6 flex h-12 items-center gap-3 rounded-lg bg-black px-4 text-left text-white hover:bg-[#292929] disabled:opacity-80">
          {installed ? <CheckCircle2 size={22} className="text-green" /> : <MonitorDown size={22} />}
          <span>
            <span className="block text-[11px] leading-3">{installed ? 'Already on this device' : 'Free with Premium'}</span>
            <span className="block text-lg font-bold leading-6">{installed ? 'Installed' : 'Install the app'}</span>
          </span>
        </button>
        {hint && <p className="mt-3 max-w-[546px] text-sm" role="status">{hint}</p>}
        <p className="mt-6 text-sm">
          Prefer the browser?{' '}
          <Link href="/" className="font-bold underline">
            Keep listening here
          </Link>
        </p>

        {/* Mock laptop drawn with boxes: our own player UI in miniature. */}
        <div aria-hidden className="mx-auto mt-10 w-full max-w-[628px] rounded-t-2xl border-[10px] border-b-0 border-[#1a1a1a] bg-black p-3 pb-0">
          <div className="flex gap-2 rounded-t bg-[#121212] p-2">
            <div className="hidden w-8 flex-col gap-1.5 sm:flex">
              {TRACKS.slice(0, 8).map((t) => (
                <Cover key={t.id} cover={t.cover} className="h-5 w-5" />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex gap-1">
                {['All', 'Music', 'Podcasts'].map((c, i) => (
                  <span key={c} className={`rounded-full px-2 text-[7px] leading-4 ${i ? 'bg-white/10 text-white' : 'bg-white text-black'}`}>
                    {c}
                  </span>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-4">
                {TRACKS.slice(0, 8).map((t) => (
                  <div key={t.id} className="flex items-center gap-1 rounded-sm bg-white/10">
                    <Cover cover={t.cover} className="h-4 w-4" />
                    <span className="truncate text-[6px] text-white">{t.title}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[8px] font-bold text-white">Jump back in</p>
              <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {TRACKS.slice(8, 14).map((t) => (
                  <div key={t.id}>
                    <Cover cover={t.cover} className="aspect-square w-full" />
                    <span className="mt-0.5 block truncate text-[6px] text-white">{t.title}</span>
                    <span className="block truncate text-[5px] text-subdued">{t.artistName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
