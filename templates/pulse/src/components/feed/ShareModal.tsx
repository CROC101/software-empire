'use client';

import { Code2, Link2, Mail, MessageSquare, Repeat2, Send } from 'lucide-react';
import { Modal } from '@/components/common/Overlay';
import { useUI } from '@/components/layout/ui';

export default function ShareModal({ open, onClose, path }: { open: boolean; onClose: () => void; path: string }) {
  const { toast } = useUI();
  const url = typeof window !== 'undefined' ? window.location.origin + path : path;
  const opts = [
    { label: 'Repost', bg: '#ffc300', icon: <Repeat2 size={30} />, run: () => toast('Reposted to your followers') },
    { label: 'Send to friends', bg: '#fe2c55', icon: <Send size={28} />, run: () => toast('Sent to your friends') },
    { label: 'Copy', bg: '#2f80ed', icon: <Link2 size={30} />, run: () => { navigator.clipboard?.writeText(url).catch(() => {}); toast('Link copied'); } },
    { label: 'Message', bg: '#25d366', icon: <MessageSquare size={28} />, run: () => toast('Opened messaging') },
    { label: 'Embed', bg: '#3ec6d8', icon: <Code2 size={30} />, run: () => { navigator.clipboard?.writeText(`<iframe src="${url}"></iframe>`).catch(() => {}); toast('Embed code copied'); } },
    { label: 'Email', bg: '#8b5cf6', icon: <Mail size={28} />, run: () => { window.location.href = `mailto:?body=${encodeURIComponent(url)}`; } },
  ];
  return (
    <Modal open={open} onClose={onClose} title="Share to" width={560}>
      <ul className="flex gap-6 overflow-x-auto px-6 pb-6 no-scrollbar">
        {opts.map((o) => (
          <li key={o.label} className="flex w-16 shrink-0 flex-col items-center text-center">
            <button onClick={() => { o.run(); onClose(); }} aria-label={o.label} className="flex h-16 w-16 items-center justify-center rounded-full text-white hover:brightness-95" style={{ background: o.bg }}>
              {o.icon}
            </button>
            <span className="mt-2 text-13 leading-4 font-medium">{o.label}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
