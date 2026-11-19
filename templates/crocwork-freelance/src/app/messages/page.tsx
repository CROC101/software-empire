'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { brand, formatPrice } from '@/config/brand.config';
import { getSeller } from '@/data/sellers';
import { serviceHref, useAllServices, useStore } from '@/store/useStore';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import type { ChatAttachment, ChatMessage, Conversation } from '@/lib/types';

const time = (at: string) => new Date(at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

function MessagesInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const conversations = useStore((s) => s.conversations);
  const markRead = useStore((s) => s.markRead);
  const activeId = sp.get('c') ?? '';
  const active = conversations.find((c) => c.id === activeId);

  useEffect(() => {
    if (active && active.unread > 0) markRead(active.id);
  }, [active, markRead]);

  if (!hydrated) return <div className="container-fw py-8"><div className="skeleton h-[560px] w-full rounded-lg" /></div>;

  if (conversations.length === 0) {
    return (
      <div className="container-fw flex flex-col items-center py-16 text-center">
        <Image src={brand.mascots.chat} alt="" width={200} height={160} />
        <h1 className="mt-4 text-xl font-semibold text-ink">ยังไม่มีข้อความ</h1>
        <p className="mt-2 text-sm text-ink-3">เลือกบริการที่สนใจ แล้วกด “แชทกับฟรีแลนซ์” เพื่อเริ่มคุย</p>
        <Link href="/search/" className="mt-5 rounded-sm bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">ค้นหาบริการ</Link>
      </div>
    );
  }

  return (
    <div className="container-fw py-6">
      <h1 className="mb-4 text-xl font-semibold text-ink">ข้อความ</h1>
      <div className="grid h-[calc(100vh-220px)] min-h-[520px] overflow-hidden rounded-lg border border-line bg-white md:grid-cols-[300px_1fr]">
        <ul className={`overflow-y-auto border-line md:border-r ${active ? 'hidden md:block' : ''}`}>
          {conversations.map((c) => {
            const seller = getSeller(c.sellerId);
            const last = c.messages[c.messages.length - 1];
            return (
              <li key={c.id}>
                <button type="button" onClick={() => router.push(`/messages/?c=${c.id}`)} className={`flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left hover:bg-surface ${c.id === activeId ? 'bg-brand-tint' : ''}`}>
                  {seller && <Avatar seller={seller} size={40} />}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-ink">{seller?.name}</span>
                      {last && <span className="shrink-0 text-xs text-ink-3">{time(last.at)}</span>}
                    </span>
                    <span className="block truncate text-xs text-ink-3">{last?.quote ? 'ใบเสนอราคา' : last?.text}</span>
                  </span>
                  {c.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-pill bg-danger px-1 text-[11px] font-semibold text-white">{c.unread}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        {active ? (
          <ChatPane key={active.id} conv={active} />
        ) : (
          <div className="hidden flex-col items-center justify-center text-center md:flex">
            <Image src={brand.mascots.chat} alt="" width={160} height={128} />
            <p className="mt-3 text-sm text-ink-3">เลือกบทสนทนาทางซ้าย</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatPane({ conv }: { conv: Conversation }) {
  const router = useRouter();
  const sendMessage = useStore((s) => s.sendMessage);
  const requestQuote = useStore((s) => s.requestQuote);
  const acceptQuote = useStore((s) => s.acceptQuote);
  const all = useAllServices();
  const service = useMemo(() => all.find((s) => s.id === conv.serviceId), [all, conv.serviceId]);
  const seller = getSeller(conv.sellerId);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<ChatAttachment[]>([]);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [q, setQ] = useState({ details: '', budget: '', days: '3' });
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [conv.messages.length]);

  const send = () => {
    if (!text.trim() && files.length === 0) return;
    sendMessage(conv.id, text.trim(), files.length ? files : undefined);
    setText('');
    setFiles([]);
  };
  const submitQuote = () => {
    const budget = Number(q.budget);
    const days = Number(q.days);
    if (!q.details.trim() || !(budget > 0) || !(days > 0)) return;
    requestQuote(conv.id, { details: q.details.trim(), budget, deliveryDays: days });
    setQuoteOpen(false);
    setQ({ details: '', budget: '', days: '3' });
  };
  const accept = (m: ChatMessage) => {
    const orderId = acceptQuote(conv.id, m.id);
    if (orderId) router.push(`/checkout/pay/?order=${orderId}`);
  };

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <button type="button" aria-label="กลับ" className="md:hidden" onClick={() => router.push('/messages/')}><Icon name="chevronLeft" /></button>
        {seller && <Avatar seller={seller} size={36} />}
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink">{seller?.name}</div>
          {service && <Link href={serviceHref(service)} className="block truncate text-xs text-brand hover:underline">{service.title}</Link>}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-surface p-4">
        {conv.messages.map((m) => {
          if (m.from === 'system') return <p key={m.id} className="text-center text-xs text-ink-3">{m.text}</p>;
          const mine = m.from === 'me';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%] sm:max-w-[70%]">
                {m.quote ? (
                  <div className="w-72 max-w-full rounded-lg border border-line bg-white p-4 shadow-card">
                    <div className="flex items-center gap-2 text-xs font-semibold text-brand"><Icon name="file" size={16} /> ใบเสนอราคา</div>
                    <div className="mt-2 text-sm font-medium text-ink">{m.quote.title}</div>
                    <p className="mt-1 line-clamp-3 text-xs text-ink-3">{m.quote.details}</p>
                    <div className="mt-3 flex justify-between text-sm"><span className="text-ink-3">ราคา</span><span className="font-semibold text-ink">{formatPrice(m.quote.price)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-ink-3">ระยะเวลา</span><span className="text-ink">{m.quote.deliveryDays} วัน</span></div>
                    {m.quote.status === 'accepted' ? (
                      <Link href={`/checkout/pay/?order=${m.quote.orderId ?? ''}`} className="mt-3 flex items-center justify-center gap-1 rounded-sm bg-brand-soft py-2 text-sm font-medium text-brand"><Icon name="check" size={16} /> ยอมรับแล้ว · ไปชำระเงิน</Link>
                    ) : (
                      <button type="button" onClick={() => accept(m)} className="mt-3 w-full rounded-sm bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">ยอมรับใบเสนอราคา</button>
                    )}
                  </div>
                ) : (
                  <div className={`rounded-lg px-3.5 py-2 text-sm leading-relaxed ${mine ? 'bg-brand text-white' : 'bg-white text-ink shadow-card'}`}>
                    {m.text && <p className="whitespace-pre-line break-words">{m.text}</p>}
                    {m.attachments?.map((a) => (
                      <span key={a.name} className={`mt-1 flex items-center gap-2 rounded-sm px-2 py-1 text-xs ${mine ? 'bg-white/15' : 'bg-surface'}`}>
                        <Icon name="paperclip" size={14} /> <span className="truncate">{a.name}</span> <span className="shrink-0 opacity-70">{kb(a.size)}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div className={`mt-1 text-[11px] text-ink-3 ${mine ? 'text-right' : ''}`}>{time(m.at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {quoteOpen && (
        <div className="space-y-2 border-t border-line bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">ขอใบเสนอราคา</span>
            <button type="button" aria-label="ปิด" onClick={() => setQuoteOpen(false)}><Icon name="close" size={18} /></button>
          </div>
          <label className="block text-xs text-ink-3">รายละเอียดงาน
            <textarea value={q.details} onChange={(e) => setQ({ ...q, details: e.target.value })} rows={2} className="mt-1 w-full rounded-sm border border-line p-2 text-sm text-ink outline-none focus:border-brand" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-ink-3">งบประมาณ (บาท)
              <input type="number" min={1} value={q.budget} onChange={(e) => setQ({ ...q, budget: e.target.value })} className="mt-1 w-full rounded-sm border border-line p-2 text-sm text-ink outline-none focus:border-brand" />
            </label>
            <label className="block text-xs text-ink-3">ระยะเวลา (วัน)
              <input type="number" min={1} value={q.days} onChange={(e) => setQ({ ...q, days: e.target.value })} className="mt-1 w-full rounded-sm border border-line p-2 text-sm text-ink outline-none focus:border-brand" />
            </label>
          </div>
          <button type="button" onClick={submitQuote} className="w-full rounded-sm bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">ส่งคำขอ</button>
        </div>
      )}

      <div className="border-t border-line bg-white p-3">
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((f) => (
              <span key={f.name} className="flex items-center gap-1 rounded-pill bg-surface px-2.5 py-1 text-xs text-ink-2">
                <Icon name="paperclip" size={12} /> {f.name}
                <button type="button" aria-label={`ลบ ${f.name}`} onClick={() => setFiles(files.filter((x) => x.name !== f.name))}><Icon name="close" size={12} /></button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" multiple hidden onChange={(e) => { setFiles([...files, ...Array.from(e.target.files ?? []).map((f) => ({ name: f.name, size: f.size }))]); e.target.value = ''; }} />
          <button type="button" aria-label="แนบไฟล์" onClick={() => fileRef.current?.click()} className="rounded-sm p-2 text-ink-2 hover:bg-surface"><Icon name="paperclip" /></button>
          <button type="button" onClick={() => setQuoteOpen((v) => !v)} className="hidden shrink-0 rounded-sm border border-line px-3 py-2 text-xs font-medium text-ink-2 hover:border-brand hover:text-brand sm:block">ขอใบเสนอราคา</button>
          <button type="button" aria-label="ขอใบเสนอราคา" onClick={() => setQuoteOpen((v) => !v)} className="rounded-sm p-2 text-ink-2 hover:bg-surface sm:hidden"><Icon name="file" /></button>
          <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} placeholder="พิมพ์ข้อความ..." aria-label="พิมพ์ข้อความ" className="max-h-28 min-w-0 flex-1 resize-none rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-brand" />
          <button type="button" aria-label="ส่ง" onClick={send} className="rounded-sm bg-brand p-2 text-white hover:bg-brand-dark"><Icon name="send" /></button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesInner />
    </Suspense>
  );
}
