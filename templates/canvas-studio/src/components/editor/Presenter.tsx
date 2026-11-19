'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize, Timer, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { DesignProject } from '@/types/canva';
import { PageView } from '@/components/design/ElementView';

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** Fullscreen slideshow: arrow keys / space / click to move, Esc to leave, entrance animations replay per page. */
export function Presenter({ project, start = 0, onExit }: { project: DesignProject; start?: number; onExit: () => void }) {
  const total = project.pages.length;
  const [i, setI] = useState(Math.min(Math.max(0, start), total - 1));
  const [dir, setDir] = useState(1);
  const [vw, setVw] = useState({ w: 1280, h: 720 });
  const [secs, setSecs] = useState(0);
  const [chrome, setChrome] = useState(true);

  const go = useCallback((d: number) => {
    setI((x) => {
      const n = Math.min(total - 1, Math.max(0, x + d));
      if (n !== x) setDir(d);
      return n;
    });
  }, [total]);

  useEffect(() => {
    const size = () => setVw({ w: window.innerWidth, h: window.innerHeight });
    size();
    window.addEventListener('resize', size);
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    document.documentElement.requestFullscreen?.().catch(() => undefined); // browsers may refuse without a click; the button below retries
    return () => {
      window.removeEventListener('resize', size);
      clearInterval(t);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) (e.preventDefault(), go(1));
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) (e.preventDefault(), go(-1));
      else if (e.key === 'Home') setI(0);
      else if (e.key === 'End') setI(total - 1);
      else if (e.key === 'Escape' && !document.fullscreenElement) onExit();
    };
    const onFs = () => !document.fullscreenElement && setChrome(true);
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, [go, onExit, total]);

  // hide the controls after a moment of no mouse movement
  useEffect(() => {
    if (!chrome) return;
    const t = setTimeout(() => setChrome(false), 2500);
    return () => clearTimeout(t);
  }, [chrome, i]);

  const s = Math.min(vw.w / project.width, vw.h / project.height);
  const page = project.pages[i];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black text-white" onMouseMove={() => setChrome(true)} onClick={() => go(1)}>
      <AnimatePresence mode="popLayout" custom={dir} initial={false}>
        <motion.div
          key={page.id}
          custom={dir}
          initial={{ opacity: 0, x: dir * 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -80 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          style={{ width: project.width * s, height: project.height * s }}
        >
          <div style={{ transform: `scale(${s})`, transformOrigin: '0 0' }}>
            <PageView page={page} width={project.width} height={project.height} animate />
          </div>
        </motion.div>
      </AnimatePresence>

      <motion.div
        animate={{ opacity: chrome ? 1 : 0, y: chrome ? 0 : 16 }}
        className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/70 px-2 py-1.5 text-sm backdrop-blur"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => go(-1)} disabled={i === 0} aria-label="Previous page" className="rounded-full p-1.5 hover:bg-white/10 disabled:opacity-30">
          <ChevronLeft size={18} />
        </button>
        <span className="min-w-14 text-center font-mono text-xs">
          {i + 1} / {total}
        </span>
        <button onClick={() => go(1)} disabled={i === total - 1} aria-label="Next page" className="rounded-full p-1.5 hover:bg-white/10 disabled:opacity-30">
          <ChevronRight size={18} />
        </button>
        <span className="mx-1 h-4 w-px bg-white/20" />
        <span className="flex items-center gap-1 px-1 font-mono text-xs text-white/80" title="Speaker timer">
          <Timer size={14} /> {fmt(secs)}
        </span>
        <button onClick={() => setSecs(0)} className="rounded-full px-2 py-1 text-xs hover:bg-white/10">
          Reset
        </button>
        <button onClick={() => document.documentElement.requestFullscreen?.().catch(() => undefined)} aria-label="Fullscreen" className="rounded-full p-1.5 hover:bg-white/10">
          <Maximize size={16} />
        </button>
        <button onClick={onExit} aria-label="Exit presentation" className="rounded-full p-1.5 hover:bg-white/10">
          <X size={16} />
        </button>
      </motion.div>
    </div>
  );
}
