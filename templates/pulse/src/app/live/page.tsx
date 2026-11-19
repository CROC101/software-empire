'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Coins, Eye, MessageCircle, Send, ShoppingBag } from 'lucide-react';
import { Art, Avatar, ProductArt } from '@/components/common/Visuals';
import ProductAnchorSheet from '@/components/feed/ProductAnchorSheet';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import { useUI } from '@/components/layout/ui';
import { gifts, liveStreams } from '@/data/seed-tiktok';
import { baht, fmtCount, totalStock } from '@/lib/format';

const BOT_LINES = ['How loud are these switches?', 'Just ordered one 🔥', 'Is shipping to Chiang Mai free?', 'Flash price is crazy', 'Can you show the side view?', 'GG!', 'Love this setup'];
const BOTS = ['nina.codes', 'tor_dev', 'mint.makes', 'ploy.travels'];

interface Line { id: number; who: string; text: string; gift?: string }

export default function LivePage() {
  const { coins, spendCoins } = useTikTok();
  const { product, video, creator } = useLookup();
  const { openCoins, toast } = useUI();
  const [cat, setCat] = useState('For You');
  const [streamId, setStreamId] = useState(liveStreams[0].id);
  const [viewers, setViewers] = useState(liveStreams[0].viewers);
  const [chat, setChat] = useState<Line[]>([{ id: 0, who: 'Pulse', text: 'Welcome to LIVE! Be kind and follow the community rules.' }]);
  const [text, setText] = useState('');
  const [burst, setBurst] = useState<{ id: number; emoji: string; big: boolean } | null>(null);
  const [sheet, setSheet] = useState(false);
  const [chatOpen, setChatOpen] = useState(false); // below desktop the chat panel opens on demand, keeping the stage like the captured page
  const [left, setLeft] = useState(15 * 60);
  const chatRef = useRef<HTMLDivElement>(null);
  const n = useRef(1);

  const stream = liveStreams.find((s) => s.id === streamId) ?? liveStreams[0];
  const host = creator(stream.handle);
  const p = product(stream.productId);
  const v = video(stream.videoId);
  const push = (l: Omit<Line, 'id'>) => setChat((c) => [...c.slice(-60), { ...l, id: n.current++ }]);

  useEffect(() => {
    setViewers(stream.viewers);
    const t = setInterval(() => {
      setViewers((x) => Math.max(100, x + Math.round((Math.random() - 0.4) * 40)));
      setLeft((x) => (x > 0 ? x - 1 : 15 * 60));
      if (Math.random() < 0.35) push({ who: BOTS[Math.floor(Math.random() * BOTS.length)], text: BOT_LINES[Math.floor(Math.random() * BOT_LINES.length)] });
    }, 1000);
    return () => clearInterval(t);
  }, [stream.viewers]);
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight }); }, [chat]);

  const send = (g: (typeof gifts)[number]) => {
    if (!spendCoins(g.cost)) { toast('Not enough coins'); openCoins(); return; }
    setBurst({ id: Date.now(), emoji: g.emoji, big: g.cost >= 100 });
    push({ who: 'You', text: `sent ${g.name} ×1`, gift: g.emoji });
  };
  const stock = p ? totalStock(p) : 0;
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="px-6 pb-10 pt-6">
      <div className="flex gap-2" role="tablist">
        {['For You', 'Following', 'Gaming'].map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} onClick={() => { setCat(c); const s = liveStreams.find((x) => x.category === c); if (s) setStreamId(s.id); }}
            className={`h-9 rounded-md px-3 text-15 font-semibold ${cat === c ? 'bg-ink text-canvas' : 'bg-pill hover:bg-pill-hover'}`}>{c}</button>
        ))}
      </div>

      <section className="mt-4 flex flex-col overflow-hidden rounded-md bg-stage-2 text-white lg:h-[508px] lg:flex-row">
        <div className="relative flex h-[370px] items-center lg:h-auto lg:flex-1 justify-center overflow-hidden">
          {v && <Art hue={v.hue} seed={3} className="absolute inset-0 h-full w-full scale-110 opacity-40 blur-2xl" />}
          {v && <video key={v.id} src={v.src} autoPlay muted loop playsInline className="relative h-full max-h-[508px] aspect-[9/16] object-cover" />}
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <Link href={`/@${host.handle}`} className="flex items-center gap-2 rounded-pill bg-black/40 py-1 pl-1 pr-3">
              <Avatar hue={host.hue} name={host.name} size={32} />
              <span className="text-14 font-semibold">{host.name}</span>
            </Link>
            <motion.span animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="rounded-sm bg-brand px-1.5 text-12 font-bold">LIVE</motion.span>
            <span className="flex items-center gap-1 rounded-sm bg-black/40 px-1.5 text-12 font-semibold"><Eye size={13} />{fmtCount(viewers)}</span>
          </div>
          <p className="absolute left-4 top-16 max-w-[60%] text-14 font-semibold drop-shadow">{stream.title}</p>

          {p && (
            <div className="absolute bottom-4 left-4 flex w-[280px] max-w-[calc(100%-2rem)] items-center gap-3 rounded-lg bg-white p-2 text-black shadow-lg">
              <ProductArt hue={p.hue} icon={p.icon} className="h-16 w-16 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-13 font-semibold">{p.name}</p>
                <p className="text-15 font-bold text-deal">{baht(p.price)} <span className="text-12 font-normal text-[#16182380] line-through">{baht(p.originalPrice)}</span></p>
                <p className="text-11 text-[#16182380]">Only {stock} left · ends {mm}:{ss}</p>
              </div>
              <button onClick={() => setSheet(true)} className="flex h-8 items-center gap-1 rounded-btn bg-brand px-3 text-13 font-bold text-white"><ShoppingBag size={14} />Buy</button>
            </div>
          )}

          <button onClick={() => setChatOpen((c) => !c)} aria-expanded={chatOpen} aria-label="LIVE chat" className="absolute right-4 top-4 flex h-8 items-center gap-1.5 rounded-pill bg-black/40 px-3 text-13 font-semibold lg:hidden"><MessageCircle size={15} />Chat</button>
          <div className="absolute right-6 top-1/2 flex -translate-y-1/2 flex-col gap-4">
            {([['Previous LIVE', -1, ChevronUp], ['Next LIVE', 1, ChevronDown]] as const).map(([label, d, Icon]) => (
              <button key={label} aria-label={label} onClick={() => { const i = liveStreams.findIndex((x) => x.id === stream.id); setStreamId(liveStreams[(i + d + liveStreams.length) % liveStreams.length].id); }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffffff0a] text-white/80 hover:bg-white/20"><Icon size={20} /></button>
            ))}
          </div>

          <AnimatePresence>
            {burst && (
              <motion.span key={burst.id} initial={{ y: 80, scale: 0.4, opacity: 0 }} animate={{ y: -60, scale: burst.big ? 3.2 : 1.8, opacity: 1, rotate: burst.big ? [0, -10, 10, 0] : 0 }} exit={{ opacity: 0, y: -160 }}
                transition={{ duration: 0.9 }} onAnimationComplete={() => setTimeout(() => setBurst(null), 500)} className="pointer-events-none absolute text-5xl" aria-hidden>{burst.emoji}</motion.span>
            )}
          </AnimatePresence>
        </div>

        <aside className={`${chatOpen ? 'flex' : 'hidden'} h-[250px] w-full flex-col lg:flex border-t border-white/10 lg:h-auto lg:w-[340px] lg:border-l lg:border-t-0`}>
          <p className="border-b border-white/10 px-4 py-3 text-15 font-semibold">LIVE chat</p>
          <div ref={chatRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3 text-14" aria-live="polite">
            {chat.map((l) => (
              <p key={l.id}><span className="font-semibold text-white/60">{l.who}</span> {l.text} {l.gift}</p>
            ))}
          </div>
          <div className="flex gap-1.5 border-t border-white/10 px-3 py-2">
            {gifts.map((g) => (
              <button key={g.id} onClick={() => send(g)} className="flex flex-1 flex-col items-center rounded-md py-1 hover:bg-white/10" aria-label={`Send ${g.name} for ${g.cost} coins`}>
                <span className="text-22">{g.emoji}</span>
                <span className="text-11">{g.name}</span>
                <span className="flex items-center gap-0.5 text-11 text-gold"><Coins size={10} />{g.cost}</span>
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) { push({ who: 'You', text: text.trim() }); setText(''); } }} className="flex items-center gap-2 px-3 pb-3">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Say something nice..." aria-label="Chat message" className="h-10 min-w-0 flex-1 rounded-pill bg-white/10 px-4 text-14 outline-none" />
            <button type="button" onClick={openCoins} className="flex h-10 items-center gap-1 rounded-pill bg-white/10 px-3 text-12 font-semibold text-gold"><Coins size={13} />{coins.toLocaleString()}</button>
            <button type="submit" aria-label="Send" className="flex h-10 w-10 items-center justify-center rounded-full bg-brand"><Send size={15} /></button>
          </form>
        </aside>
      </section>

      <div className="mt-[25px] border-t border-line" />

      {p && <ProductAnchorSheet open={sheet} onClose={() => setSheet(false)} productIds={[p.id]} />}
    </div>
  );
}
