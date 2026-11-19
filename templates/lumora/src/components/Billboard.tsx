import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Title } from '../data/catalog';
import { useModal } from '../lib/hooks';
import { useActiveProfile } from '../store';
import { Info, Play, Replay, VolumeOff, VolumeOn } from './Icons';

export function Billboard({ t }: { t: Title }) {
  const nav = useNavigate();
  const modal = useModal();
  const profile = useActiveProfile();
  const vref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(true);
  const [shrunk, setShrunk] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setEnded(false);
    setShrunk(false);
    if (profile?.autoplayPreviews === false) return;
    const start = setTimeout(() => vref.current?.play().catch(() => {}), 1800);
    return () => clearTimeout(start);
  }, [t.id, profile?.autoplayPreviews]);

  // title logo shrinks/repositions after 3s of playback
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => setShrunk(true), 3000);
    return () => clearTimeout(id);
  }, [playing]);

  // pause preview while a modal is open or tab hidden
  useEffect(() => {
    const v = vref.current;
    if (!v || !playing) return;
    if (modal.id) v.pause();
    else if (!ended) v.play().catch(() => {});
  }, [modal.id, playing, ended]);

  const toggleSound = () => {
    setRippleKey((k) => k + 1);
    if (ended) {
      setEnded(false);
      setShrunk(false);
      vref.current!.currentTime = 0;
      vref.current?.play().catch(() => {});
      return;
    }
    setMuted((m) => !m);
  };

  return (
    <section className="relative h-[56.25vw] max-h-[85vh] min-h-[320px] w-full overflow-hidden bg-app" aria-label={t.title}>
      <img src={t.backdrop} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <video
        ref={vref}
        src={t.trailer}
        muted={muted}
        playsInline
        preload="metadata"
        onPlaying={() => setPlaying(true)}
        onEnded={() => {
          setEnded(true);
          setPlaying(false);
          setShrunk(false);
        }}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out"
        style={{ opacity: playing ? 1 : 0 }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, rgba(0,0,0,.6), transparent 85%)' }} />
      <div className="absolute inset-x-0 bottom-0 h-[14.7vw]" style={{ background: 'linear-gradient(180deg, rgba(20,20,20,0) 0, rgba(20,20,20,.15) 15%, rgba(20,20,20,.35) 29%, rgba(20,20,20,.58) 44%, #141414 68%, #141414)' }} />

      <div className="absolute bottom-[35%] left-[4%] w-[36%] min-w-[260px] max-sm:bottom-[22%] max-sm:w-[80%]">
        <motion.h1
          className="origin-bottom-left font-display leading-[0.9] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,.6)]"
          style={{ fontSize: 'clamp(40px, 6.4vw, 120px)' }}
          animate={{ scale: shrunk ? 0.62 : 1, y: shrunk ? '1.2vw' : 0 }}
          transition={{ duration: 1.3, ease: [0.5, 0, 0.1, 1] }}
        >
          {t.title}
        </motion.h1>
        <motion.p
          className="mt-[1.2vw] text-[1.2vw] leading-snug text-white drop-shadow-[0_2px_4px_rgba(0,0,0,.45)] max-sm:hidden"
          style={{ fontSize: 'max(14px, 1.2vw)' }}
          animate={{ opacity: shrunk ? 0 : 1, height: shrunk ? 0 : 'auto' }}
          transition={{ duration: 1.1, ease: [0.5, 0, 0.1, 1] }}
        >
          {t.synopsis}
        </motion.p>
        <div className="mt-[1.5vw] flex gap-2.5 max-sm:mt-3">
          <button onClick={() => nav(`/watch/${t.id}`)} className="flex items-center gap-2.5 rounded-sm bg-white px-[2.4vw] py-[0.6vw] text-[1.3vw] font-semibold text-black hover:bg-white/75 max-sm:px-4 max-sm:py-1.5 max-sm:text-sm" style={{ fontSize: 'max(14px, 1.3vw)' }}>
            <Play size={24} className="max-sm:h-4 max-sm:w-4" /> เล่น
          </button>
          <button onClick={() => modal.open(t.id)} className="flex items-center gap-2.5 rounded-sm bg-gray-btn px-[2.4vw] py-[0.6vw] font-semibold text-white hover:bg-[#6d6d6e66] max-sm:px-4 max-sm:py-1.5 max-sm:text-sm" style={{ fontSize: 'max(14px, 1.3vw)' }}>
            <Info size={24} className="max-sm:h-4 max-sm:w-4" /> ข้อมูลเพิ่มเติม
          </button>
        </div>
      </div>

      <div className="absolute bottom-[35%] right-0 flex items-center gap-3 max-sm:bottom-[22%]">
        <button
          key={rippleKey}
          aria-label={ended ? 'เล่นซ้ำ' : muted ? 'เปิดเสียง' : 'ปิดเสียง'}
          onClick={toggleSound}
          className={`relative flex h-[2.4vw] min-h-8 w-[2.4vw] min-w-8 items-center justify-center rounded-full border border-[#ffffffb3] text-white hover:bg-white/10 ${rippleKey ? 'ripple' : ''}`}
        >
          {ended ? <Replay size={18} /> : muted ? <VolumeOff size={18} /> : <VolumeOn size={18} />}
        </button>
        <span className="border-l-[3px] border-[#dcdcdc] bg-[#33333399] py-[0.5vw] pl-[0.8vw] pr-[3.5vw] text-[1.1vw] text-white" style={{ fontSize: 'max(12px, 1.1vw)' }}>
          {t.maturity}
        </span>
      </div>
    </section>
  );
}
