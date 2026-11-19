import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, DoubleThumb, Play, Plus, ThumbDown, ThumbUp } from './Icons';
import { useProfileData, useStore, type Rating } from '../store';

const circle = 'relative flex items-center justify-center rounded-full border-2 border-[#ffffffb3] bg-[#2a2a2a99] text-white transition-colors hover:border-white';

export function PlayCircle({ id, size = 36, episodeId }: { id: string; size?: number; episodeId?: string }) {
  const nav = useNavigate();
  return (
    <button
      aria-label="เล่น"
      onClick={(e) => {
        e.stopPropagation();
        nav(`/watch/${id}${episodeId ? `?ep=${episodeId}` : ''}`);
      }}
      className="flex items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-[#e6e6e6]"
      style={{ width: size, height: size }}
    >
      <Play size={size * 0.5} />
    </button>
  );
}

export function ListButton({ id, size = 36 }: { id: string; size?: number }) {
  const inList = useProfileData().myList.includes(id);
  const toggle = useStore((s) => s.toggleList);
  return (
    <button
      aria-label={inList ? 'นำออกจากรายการของฉัน' : 'เพิ่มในรายการของฉัน'}
      title={inList ? 'นำออกจากรายการของฉัน' : 'เพิ่มในรายการของฉัน'}
      onClick={(e) => {
        e.stopPropagation();
        toggle(id);
      }}
      className={circle}
      style={{ width: size, height: size }}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={inList ? 'c' : 'p'}
          initial={{ rotate: inList ? -90 : 90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: inList ? 90 : -90, scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="flex"
        >
          {inList ? <Check size={size * 0.5} /> : <Plus size={size * 0.5} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

const RATINGS: { r: Rating; label: string; Icon: typeof ThumbUp }[] = [
  { r: 'down', label: 'ไม่ใช่แนวฉัน', Icon: ThumbDown },
  { r: 'up', label: 'ชอบเรื่องนี้', Icon: ThumbUp },
  { r: 'love', label: 'รักเรื่องนี้!', Icon: DoubleThumb },
];

/** Thumb button that pops out the 3-way rating selector on hover. */
export function RateButton({ id, size = 36 }: { id: string; size?: number }) {
  const current = useProfileData().ratings[id];
  const rate = useStore((s) => s.rate);
  const [open, setOpen] = useState(false);
  const timer = useRef<number>();
  const Cur = RATINGS.find((x) => x.r === current)?.Icon ?? ThumbUp;
  return (
    <div
      className="relative"
      onMouseEnter={() => {
        clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setOpen(true), 150);
      }}
      onMouseLeave={() => {
        clearTimeout(timer.current);
        setOpen(false);
      }}
    >
      <button
        aria-label="ให้คะแนน"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={circle}
        style={{ width: size, height: size }}
      >
        <Cur size={size * 0.5} filled={!!current} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-[#232323] px-1.5 py-1 shadow-[0_0_8px_rgba(0,0,0,.6)]"
          >
            {RATINGS.map(({ r, label, Icon }, i) => (
              <motion.button
                key={r}
                aria-label={label}
                title={label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.2 }}
                onClick={(e) => {
                  e.stopPropagation();
                  rate(id, current === r ? null : r);
                  setOpen(false);
                }}
                className={`flex items-center justify-center rounded-full ${current === r ? 'text-white' : 'text-[#ddd]'} hover:bg-[#ffffff1f]`}
                style={{ width: size - 4, height: size - 4 }}
              >
                <Icon size={size * 0.5} filled={current === r} />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MaturityBadge({ m, className = '' }: { m: string; className?: string }) {
  return <span className={`inline-block border border-[#ffffff66] px-1.5 text-[0.85em] leading-[1.4] text-[#ddd] ${className}`}>{m}</span>;
}

export function QualityBadges({ uhd, spatial }: { uhd: boolean; spatial: boolean }) {
  return (
    <span className="inline-flex gap-1.5 align-middle">
      <span className="rounded-[3px] border border-[#ffffff66] px-1 text-[0.7em] font-semibold leading-[1.5] text-[#ddd]">HD</span>
      {uhd && <span className="rounded-[3px] border border-[#ffffff66] px-1 text-[0.7em] font-semibold leading-[1.5] text-[#ddd]">4K</span>}
      {spatial && (
        <span className="rounded-[3px] border border-[#ffffff66] px-1 text-[0.7em] font-semibold leading-[1.5] text-[#ddd]" title="เสียงรอบทิศทาง">
          ◉ Spatial Audio
        </span>
      )}
    </span>
  );
}
