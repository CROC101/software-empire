'use client';

import { useEffect, useState } from 'react';
import { Code2, Mail, MessageCircle, Send } from 'lucide-react';
import { Modal, PillButton, toast } from '@/components/ui';
import { clock } from '@/lib/format';

export default function ShareModal({
  videoId,
  open,
  onClose,
  currentTime = 0,
  startChecked = false,
}: {
  videoId: string;
  open: boolean;
  onClose: () => void;
  currentTime?: number;
  startChecked?: boolean;
}) {
  const [withTime, setWithTime] = useState(startChecked);
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
    if (open) setWithTime(startChecked);
  }, [open, startChecked]);

  const t = Math.floor(currentTime);
  const url = `${origin}/watch/?v=${videoId}${withTime && t > 0 ? `&t=${t}` : ''}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied to clipboard');
    } catch {
      toast('Copy failed — select the link and copy it manually');
    }
  };

  const targets = [
    { label: 'Embed', icon: <Code2 size={22} />, bg: '#3f3f3f' },
    { label: 'Message', icon: <MessageCircle size={22} />, bg: '#25a244' },
    { label: 'Send', icon: <Send size={22} />, bg: '#2f80ed' },
    { label: 'Email', icon: <Mail size={22} />, bg: '#888888' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Share" width="max-w-lg">
      <div className="mb-5 flex gap-5 overflow-x-auto no-scrollbar">
        {targets.map((x) => (
          <button key={x.label} type="button" onClick={copy} className="flex shrink-0 flex-col items-center gap-2 text-xs">
            <span className="grid h-[60px] w-[60px] place-items-center rounded-full text-white" style={{ background: x.bg }}>
              {x.icon}
            </span>
            {x.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-card border border-line bg-canvas p-2 pl-3">
        <input readOnly value={url} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 bg-transparent text-sm outline-none" aria-label="Video link" />
        <PillButton variant="blue" onClick={copy}>
          Copy
        </PillButton>
      </div>
      <label className="mt-4 flex items-center gap-3 border-t border-line pt-4 text-sm">
        <input type="checkbox" checked={withTime} onChange={(e) => setWithTime(e.target.checked)} className="h-4 w-4 accent-link" />
        Start at <span className="tabular">{clock(t)}</span>
      </label>
    </Modal>
  );
}
