'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
}

/** Centered dialog with a dim backdrop. */
export function Modal({ open, onClose, title, children, width = 480 }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; width?: number }) {
  useEscape(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay p-0 sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            className="relative max-h-[92vh] w-full overflow-y-auto rounded-none bg-card text-ink shadow-2xl sm:rounded-md"
            style={{ maxWidth: width }}
            initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="relative flex h-14 items-center justify-center px-12">
                <h2 className="text-17 font-semibold">{title}</h2>
                <button aria-label="Close" onClick={onClose} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full hover:bg-pill"><X size={22} /></button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Side drawer (right by default) or bottom sheet. */
export function Drawer({ open, onClose, title, children, side = 'right', width = 420 }: { open: boolean; onClose: () => void; title: string; children: ReactNode; side?: 'right' | 'bottom'; width?: number }) {
  useEscape(open, onClose);
  const from = side === 'right' ? { x: '100%' } : { y: '100%' };
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] bg-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.aside
            role="dialog" aria-modal="true" aria-label={title}
            className={side === 'right'
              ? 'absolute right-0 top-0 flex h-full w-full flex-col bg-card text-ink shadow-2xl'
              : 'absolute bottom-0 left-0 right-0 mx-auto flex max-h-[85vh] w-full flex-col rounded-t-[16px] bg-card text-ink shadow-2xl'}
            style={side === 'right' ? { maxWidth: width } : { maxWidth: 560 }}
            initial={from} animate={{ x: 0, y: 0 }} exit={from} transition={{ type: 'tween', duration: 0.22 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
              <h2 className="text-17 font-semibold">{title}</h2>
              <button aria-label="Close" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-pill"><X size={20} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toast({ text }: { text: string | null }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div role="status" className="fixed left-1/2 top-6 z-[120] -translate-x-1/2 rounded-md bg-dim px-4 py-3 text-14 font-medium text-white backdrop-blur" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
