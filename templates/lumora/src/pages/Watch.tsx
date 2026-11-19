import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { byId } from '../data/catalog';
import { fmtTime } from '../lib/hooks';
import { useActiveProfile, useStore } from '../store';
import { Back, Back10, Close, Episodes, Fullscreen, Fwd10, NextEp, Pause, Play, Speed, Subtitles, VolumeOff, VolumeOn } from '../components/Icons';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];
const AUDIO = ['ไทย [ต้นฉบับ]', 'อังกฤษ', 'ญี่ปุ่น'];
const SUBS = ['ปิด', 'ไทย', 'อังกฤษ'];
const INTRO: [number, number] = [3, 12];
// Placeholder subtitle lines (clips have no speech); one cue per 5s window.
const CUES: Record<string, string[]> = {
  ไทย: ['เธอได้ยินเสียงนั่นไหม', 'เราต้องไปก่อนพระอาทิตย์ตก', 'ทุกอย่างจะไม่เหมือนเดิมอีกแล้ว', 'ฉันจะไม่ทิ้งเธอไว้ที่นี่', 'เชื่อฉันสักครั้ง'],
  อังกฤษ: ['Did you hear that?', 'We have to leave before sunset.', 'Nothing will ever be the same.', "I won't leave you here.", 'Trust me, just this once.'],
};

function Pop({ open, children, className = '' }: { open: boolean; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-full right-0 mb-5 rounded-sm bg-[#262626] text-white shadow-xl ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Watch() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const t = byId(id);
  const profile = useActiveProfile();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const saveProgress = useStore((s) => s.saveProgress);

  const allEps = t?.seasons.flatMap((s) => s.episodes) ?? [];
  const trailer = t?.extras.find((x) => x.id === params.get('trailer'));
  const epId = params.get('ep') ?? (t?.kind === 'series' && !trailer ? useStore.getState().data[useStore.getState().activeId ?? '']?.progress[id]?.episodeId ?? allEps[0]?.id : undefined);
  const ep = allEps.find((e) => e.id === epId);
  const next = ep ? allEps[allEps.indexOf(ep) + 1] : undefined;
  const src = trailer?.video ?? ep?.video ?? t?.video ?? '';

  const root = useRef<HTMLDivElement>(null);
  const v = useRef<HTMLVideoElement>(null);
  const pv = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number>();
  const lastSave = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [hud, setHud] = useState(true);
  const [panel, setPanel] = useState<null | 'speed' | 'subs' | 'eps' | 'vol'>(null);
  const [burst, setBurst] = useState<{ k: number; play: boolean } | null>(null);
  const [spin, setSpin] = useState<{ k: number; dir: 1 | -1 } | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [error, setError] = useState(false);
  const [creditsDismissed, setCreditsDismissed] = useState(false);
  const [drawerSeason, setDrawerSeason] = useState(ep?.season ?? 1);

  const save = useCallback(() => {
    const el = v.current;
    if (!t || trailer || !el || !el.duration) return;
    saveProgress(t.id, { t: el.currentTime, d: el.duration, at: Date.now(), episodeId: ep?.id });
  }, [t, trailer, ep?.id, saveProgress]);

  // HUD auto-hide after 3s of no input while playing
  const poke = useCallback(() => {
    setHud(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setHud(false), 3000);
  }, []);
  useEffect(() => () => clearTimeout(hideTimer.current), []);
  const showHud = hud || !playing || panel !== null || scrubbing;

  // apply persisted playback settings
  useEffect(() => {
    if (!v.current) return;
    v.current.playbackRate = settings.speed;
    v.current.volume = settings.volume;
    v.current.muted = settings.muted;
  }, [settings.speed, settings.volume, settings.muted, src]);

  // reset per-source state; save on leave
  useEffect(() => {
    setError(false);
    setCreditsDismissed(false);
    setCur(0);
    if (ep) setDrawerSeason(ep.season);
    return () => save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const toggle = useCallback(() => {
    const el = v.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
    setBurst((b) => ({ k: (b?.k ?? 0) + 1, play: el.paused === false }));
  }, []);

  const skip = useCallback((d: 1 | -1) => {
    const el = v.current;
    if (!el) return;
    el.currentTime = Math.min(Math.max(0, el.currentTime + d * 10), el.duration || 0);
    setSpin((s) => ({ k: (s?.k ?? 0) + 1, dir: d }));
  }, []);

  const fullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else root.current?.requestFullscreen?.().catch(() => {});
  }, []);

  const goNext = useCallback(() => next && nav(`/watch/${id}?ep=${next.id}`, { replace: true }), [next, id, nav]);
  const back = () => (window.history.state?.idx > 0 ? nav(-1) : nav('/browse'));

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      poke();
      if (e.key === ' ' || e.key === 'k') (e.preventDefault(), toggle());
      else if (e.key === 'ArrowLeft') skip(-1);
      else if (e.key === 'ArrowRight') skip(1);
      else if (e.key === 'ArrowUp') (e.preventDefault(), setSettings({ volume: Math.min(1, settings.volume + 0.1), muted: false }));
      else if (e.key === 'ArrowDown') (e.preventDefault(), setSettings({ volume: Math.max(0, settings.volume - 0.1) }));
      else if (e.key === 'm') setSettings({ muted: !settings.muted });
      else if (e.key === 'f') fullscreen();
      else if (e.key === 'Escape') setPanel(null);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [poke, toggle, skip, fullscreen, setSettings, settings.volume, settings.muted]);

  if (!t) return <Navigate to="/browse" replace />;

  const frac = (clientX: number) => {
    const r = bar.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };
  const seekTo = (clientX: number) => {
    if (v.current && dur) v.current.currentTime = frac(clientX) * dur;
  };
  const hoverTime = hoverX !== null ? hoverX * dur : 0;
  const cueLines = CUES[settings.subtitles];
  const cue = cueLines && cur % 5 < 4 && cur > 1 ? cueLines[Math.floor(cur / 5) % cueLines.length] : null;
  const inIntro = !!ep && cur >= INTRO[0] && cur < INTRO[1];
  const showNext = !!next && dur > 0 && dur - cur <= 8 && !creditsDismissed;
  const nextIn = Math.max(0, Math.ceil(dur - cur));
  const heading = trailer ? `${t.title}: ${trailer.title}` : ep ? `${t.title}` : t.title;

  return (
    <div
      ref={root}
      className={`fixed inset-0 z-50 select-none bg-black text-white ${showHud ? '' : 'cursor-none'}`}
      onMouseMove={poke}
      onClick={() => (panel ? setPanel(null) : toggle())}
    >
      <video
        ref={v}
        key={src}
        src={src}
        autoPlay
        playsInline
        className="absolute inset-0 h-full w-full object-contain"
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          setDur(el.duration);
          el.playbackRate = settings.speed;
          const st = useStore.getState();
          const d = st.data[st.activeId ?? ''];
          const saved = trailer ? undefined : ep ? d?.episodes[ep.id] : d?.progress[t.id]?.episodeId ? undefined : d?.progress[t.id];
          if (saved && saved.t > 2 && saved.t < el.duration - 5) el.currentTime = saved.t;
        }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          setCur(el.currentTime);
          if (el.buffered.length) setBuffered(el.buffered.end(el.buffered.length - 1));
          if (Date.now() - lastSave.current > 3000) (lastSave.current = Date.now(), save());
        }}
        onPlay={() => (setPlaying(true), poke())}
        onPause={() => (setPlaying(false), save())}
        onEnded={() => {
          save();
          if (next && profile?.autoplayNext !== false && !creditsDismissed) goNext();
        }}
        onError={() => setError(true)}
      />

      {/* subtitles */}
      {cue && (
        <div className="pointer-events-none absolute inset-x-0 flex justify-center transition-[bottom] duration-300" style={{ bottom: showHud ? '18%' : '8%' }}>
          <span className="rounded-sm bg-black/60 px-3 py-1 text-[clamp(16px,2.2vw,34px)] font-medium [text-shadow:0_0_6px_#000]">{cue}</span>
        </div>
      )}

      {/* play / pause burst */}
      <AnimatePresence>
        {burst && (
          <motion.div
            key={burst.k}
            className="pointer-events-none absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/40"
            initial={{ opacity: 0.9, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {burst.play ? <Play size={44} /> : <Pause size={44} />}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 text-center">
          <p className="text-xl">ขออภัย ไม่สามารถเล่นวิดีโอนี้ได้ในขณะนี้</p>
          <button onClick={(e) => (e.stopPropagation(), back())} className="rounded-sm bg-white px-6 py-2 font-semibold text-black">
            กลับไปเรียกดู
          </button>
        </div>
      )}

      {/* Skip intro */}
      <AnimatePresence>
        {inIntro && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={(e) => {
              e.stopPropagation();
              if (v.current) v.current.currentTime = INTRO[1];
            }}
            className="absolute right-[4%] rounded-sm border-2 border-white/80 bg-black/50 px-6 py-3 text-lg font-semibold hover:bg-white hover:text-black"
            style={{ bottom: showHud ? '20%' : '10%' }}
          >
            ข้ามอินโทร
          </motion.button>
        )}
      </AnimatePresence>

      {/* Next episode countdown */}
      <AnimatePresence>
        {showNext && next && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-[4%] flex items-center gap-3"
            style={{ bottom: showHud ? '20%' : '8%' }}
          >
            <button onClick={() => setCreditsDismissed(true)} className="rounded-sm bg-black/50 px-5 py-3 font-semibold ring-1 ring-white/60 hover:bg-white/20">
              ดูเครดิต
            </button>
            <button onClick={goNext} className="relative overflow-hidden rounded-sm bg-white px-5 py-3 font-semibold text-black">
              <motion.span className="absolute inset-y-0 left-0 bg-[#b3b3b3]" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: Math.max(1, nextIn), ease: 'linear' }} />
              <span className="relative flex items-center gap-2">
                <NextEp size={18} /> ตอนถัดไปใน {nextIn}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      <motion.div className="pointer-events-none absolute inset-0" animate={{ opacity: showHud ? 1 : 0 }} transition={{ duration: 0.3 }}>
        <div className="pointer-events-auto absolute inset-x-0 top-0 flex h-24 items-start bg-gradient-to-b from-black/70 to-transparent p-5" onClick={(e) => e.stopPropagation()}>
          <button aria-label="ย้อนกลับ" onClick={back} className="transition-transform hover:scale-125">
            <Back size={36} />
          </button>
        </div>

        <div className="pointer-events-auto absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-[2.5%] pb-4 pt-16" onClick={(e) => e.stopPropagation()}>
          {/* scrubber */}
          <div className="flex items-center gap-4">
            <div
              ref={bar}
              role="slider"
              tabIndex={0}
              aria-label="ตำแหน่งการเล่น"
              aria-valuemin={0}
              aria-valuemax={Math.round(dur)}
              aria-valuenow={Math.round(cur)}
              className="group relative flex h-6 flex-1 cursor-pointer items-center"
              onPointerDown={(e) => {
                setScrubbing(true);
                e.currentTarget.setPointerCapture(e.pointerId);
                seekTo(e.clientX);
              }}
              onPointerMove={(e) => {
                const f = frac(e.clientX);
                setHoverX(f);
                if (pv.current && dur) pv.current.currentTime = f * dur;
                if (scrubbing) seekTo(e.clientX);
              }}
              onPointerUp={() => setScrubbing(false)}
              onPointerLeave={() => !scrubbing && setHoverX(null)}
            >
              <div className="relative h-[3px] w-full bg-[#ffffff33] transition-[height] group-hover:h-[6px]">
                <div className="absolute inset-y-0 left-0 bg-[#ffffff59]" style={{ width: `${dur ? (buffered / dur) * 100 : 0}%` }} />
                <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${dur ? (cur / dur) * 100 : 0}%` }} />
                <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent transition-transform group-hover:scale-125" style={{ left: `${dur ? (cur / dur) * 100 : 0}%` }} />
              </div>
              <div
                className={`pointer-events-none absolute bottom-7 -translate-x-1/2 transition-opacity ${hoverX !== null ? 'opacity-100' : 'opacity-0'}`}
                style={{ left: `clamp(110px, ${(hoverX ?? 0) * 100}%, calc(100% - 110px))` }}
              >
                <video ref={pv} src={src} muted preload="auto" playsInline className="w-[220px] rounded-sm border-2 border-white bg-black" />
                <p className="mt-1 text-center text-sm font-semibold [text-shadow:0_0_4px_#000]">{fmtTime(hoverTime)}</p>
              </div>
            </div>
            <span className="w-16 text-right text-sm tabular-nums">{fmtTime(Math.max(0, dur - cur))}</span>
          </div>

          {/* controls */}
          <div className="mt-2 flex items-center gap-[clamp(10px,2vw,32px)]">
            <button aria-label={playing ? 'หยุดชั่วคราว' : 'เล่น'} onClick={toggle} className="transition-transform hover:scale-125">
              {playing ? <Pause size={36} /> : <Play size={36} />}
            </button>
            <button aria-label="ย้อนกลับ 10 วินาที" onClick={() => skip(-1)} className="transition-transform hover:scale-125">
              <motion.span key={spin?.dir === -1 ? spin.k : 'b'} className="block" initial={{ rotate: 0 }} animate={{ rotate: spin?.dir === -1 ? -360 : 0 }} transition={{ duration: 0.4 }}>
                <Back10 size={34} />
              </motion.span>
            </button>
            <button aria-label="ข้ามไป 10 วินาที" onClick={() => skip(1)} className="transition-transform hover:scale-125">
              <motion.span key={spin?.dir === 1 ? spin.k : 'f'} className="block" initial={{ rotate: 0 }} animate={{ rotate: spin?.dir === 1 ? 360 : 0 }} transition={{ duration: 0.4 }}>
                <Fwd10 size={34} />
              </motion.span>
            </button>
            <div className="relative flex items-center" onMouseEnter={() => setPanel('vol')} onMouseLeave={() => setPanel((p) => (p === 'vol' ? null : p))}>
              <button aria-label={settings.muted ? 'เปิดเสียง' : 'ปิดเสียง'} onClick={() => setSettings({ muted: !settings.muted })} className="transition-transform hover:scale-125">
                {settings.muted || settings.volume === 0 ? <VolumeOff size={34} /> : <VolumeOn size={34} />}
              </button>
              <Pop open={panel === 'vol'} className="left-1/2 right-auto -translate-x-1/2 px-3 py-5">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.muted ? 0 : settings.volume}
                  onChange={(e) => setSettings({ volume: Number(e.target.value), muted: Number(e.target.value) === 0 })}
                  aria-label="ระดับเสียง"
                  className="nf-range h-28 w-2 [writing-mode:vertical-lr] [direction:rtl]"
                />
              </Pop>
            </div>

            <p className="mx-auto min-w-0 truncate text-center text-[clamp(13px,1.3vw,20px)]">
              <span className="font-semibold">{heading}</span>
              {ep && !trailer && (
                <span className="ml-3 text-[#e5e5e5]">
                  ซ.{ep.season}:ต.{ep.number} <span className="max-md:hidden">{ep.title.replace(/^ตอนที่ \d+: /, '')}</span>
                </span>
              )}
            </p>

            {next && !trailer && (
              <button aria-label="ตอนถัดไป" onClick={goNext} className="transition-transform hover:scale-125">
                <NextEp size={32} />
              </button>
            )}
            {t.kind === 'series' && !trailer && (
              <div className="relative">
                <button aria-label="ตอน" aria-expanded={panel === 'eps'} onClick={() => setPanel((p) => (p === 'eps' ? null : 'eps'))} className="transition-transform hover:scale-125">
                  <Episodes size={34} />
                </button>
                <Pop open={panel === 'eps'} className="max-h-[60vh] w-[min(520px,90vw)] overflow-y-auto">
                  <div className="sticky top-0 flex items-center gap-2 bg-[#262626] px-5 py-4">
                    {t.seasons.length > 1 ? (
                      t.seasons.map((s) => (
                        <button key={s.number} onClick={() => setDrawerSeason(s.number)} className={`rounded-sm px-3 py-1 text-lg ${drawerSeason === s.number ? 'bg-white text-black' : 'text-[#bbb] hover:text-white'}`}>
                          ซีซั่น {s.number}
                        </button>
                      ))
                    ) : (
                      <span className="text-xl font-semibold">ซีซั่น 1</span>
                    )}
                    <button aria-label="ปิด" onClick={() => setPanel(null)} className="ml-auto">
                      <Close size={18} />
                    </button>
                  </div>
                  <ul>
                    {t.seasons
                      .find((s) => s.number === drawerSeason)
                      ?.episodes.map((e) => {
                        const p = useStore.getState().data[useStore.getState().activeId ?? '']?.episodes[e.id];
                        const isCur = e.id === ep?.id;
                        return (
                          <li key={e.id}>
                            <button
                              onClick={() => (setPanel(null), nav(`/watch/${id}?ep=${e.id}`, { replace: true }))}
                              className={`flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-[#333] ${isCur ? 'bg-[#333]' : ''}`}
                            >
                              <span className="w-5 text-lg text-[#bbb]">{e.number}</span>
                              <span className="relative w-28 shrink-0">
                                <img src={e.still} alt="" className="aspect-video w-full rounded-sm object-cover" />
                                {p && (
                                  <span className="absolute inset-x-1 bottom-1 h-[3px] bg-[#5a5a5a]">
                                    <span className="block h-full bg-accent" style={{ width: `${(p.t / Math.max(1, p.d)) * 100}%` }} />
                                  </span>
                                )}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-medium">{e.title}</span>
                                <span className="line-clamp-2 text-sm text-[#bbb]">{e.synopsis}</span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </Pop>
              </div>
            )}
            <div className="relative">
              <button aria-label="เสียงและคำบรรยาย" aria-expanded={panel === 'subs'} onClick={() => setPanel((p) => (p === 'subs' ? null : 'subs'))} className="transition-transform hover:scale-125">
                <Subtitles size={34} />
              </button>
              <Pop open={panel === 'subs'} className="flex w-[min(420px,90vw)] gap-8 p-6">
                {(
                  [
                    ['เสียง', AUDIO, 'audio'],
                    ['คำบรรยาย', SUBS, 'subtitles'],
                  ] as const
                ).map(([label, opts, key]) => (
                  <div key={key} className="flex-1">
                    <p className="mb-3 text-xl font-semibold">{label}</p>
                    {opts.map((o) => (
                      <button key={o} onClick={() => setSettings({ [key]: o })} className={`flex w-full items-center gap-2 py-1.5 text-left ${settings[key] === o ? 'text-white' : 'text-[#999] hover:text-white'}`}>
                        <span className="w-4">{settings[key] === o ? '✓' : ''}</span>
                        {o}
                      </button>
                    ))}
                  </div>
                ))}
              </Pop>
            </div>
            <div className="relative">
              <button aria-label="ความเร็วในการเล่น" aria-expanded={panel === 'speed'} onClick={() => setPanel((p) => (p === 'speed' ? null : 'speed'))} className="transition-transform hover:scale-125">
                <Speed size={34} />
              </button>
              <Pop open={panel === 'speed'} className="w-[min(480px,90vw)] p-6">
                <p className="text-xl font-semibold">ความเร็วในการเล่น</p>
                <div className="relative mt-6 flex justify-between">
                  <div className="absolute inset-x-4 top-[9px] h-[2px] bg-[#555]" />
                  {SPEEDS.map((s) => (
                    <button key={s} onClick={() => setSettings({ speed: s })} className="relative flex flex-col items-center gap-3 text-sm">
                      <span className={`h-5 w-5 rounded-full border-2 transition-transform ${settings.speed === s ? 'scale-125 border-white bg-white' : 'border-[#999] bg-[#262626]'}`} />
                      <span className={settings.speed === s ? 'text-white' : 'text-[#999]'}>{s === 1 ? '1x (ปกติ)' : `${s}x`}</span>
                    </button>
                  ))}
                </div>
              </Pop>
            </div>
            <button aria-label="เต็มจอ" onClick={fullscreen} className="transition-transform hover:scale-125">
              <Fullscreen size={34} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
