import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { byId, similarTo, type Title } from '../data/catalog';
import { fmtTime, modalOrigin, useModal } from '../lib/hooks';
import { useProfileData } from '../store';
import { Caret, Close, Play, VolumeOff, VolumeOn } from './Icons';
import { ListButton, MaturityBadge, QualityBadges, RateButton } from './Actions';

function SeasonPicker({ t, season, setSeason }: { t: Title; season: number; setSeason: (n: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-3 rounded-sm border border-[#4d4d4d] bg-[#242424] px-4 py-2 text-lg font-medium">
        ซีซั่น {season} <Caret />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 top-full z-10 mt-1 min-w-[180px] rounded-sm border border-[#4d4d4d] bg-[#242424] py-1"
          >
            {t.seasons.map((s) => (
              <li key={s.number}>
                <button onClick={() => (setSeason(s.number), setOpen(false))} className={`flex w-full justify-between px-4 py-2 text-left hover:bg-[#414141] ${s.number === season ? 'font-semibold' : ''}`}>
                  ซีซั่น {s.number} <span className="text-sm text-[#bcbcbc]">({s.episodes.length} ตอน)</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalBody({ t, onClose }: { t: Title; onClose: () => void }) {
  const nav = useNavigate();
  const data = useProfileData();
  const modal = useModal();
  const scroller = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoOn, setVideoOn] = useState(false);
  const last = data.progress[t.id];
  const lastEpSeason = last?.episodeId ? Number(last.episodeId.split('-s')[1]?.split('e')[0]) : 1;
  const [season, setSeason] = useState(lastEpSeason || 1);
  const [moreOpen, setMoreOpen] = useState(false);
  const similar = useMemo(() => similarTo(t, 12), [t]);
  const eps = t.seasons.find((s) => s.number === season)?.episodes ?? [];

  useEffect(() => {
    const id = setTimeout(() => setVideoOn(true), 900);
    return () => clearTimeout(id);
  }, [t.id]);

  const play = (ep?: string) => nav(`/watch/${t.id}${ep ? `?ep=${ep}` : last?.episodeId ? `?ep=${last.episodeId}` : ''}`);

  return (
    <div ref={scroller} onScroll={(e) => setScrollY((e.target as HTMLDivElement).scrollTop)} className="fixed inset-0 overflow-y-auto overscroll-contain" onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        {/* header with parallax */}
        <div className="relative aspect-video overflow-hidden rounded-t-md">
          <div className="absolute inset-0" style={{ transform: `translateY(${scrollY * 0.35}px)` }}>
            <img src={t.backdrop} alt="" className="absolute inset-0 h-full w-full object-cover" />
            {videoOn && (
              <motion.video src={t.trailer} autoPlay muted={muted} loop playsInline className="absolute inset-0 h-full w-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
          <button onClick={onClose} aria-label="ปิด" className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-panel">
            <Close size={20} />
          </button>
          <div className="absolute bottom-[8%] left-[5%] right-[5%]">
            <h2 className="mb-5 max-w-[70%] font-display text-[clamp(32px,6vw,72px)] leading-[0.9]" style={{ transform: `translateY(${scrollY * 0.15}px)` }}>
              {t.title}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => play()} className="flex h-10 items-center gap-2 rounded-sm bg-white px-5 font-semibold text-black hover:bg-white/80 sm:px-7 sm:text-lg">
                <Play size={22} /> {last ? 'เล่นต่อ' : 'เล่น'}
              </button>
              <ListButton id={t.id} size={42} />
              <RateButton id={t.id} size={42} />
              <button onClick={() => setMuted((m) => !m)} aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'} className="ml-auto flex h-[42px] w-[42px] items-center justify-center rounded-full border-2 border-[#ffffff80] text-white hover:border-white">
                {muted ? <VolumeOff size={20} /> : <VolumeOn size={20} />}
              </button>
            </div>
          </div>
        </div>

        <div className="px-[5%] pb-10">
          {last && (
            <div className="mt-2 flex items-center gap-3 text-sm text-[#bcbcbc]">
              <div className="h-[3px] w-40 bg-[#5a5a5a]">
                <div className="h-full bg-accent" style={{ width: `${(last.t / Math.max(1, last.d)) * 100}%` }} />
              </div>
              เหลืออีก {fmtTime(Math.max(0, last.d - last.t))}
            </div>
          )}
          <div className="mt-4 grid gap-8 md:grid-cols-[2fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-base">
                <span className="font-semibold text-match">ตรงใจ {t.match}%</span>
                <span className="text-[#bcbcbc]">{t.year}</span>
                <span className="text-[#bcbcbc]">{t.durationLabel}</span>
                <QualityBadges uhd={t.quality.uhd} spatial={t.quality.spatial} />
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <MaturityBadge m={t.maturity} />
                <span className="text-[#ddd]">{t.tags.join(', ')}</span>
              </div>
              <p className="mt-5 text-base leading-relaxed">{t.synopsis}</p>
            </div>
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-[#777]">นักแสดง: </span>
                {t.cast.slice(0, 3).join(', ')}, <a href="#about" className="italic hover:underline">เพิ่มเติม</a>
              </p>
              <p>
                <span className="text-[#777]">ประเภท: </span>
                {t.genres.join(', ')}
              </p>
              <p>
                <span className="text-[#777]">รายการนี้: </span>
                {t.tags.join(', ')}
              </p>
            </div>
          </div>

          {t.kind === 'series' && (
            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">ตอน</h3>
                {t.seasons.length > 1 ? <SeasonPicker t={t} season={season} setSeason={setSeason} /> : <span className="text-lg">ซีซั่น 1</span>}
              </div>
              <motion.ul layout className="mt-4" transition={{ duration: 0.35 }}>
                <AnimatePresence mode="popLayout" initial={false}>
                  {eps.map((ep) => {
                    const p = data.episodes[ep.id];
                    return (
                      <motion.li
                        key={ep.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`group flex cursor-pointer items-center gap-4 rounded-sm border-b border-[#404040] p-4 hover:bg-[#333] max-sm:px-1 ${last?.episodeId === ep.id ? 'bg-[#333]' : ''}`}
                        onClick={() => play(ep.id)}
                      >
                        <span className="w-6 shrink-0 text-center text-2xl text-[#d2d2d2]">{ep.number}</span>
                        <div className="relative w-[130px] shrink-0 overflow-hidden rounded-sm">
                          <img src={ep.still} alt="" className="aspect-video w-full object-cover" />
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white bg-black/50">
                              <Play size={18} />
                            </span>
                          </span>
                          {p && (
                            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-[#5a5a5a]">
                              <div className="h-full bg-accent" style={{ width: `${(p.t / Math.max(1, p.d)) * 100}%` }} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-2 text-base font-medium">
                            <span className="truncate">{ep.title}</span>
                            <span className="shrink-0">{Math.round(ep.duration / 60)} นาที</span>
                          </div>
                          <p className="mt-1 line-clamp-3 text-sm text-[#d2d2d2]">{ep.synopsis}</p>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </motion.ul>
            </section>
          )}

          <section className="mt-10">
            <h3 className="text-2xl font-bold">เรื่องที่คล้ายกัน</h3>
            <motion.div
              className="relative mt-4 overflow-hidden"
              initial={false}
              animate={{ height: moreOpen ? 'auto' : 820 }}
              transition={{ duration: 0.5, ease: [0.5, 0, 0.1, 1] }}
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {similar.map((s) => (
                  <div
                    key={s.id}
                    className="cursor-pointer overflow-hidden rounded-sm bg-[#2f2f2f]"
                    onClick={() => {
                      scroller.current?.scrollTo({ top: 0, behavior: 'smooth' });
                      modal.open(s.id);
                    }}
                  >
                    <div className="relative">
                      <img src={s.boxart} alt="" className="aspect-video w-full object-cover" />
                      <span className="absolute right-2 top-1 text-sm font-semibold drop-shadow">{s.durationLabel}</span>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm">
                          <span className="block font-semibold text-match">ตรงใจ {s.match}%</span>
                          <span className="flex items-center gap-1.5">
                            <MaturityBadge m={s.maturity} /> {s.year}
                          </span>
                        </div>
                        <ListButton id={s.id} size={34} />
                      </div>
                      <p className="mt-3 line-clamp-4 text-sm text-[#d2d2d2]">{s.synopsis}</p>
                    </div>
                  </div>
                ))}
              </div>
              {!moreOpen && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-panel to-transparent" />}
            </motion.div>
            <div className="relative -mt-5 flex justify-center border-b-2 border-[#404040]">
              <button
                onClick={() => setMoreOpen((o) => !o)}
                aria-label={moreOpen ? 'แสดงน้อยลง' : 'แสดงเพิ่ม'}
                className="relative top-5 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#ffffffb3] bg-[#2a2a2a] hover:border-white"
              >
                <Caret className={`h-6 w-6 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </section>

          <section className="mt-14">
            <h3 className="text-2xl font-bold">ตัวอย่างและอื่นๆ</h3>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {t.extras.map((x) => (
                <button key={x.id} onClick={() => nav(`/watch/${t.id}?trailer=${x.id}`)} className="group text-left">
                  <div className="relative overflow-hidden rounded-sm">
                    <img src={x.still} alt="" className="aspect-video w-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white bg-black/50 transition-transform group-hover:scale-110">
                        <Play size={20} />
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium">{x.title}</p>
                </button>
              ))}
            </div>
          </section>

          <section id="about" className="mt-12 space-y-2 text-sm">
            <h3 className="mb-3 text-2xl">
              เกี่ยวกับ <strong>{t.title}</strong>
            </h3>
            <p>
              <span className="text-[#777]">ผู้สร้าง: </span>
              {t.creators.join(', ')}
            </p>
            <p>
              <span className="text-[#777]">นักแสดง: </span>
              {t.cast.join(', ')}
            </p>
            <p>
              <span className="text-[#777]">ประเภท: </span>
              {t.genres.join(', ')}
            </p>
            <p>
              <span className="text-[#777]">ความเหมาะสม: </span>
              <MaturityBadge m={t.maturity} /> เหมาะสำหรับผู้ชมอายุ {t.maturity} ขึ้นไป
            </p>
          </section>
        </div>
      </ModalCard>
    </div>
  );
}

function ModalCard({ children, onClick }: { children: ReactNode; onClick: (e: MouseEvent) => void }) {
  const r = modalOrigin.rect;
  // grow out of the clicked card: start at its centre, scaled down
  const from = r
    ? { opacity: 0, scale: Math.max(0.25, r.width / Math.min(850, window.innerWidth)), x: r.left + r.width / 2 - window.innerWidth / 2, y: r.top - 32 }
    : { opacity: 0, scale: 0.9, x: 0, y: 40 };
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      onClick={onClick}
      className="relative mx-auto mb-8 mt-8 w-[calc(100%-16px)] max-w-[850px] origin-top overflow-hidden rounded-md bg-panel shadow-[0_3px_10px_rgba(0,0,0,.75)] max-sm:mt-0 max-sm:w-full"
      initial={from}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      exit={{ ...from, opacity: 0, transition: { duration: 0.25 } }}
      transition={{ duration: 0.45, ease: [0.215, 0.61, 0.355, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function DetailModal() {
  const { id, close } = useModal();
  const t = id ? byId(id) : undefined;

  useEffect(() => {
    if (!t) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const k = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', k);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', k);
    };
  }, [t, close]);

  return (
    <AnimatePresence>
      {t && (
        <motion.div key="backdrop" className="fixed inset-0 z-50" initial={{ backgroundColor: 'rgba(0,0,0,0)' }} animate={{ backgroundColor: 'rgba(0,0,0,0.7)' }} exit={{ backgroundColor: 'rgba(0,0,0,0)' }}>
          <ModalBody key={t.id} t={t} onClose={close} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
