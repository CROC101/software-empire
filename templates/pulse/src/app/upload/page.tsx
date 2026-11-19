'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, Heart, MessageCircle, Music2, Share2, ShoppingBag } from 'lucide-react';
import { Art, Avatar, ProductArt } from '@/components/common/Visuals';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import { useUI } from '@/components/layout/ui';
import { exploreCategories, ME, videos as seedVideos } from '@/data/seed-tiktok';
import { baht } from '@/lib/format';

// one preset per distinct sample clip
const PRESETS = seedVideos.filter((v, i, a) => a.findIndex((x) => x.src === v.src) === i).slice(0, 6);
const CATS = exploreCategories.filter((c) => c !== 'All');

export default function UploadPage() {
  const { products, publishVideo } = useTikTok();
  const { creator } = useLookup();
  const { toast } = useUI();
  const router = useRouter();
  const me = creator(ME);
  const [pick, setPick] = useState(PRESETS[0]);
  const [caption, setCaption] = useState('');
  const [cat, setCat] = useState<string>(CATS[0]);
  const [tagged, setTagged] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const toggle = (id: string) => setTagged((t) => (t.includes(id) ? t.filter((x) => x !== id) : t.length >= 3 ? t : [...t, id]));
  const first = products.find((p) => p.id === tagged[0]);

  const post = () => {
    if (!caption.trim()) return setErr('Write a caption first.');
    const id = publishVideo({ caption: caption.trim(), src: pick.src, productIds: tagged, hue: pick.hue, category: cat });
    if (!id) return setErr('Demo upload limit reached (30 videos).');
    toast('Posted! Your video is live on For You and your profile');
    router.push('/');
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-[64px] md:px-8 md:pt-6">
      <h1 className="text-24 font-bold md:pr-[400px]">Upload video</h1>
      <p className="mb-5 text-14 text-muted">Post a video to your account and tag up to 3 shop products.</p>
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-5">
          <section>
            <h2 className="mb-2 text-15 font-semibold">1. Choose a clip</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {PRESETS.map((v, i) => (
                <button key={v.id} onClick={() => setPick(v)} aria-pressed={pick.id === v.id} aria-label={`Clip ${i + 1}`} className={`relative aspect-[9/16] overflow-hidden rounded-md ring-2 ${pick.id === v.id ? 'ring-brand' : 'ring-transparent'}`}>
                  <Art hue={v.hue} seed={i} className="absolute inset-0 h-full w-full" />
                  <span className="absolute bottom-1 left-1 text-11 font-semibold text-white">Clip {i + 1}</span>
                  {pick.id === v.id && <Check size={18} className="absolute right-1 top-1 rounded-full bg-brand p-0.5 text-white" />}
                </button>
              ))}
            </div>
          </section>

          <section>
            <label htmlFor="cap" className="mb-2 block text-15 font-semibold">2. Caption</label>
            <textarea id="cap" value={caption} maxLength={300} onChange={(e) => { setCaption(e.target.value); setErr(''); }} rows={3} placeholder="Say something… add #hashtags" className="w-full rounded-md border border-line bg-canvas p-3 text-15 outline-none focus:border-ink" />
            <div className="mt-1 flex items-center justify-between text-12 text-muted">
              <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category" className="h-8 rounded-md bg-pill px-2 text-13 text-ink">{CATS.map((c) => <option key={c}>{c}</option>)}</select>
              <span>{caption.length}/300</span>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-15 font-semibold">3. Tag products <span className="font-normal text-muted">({tagged.length}/3)</span></h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {products.map((p) => {
                const on = tagged.includes(p.id);
                return (
                  <li key={p.id}>
                    <button onClick={() => toggle(p.id)} disabled={!on && tagged.length >= 3} aria-pressed={on} className={`flex w-full items-center gap-2 rounded-md border p-2 text-left disabled:opacity-40 ${on ? 'border-brand bg-brand/5' : 'border-line'}`}>
                      <ProductArt hue={p.hue} icon={p.icon} className="h-10 w-10 shrink-0 rounded-sm" />
                      <span className="min-w-0 flex-1 text-13"><span className="line-clamp-1 font-medium">{p.name}</span><span className="text-deal">{baht(p.price)}</span></span>
                      {on && <Check size={16} className="text-brand" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {err && <p role="alert" className="text-14 text-brand">{err}</p>}
          <div className="flex gap-3">
            <button onClick={() => router.back()} className="h-11 w-36 rounded-btn bg-pill text-15 font-semibold">Discard</button>
            <button onClick={post} className="h-11 w-36 rounded-btn bg-brand text-15 font-semibold text-white">Post</button>
          </div>
        </div>

        <div className="mx-auto shrink-0" aria-label="Mobile preview">
          <p className="mb-2 text-center text-13 text-muted">Preview</p>
          <div className="relative h-[560px] w-[290px] overflow-hidden rounded-[36px] border-[10px] border-[#111] bg-black text-white shadow-xl">
            <video key={pick.src} src={pick.src} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-24 right-2 flex flex-col items-center gap-4 text-11 font-semibold">
              <Avatar hue={me.hue} name={me.name} size={36} />
              <span className="flex flex-col items-center"><Heart size={22} className="fill-white" />0</span>
              <span className="flex flex-col items-center"><MessageCircle size={22} />0</span>
              <span className="flex flex-col items-center"><Share2 size={22} />0</span>
            </div>
            <div className="absolute bottom-4 left-3 right-14 space-y-1.5">
              {first && <span className="inline-flex items-center gap-1 rounded-sm bg-deal px-1.5 py-0.5 text-11 font-bold"><ShoppingBag size={11} />View Product • {baht(first.price)}{tagged.length > 1 && ` +${tagged.length - 1}`}</span>}
              <p className="text-14 font-bold">{me.name}</p>
              <p className="line-clamp-2 text-12">{caption || 'Your caption appears here'}</p>
              <p className="flex items-center gap-1 text-11"><Music2 size={11} />original sound - {me.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
