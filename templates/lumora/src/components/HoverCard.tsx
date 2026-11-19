import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useHover, useModal } from '../lib/hooks';
import { useActiveProfile } from '../store';
import { ChevronDown, VolumeOff, VolumeOn } from './Icons';
import { ListButton, MaturityBadge, PlayCircle, QualityBadges, RateButton } from './Actions';

const SCALE = 1.4;

/** The expanded preview card. Rendered once in a portal, positioned over the hovered card so neighbours never move. */
export function HoverPortal() {
  const { title: t, rect, edge, progress, hide } = useHover();
  const profile = useActiveProfile();
  const modal = useModal();
  const [videoOn, setVideoOn] = useState(false);
  const [muted, setMuted] = useState(true);
  const vref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setVideoOn(false);
    if (!t || profile?.autoplayPreviews === false) return;
    const id = setTimeout(() => setVideoOn(true), 900);
    return () => clearTimeout(id);
  }, [t, profile?.autoplayPreviews]);

  useEffect(() => {
    const f = () => hide();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, [hide]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {t && rect && (
        <motion.div
          key={t.id}
          onMouseLeave={hide}
          className="absolute z-40 overflow-hidden rounded-md bg-panel shadow-[0_3px_10px_rgba(0,0,0,.75)]"
          style={{
            top: rect.top + window.scrollY - (rect.height * (SCALE - 1)) / 2,
            left: edge === 'left' ? rect.left : edge === 'right' ? rect.right - rect.width * SCALE : rect.left - (rect.width * (SCALE - 1)) / 2,
            width: rect.width * SCALE,
            transformOrigin: edge === 'left' ? 'left top' : edge === 'right' ? 'right top' : 'center top',
          }}
          initial={{ scale: 1 / SCALE, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1 / SCALE, opacity: 0, transition: { duration: 0.18 } }}
          transition={{ duration: 0.3, ease: [0.215, 0.61, 0.355, 1] }}
        >
          <div className="relative aspect-video cursor-pointer bg-black" onClick={() => (hide(), modal.open(t.id, rect))}>
            <img src={t.boxart} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <AnimatePresence>
              {videoOn && (
                <motion.video
                  ref={vref}
                  key="v"
                  src={t.trailer}
                  autoPlay
                  muted={muted}
                  loop
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </AnimatePresence>
            {videoOn && (
              <button
                aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
                onClick={(e) => {
                  e.stopPropagation();
                  setMuted((m) => !m);
                }}
                className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border border-[#ffffffb3] bg-black/40"
              >
                {muted ? <VolumeOff size={14} /> : <VolumeOn size={14} />}
              </button>
            )}
            {progress !== undefined && (
              <div className="absolute inset-x-3 bottom-1 h-[3px] bg-[#5a5a5a]">
                <div className="h-full bg-accent" style={{ width: `${progress * 100}%` }} />
              </div>
            )}
          </div>
          <motion.div
            className="p-3 text-[13px]"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } } }}
          >
            <motion.div variants={item} className="flex items-center gap-2">
              <PlayCircle id={t.id} size={34} />
              <ListButton id={t.id} size={34} />
              <RateButton id={t.id} size={34} />
              <button
                aria-label="ข้อมูลเพิ่มเติม"
                onClick={() => (hide(), modal.open(t.id, rect))}
                className="ml-auto flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-[#ffffffb3] bg-[#2a2a2a99] hover:border-white"
              >
                <ChevronDown size={18} />
              </button>
            </motion.div>
            <motion.div variants={item} className="mt-3 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-match">ตรงใจ {t.match}%</span>
              <MaturityBadge m={t.maturity} />
              <span className="text-[#ddd]">{t.durationLabel}</span>
              <QualityBadges uhd={t.quality.uhd} spatial={false} />
            </motion.div>
            <motion.div variants={item} className="mt-2 flex flex-wrap items-center text-white">
              {t.tags.concat(t.genres.slice(0, 1)).map((g, i) => (
                <span key={g} className="flex items-center">
                  {i > 0 && <span className="mx-1.5 text-[#646464]">•</span>}
                  {g}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };
