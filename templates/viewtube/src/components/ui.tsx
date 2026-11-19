'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { Channel } from '@/types/youtube';
import { cx } from '@/lib/format';

export function Logo() {
  return (
    <Link href="/" aria-label="ViewTube home" className="flex h-14 items-center gap-1 pl-4 pr-3.5">
      <svg width="30" height="21" viewBox="0 0 30 21" aria-hidden>
        <rect width="30" height="21" rx="6" fill="#FF0000" />
        <path d="M12 6v9l8-4.5z" fill="#fff" />
      </svg>
      <span className="text-[19px] font-bold tracking-[-0.06em] text-white">ViewTube</span>
      <sup className="-mt-3 text-2xs text-muted">TH</sup>
    </Link>
  );
}

export function Verified({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('inline-block h-3.5 w-3.5 fill-muted', className)} aria-label="Verified">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM9.8 17.3l-4.2-4.1L7 11.8l2.8 2.7L17 7.4l1.4 1.4-8.6 8.5z" />
    </svg>
  );
}

export function GradientAvatar({
  colors,
  label,
  size = 36,
  className = '',
}: {
  colors: [string, string];
  label: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cx('grid shrink-0 place-items-center rounded-full font-medium text-white select-none', className)}
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`, fontSize: size * 0.38 }}
      aria-hidden
    >
      {label}
    </span>
  );
}

export function ChannelAvatar({ channel, size = 36, className = '' }: { channel: Channel; size?: number; className?: string }) {
  return (
    <Link href={`/channel/${channel.id}`} aria-label={channel.name} className={cx('shrink-0', className)} onClick={(e) => e.stopPropagation()}>
      <GradientAvatar colors={channel.avatar} label={channel.initials} size={size} />
    </Link>
  );
}

export function useClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [ref, onOutside, active]);
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (box.current && !box.current.contains(e.target as Node)) onClose();
          }}
        >
          <motion.div
            ref={box}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cx('w-full rounded-card bg-elevated p-6 shadow-card', width)}
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-medium">{title}</h2>
              <IconButton label="Close" onClick={onClose}>
                <X size={22} />
              </IconButton>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function IconButton({
  label,
  onClick,
  children,
  className = '',
  active = false,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cx(
        'grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors hover:bg-soft active:bg-white/20',
        active && 'bg-soft',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'h-8 shrink-0 rounded-chip px-3 text-sm font-medium whitespace-nowrap transition-colors',
        active ? 'bg-ink text-canvas' : 'bg-raised text-ink hover:bg-hover',
      )}
    >
      {children}
    </button>
  );
}

export function PillButton({
  children,
  onClick,
  variant = 'soft',
  className = '',
  type = 'button',
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'soft' | 'white' | 'red' | 'blue' | 'outline';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const styles = {
    soft: 'bg-raised hover:bg-hover text-ink',
    white: 'bg-ink hover:bg-[#d9d9d9] text-canvas',
    red: 'bg-brand hover:bg-brand-dark text-white',
    blue: 'bg-link hover:bg-[#65b8ff] text-canvas',
    outline: 'border border-line text-link hover:bg-[#263850]',
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'inline-flex h-9 items-center gap-1.5 rounded-pill px-4 text-sm font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent<string>('vt-toast', { detail: message }));
}

export function Toaster() {
  const [msg, setMsg] = useState<{ text: string; key: number } | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const fn = (e: Event) => {
      setMsg({ text: (e as CustomEvent<string>).detail, key: Date.now() });
      clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), 2600);
    };
    window.addEventListener('vt-toast', fn);
    return () => {
      window.removeEventListener('vt-toast', fn);
      clearTimeout(timer);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-6 left-6 z-[120]" aria-live="polite">
      <AnimatePresence>
        {msg && (
          <motion.div
            key={msg.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="rounded-chip bg-[#f1f1f1] px-4 py-3 text-sm text-canvas shadow-card"
          >
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function EmptyState({ icon, title, text, children }: { icon: ReactNode; title: string; text: string; children?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[700px] flex-col items-center px-4 pt-[120px] text-center">
      <div className="mb-6 text-ink">{icon}</div>
      <h2 className="mb-4 text-2xl font-medium">{title}</h2>
      <p className="mb-6 text-sm text-ink">{text}</p>
      {children}
    </div>
  );
}
