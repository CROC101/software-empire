'use client';

import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Send, Store } from 'lucide-react';
import { Avatar, ProductArt } from '@/components/common/Visuals';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import { baht, fmtTime, ORDER_TAB_LABEL, orderTab } from '@/lib/format';
import type { ChatMessage } from '@/types/tiktok';

const SHOP_REPLIES = ['Thanks for your message! Our team will check and reply shortly 😊', 'Your parcel is on the way. You can follow it in My Orders & Tracking.', 'Yes, this item is in stock and ships within 24 hours.'];
const FRIEND_REPLIES = ['haha yes 😂', 'Send me the link!', 'Let’s catch up this weekend', 'That setup is so clean'];

function Card({ card }: { card: NonNullable<ChatMessage['card']> }) {
  const { orders } = useTikTok();
  const { product } = useLookup();
  if (card.kind === 'product') {
    const p = product(card.productId);
    if (!p) return null;
    return (
      <Link href={`/shop/product/${p.id}`} className="mt-1 flex w-60 gap-2 rounded-md border border-line bg-card p-2 text-ink">
        <ProductArt hue={p.hue} icon={p.icon} className="h-14 w-14 shrink-0 rounded-sm" />
        <span className="min-w-0 text-13"><span className="line-clamp-2 font-medium">{p.name}</span><b className="text-deal">{baht(p.price)}</b></span>
      </Link>
    );
  }
  const o = orders.find((x) => x.id === card.orderId);
  if (!o) return null;
  return (
    <Link href={`/orders/${o.id}`} className="mt-1 block w-60 rounded-md border border-line bg-card p-2 text-13 text-ink">
      <p className="font-semibold">Order {o.id} · <span className="text-brand">{ORDER_TAB_LABEL[orderTab(o)]}</span></p>
      <p className="text-muted">{o.items.length} item(s) · {baht(o.total)}</p>
      <p className="font-mono text-12 text-muted">{o.tracking}</p>
    </Link>
  );
}

function Inbox() {
  const { threads, sendMessage, receiveMessage, readThread } = useTikTok();
  const { creator } = useLookup();
  const sp = useSearchParams();
  const [filter, setFilter] = useState<'all' | 'friend' | 'shop'>('all');
  const [active, setActive] = useState<string | null>(sp.get('t'));
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const t = threads.find((x) => x.id === active);

  useEffect(() => { if (t?.unread) readThread(t.id); }, [t, readThread]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [t?.messages.length]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!t || !text.trim()) return;
    sendMessage(t.id, text.trim());
    setText('');
    const pool = t.kind === 'shop' ? SHOP_REPLIES : FRIEND_REPLIES;
    const id = t.id;
    setTimeout(() => receiveMessage(id, pool[Math.floor(Math.random() * pool.length)]), 1400);
  };
  const list = threads.filter((x) => filter === 'all' || x.kind === filter);

  return (
    <div className="flex h-dvh gap-0 px-2 pb-2 pt-[60px] md:gap-4 md:px-6 md:pb-6 md:pt-[72px]">
      <aside className={`${t ? 'hidden md:flex' : 'flex'} w-full flex-col rounded-lg border border-line bg-card md:w-[340px] md:shrink-0`}>
        <h1 className="px-4 pb-2 pt-4 text-22 font-bold">Messages</h1>
        <div className="flex gap-2 px-4 pb-3">
          {(['all', 'friend', 'shop'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className={`h-8 rounded-pill px-3 text-13 font-semibold ${filter === f ? 'bg-ink text-canvas' : 'bg-pill'}`}>{f === 'all' ? 'All' : f === 'friend' ? 'Friends' : 'Shop support'}</button>
          ))}
        </div>
        <ul className="flex-1 overflow-y-auto">
          {list.map((x) => {
            const c = creator(x.handle);
            const last = x.messages[x.messages.length - 1];
            return (
              <li key={x.id}>
                <button onClick={() => setActive(x.id)} className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-pill ${active === x.id ? 'bg-pill' : ''}`}>
                  <Avatar hue={c.hue} name={c.name} size={48} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-15 font-semibold">{x.kind === 'shop' && <Store size={13} className="text-deal" />}<span className="truncate">{c.name}</span></span>
                    <span className="block truncate text-13 text-muted">{last ? `${last.from === 'me' ? 'You: ' : ''}${last.text || (last.card ? 'Sent a card' : '')}` : 'Say hi 👋'}</span>
                  </span>
                  {x.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-pill bg-brand px-1 text-11 font-bold text-white">{x.unread}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className={`${t ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col rounded-lg border border-line bg-card`}>
        {!t ? <p className="m-auto text-14 text-muted">Pick a conversation to start chatting.</p> : (() => {
          const c = creator(t.handle);
          return (
            <>
              <header className="flex items-center gap-3 border-b border-line px-4 py-3">
                <button onClick={() => setActive(null)} aria-label="Back" className="md:hidden"><ArrowLeft size={20} /></button>
                <Link href={`/@${c.handle}`} className="flex items-center gap-3"><Avatar hue={c.hue} name={c.name} size={40} /><span><span className="block text-15 font-bold">{c.name}</span><span className="text-12 text-muted">@{c.handle}{t.kind === 'shop' && ' · Shop support'}</span></span></Link>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {t.messages.map((m) => (
                  <div key={m.id} className={`flex flex-col ${m.from === 'me' ? 'items-end' : 'items-start'}`}>
                    {m.text && <p className={`max-w-[75%] rounded-lg px-3 py-2 text-14 ${m.from === 'me' ? 'bg-brand text-white' : 'bg-pill'}`}>{m.text}</p>}
                    {m.card && <Card card={m.card} />}
                    <span className="mt-0.5 text-11 text-muted">{fmtTime(m.at)}</span>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form onSubmit={send} className="flex items-center gap-2 border-t border-line p-3">
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Send a message..." aria-label="Message" className="h-11 min-w-0 flex-1 rounded-pill bg-pill px-4 text-15 outline-none" />
                <button type="submit" aria-label="Send" disabled={!text.trim()} className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40"><Send size={17} /></button>
              </form>
            </>
          );
        })()}
      </section>
    </div>
  );
}

export default function MessagesPage() {
  return <Suspense fallback={<div className="p-16 text-center text-muted">Loading…</div>}><Inbox /></Suspense>;
}
