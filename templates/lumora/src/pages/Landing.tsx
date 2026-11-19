import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { brand } from '../brand.config';
import { TITLES, type Title } from '../data/catalog';
import { Logo } from '../components/Logo';
import { LangSelect } from '../components/LangSelect';
import { PosterWall } from '../components/PosterWall';
import { LandingFooter } from '../components/PublicFooter';
import { ChevronLeft, ChevronRight, Close, Plus } from '../components/Icons';

function EmailForm({ id, align }: { id: string; align: 'hero' | 'bottom' }) {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [focus, setFocus] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    nav(`/th/login${email ? `?email=${encodeURIComponent(email)}` : ''}`);
  };
  const floated = focus || email.length > 0;
  return (
    <form onSubmit={submit} aria-label="เริ่มต้นเป็นสมาชิก" className={`flex w-full flex-col ${align === 'hero' ? 'max-w-hero' : 'max-w-form'}`}>
      <h3 className="text-left text-base leading-6 sm:text-center">
        หากพร้อมรับชม ป้อนอีเมลเพื่อสร้างหรือเริ่มต้นการเป็นสมาชิกอีกครั้ง
      </h3>
      <div className={`mt-4 flex flex-col gap-4 sm:flex-row sm:gap-2 ${align === 'hero' ? 'items-center' : 'items-start'}`}>
        <div className="relative h-14 w-full flex-1">
          <label
            htmlFor={id}
            className={`pointer-events-none absolute left-4 text-dim transition-all duration-200 ${floated ? 'top-1.5 text-xs' : 'top-1/2 -translate-y-1/2 text-base'}`}
          >
            ที่อยู่อีเมล
          </label>
          <input
            id={id}
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            className="h-full w-full rounded-sm border border-[#808080b3] bg-field px-4 pt-3 text-base text-white outline-none focus:outline-2 focus:outline-offset-2 focus:outline-white"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-3 rounded-sm bg-accent px-5 text-lg2 font-medium transition-colors hover:bg-accent-hover sm:h-14 sm:w-[220px] sm:px-6 sm:text-2xl2"
        >
          เริ่มต้นใช้งาน
          <ChevronRight size={24} className="max-sm:h-5 max-sm:w-5" />
        </button>
      </div>
    </form>
  );
}

function Curve() {
  return (
    <div className="pointer-events-none absolute -left-[15%] bottom-0 h-[50px] w-[130%] md:h-[80px]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
          background: 'linear-gradient(to right, rgba(33,13,22,1) 16%, rgba(184,40,105,1), rgba(229,9,20,1), rgba(184,40,105,1), rgba(33,13,22,1) 84%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 top-1"
        style={{
          borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
          background: 'radial-gradient(50% 500% at 50% -420%, rgba(64,97,231,.4) 80%, rgba(0,0,0,.1) 100%), #000',
        }}
      />
    </div>
  );
}

const RANK_STYLE = {
  color: '#fff',
  WebkitTextStroke: '3px #414141',
  paintOrder: 'stroke fill',
  textShadow: '0 0 1.5rem rgba(0,0,0,.5)',
} as const;

function Trending({ onOpen }: { onOpen: (t: Title) => void }) {
  const ref = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const items = TITLES.slice(0, 10);
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };
  useEffect(update, []);
  const page = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' });
  return (
    <div className="gutter mx-auto mt-6 max-w-[1920px]">
      <h2 className="text-lg2 font-medium leading-6 md:text-2xl2 md:leading-[34px]">กำลังฮิต</h2>
      <div className="relative mt-4">
        <ul ref={ref} onScroll={update} className="no-scrollbar flex gap-[22px] overflow-x-auto scroll-smooth py-2 md:gap-[44px]" style={{ scrollSnapType: 'x mandatory' }}>
          {items.map((t, i) => (
            <li key={t.id} className="relative shrink-0 pl-[22px]" style={{ scrollSnapAlign: 'start' }}>
              <button
                onClick={() => onOpen(t)}
                className="group relative block h-[154px] w-[110px] rounded-md bg-card transition-transform duration-200 hover:scale-105 md:h-[252px] md:w-[180px]"
                aria-label={`${t.title} อันดับ ${i + 1}`}
              >
                <img src={t.poster} alt="" className="h-full w-full rounded-md object-cover" />
                <span
                  className="absolute bottom-0 -left-[22px] font-bold leading-none"
                  style={{ ...RANK_STYLE, fontSize: 'clamp(64px, 7vw, 100px)' }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {!atStart && (
          <button onClick={() => page(-1)} aria-label="ก่อนหน้า" className="absolute -left-1 top-1/2 flex h-[120px] w-6 -translate-y-1/2 items-center justify-center rounded-md bg-[#ffffff1a] text-dim hover:bg-[#ffffff33] hover:text-white">
            <ChevronLeft size={24} />
          </button>
        )}
        {!atEnd && (
          <button onClick={() => page(1)} aria-label="ถัดไป" className="absolute right-0 top-1/2 flex h-[120px] w-6 -translate-y-1/2 items-center justify-center rounded-md bg-[#ffffff1a] text-dim hover:bg-[#ffffff33] hover:text-white">
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
}

const FEATURES: { title: string; body: string; icon: ReactElement }[] = [
  {
    title: 'รับชมได้ในทีวี',
    body: 'ใช้ได้กับสมาร์ททีวี เครื่อง PlayStation และ Xbox กล่อง Chromecast หรือ Apple TV เครื่องเล่น Blu-ray และอุปกรณ์อีกมากมาย',
    icon: (
      <svg viewBox="0 0 72 72" width="72" height="72" aria-hidden="true">
        <defs>
          <linearGradient id="tvg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff3d8b" />
            <stop offset=".5" stopColor="#8b2cf5" />
            <stop offset="1" stopColor="#1d0b3a" />
          </linearGradient>
        </defs>
        <rect x="8" y="16" width="56" height="34" rx="2" fill="url(#tvg)" stroke="#d9d9d9" strokeWidth="2" />
        <rect x="30" y="50" width="12" height="5" fill="#9b9b9b" />
        <rect x="20" y="55" width="32" height="3" rx="1.5" fill="#d33" />
      </svg>
    ),
  },
  {
    title: 'ดาวน์โหลดเนื้อหาไว้รับชมออฟไลน์',
    body: 'เก็บเรื่องโปรดไว้ในเครื่อง แล้วดูต่อได้แม้ไม่มีสัญญาณ',
    icon: (
      <svg viewBox="0 0 72 72" width="72" height="72" aria-hidden="true">
        <defs>
          <radialGradient id="dlg" cx=".35" cy=".3" r=".8">
            <stop offset="0" stopColor="#ffd1ec" />
            <stop offset=".6" stopColor="#f070c8" />
            <stop offset="1" stopColor="#b51fa0" />
          </radialGradient>
        </defs>
        <circle cx="36" cy="36" r="28" fill="url(#dlg)" stroke="#ff9ad5" strokeWidth="3" />
        <path d="M36 22v24M26 37l10 10 10-10" stroke="#7a0f5c" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'รับชมได้ทุกที่',
    body: 'สตรีมไม่จำกัดบนมือถือ แท็บเล็ต แล็ปท็อป และทีวี',
    icon: (
      <svg viewBox="0 0 72 72" width="72" height="72" aria-hidden="true">
        <path d="M14 58l30-30 10 10-30 30z" fill="#e50914" transform="rotate(-10 36 36)" />
        <circle cx="50" cy="26" r="11" fill="#ffb3d1" stroke="#ff5aa5" strokeWidth="3" />
        <path d="M12 18l2 4 4 1-4 2-2 4-1-4-4-2 4-1z" fill="#ff3d6e" />
        <path d="M58 54l1.5 3 3 1-3 1.5-1.5 3-1-3-3-1.5 3-1z" fill="#ff3d6e" />
      </svg>
    ),
  },
  {
    title: 'สร้างโปรไฟล์สำหรับเด็ก',
    body: 'พื้นที่ปลอดภัยสำหรับลูกหลาน พร้อมการ์ตูนและรายการสนุกๆ รวมอยู่ในแพ็กเกจ',
    icon: (
      <svg viewBox="0 0 72 72" width="72" height="72" aria-hidden="true">
        <rect x="8" y="12" width="32" height="32" rx="6" fill="#ffc2dc" />
        <circle cx="18" cy="24" r="3" fill="#a3164f" />
        <circle cx="30" cy="24" r="3" fill="#a3164f" />
        <rect x="28" y="28" width="34" height="32" rx="6" fill="#e50914" />
        <path d="M38 44q7 7 14 0" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="36" y="36" width="3" height="5" fill="#fff" />
        <rect x="51" y="36" width="3" height="5" fill="#fff" />
      </svg>
    ),
  },
];

function Features() {
  return (
    <div className="gutter mx-auto mt-14 max-w-[1920px] md:mt-16">
      <h2 className="text-lg2 font-medium leading-6 md:text-2xl2 md:leading-[34px]">ข้อดีเพิ่มเติมในการสมัครเป็นสมาชิก</h2>
      <div className="mt-0.5 grid grid-cols-1 gap-4 sm:gap-2.5 md:mt-6 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="relative flex min-h-[180px] flex-col rounded-lg p-4 pb-24 md:min-h-[197px] lg:min-h-[296px]"
            style={{ background: 'linear-gradient(149deg, #192247 0%, #210e17 96.86%)' }}
          >
            <h3 className="text-xl2 font-medium leading-[34px] md:text-2xl2">{f.title}</h3>
            <p className="mt-1 text-base leading-[23px] text-dim lg:mt-4">{f.body}</p>
            <div className="absolute bottom-4 right-4">{f.icon}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const FAQ: [string, string[]][] = [
  [
    `${brand.name} คืออะไร`,
    [
      `${brand.name} คือบริการสตรีมมิ่งที่รวมซีรีส์ ภาพยนตร์ สารคดี และแอนิเมชันไว้ในที่เดียว ดูได้บนอุปกรณ์ที่ต่ออินเทอร์เน็ตแทบทุกชนิด`,
      'จ่ายรายเดือนในราคาเดียว ไม่มีโฆษณาคั่น และมีเรื่องใหม่ให้ดูทุกสัปดาห์',
    ],
  ],
  [`ค่าใช้จ่ายในการใช้บริการ ${brand.name}`, [`เริ่มต้นที่ ${brand.priceFrom} ต่อเดือน มีหลายแพ็กเกจให้เลือกตามจำนวนจอและความคมชัด ไม่มีค่าธรรมเนียมแอบแฝงและไม่มีสัญญาผูกมัด`]],
  ['รับชมได้จากที่ไหนบ้าง', ['ดูได้ทุกที่ ทุกเวลา ผ่านเว็บเบราว์เซอร์ หรือแอปบนสมาร์ททีวี มือถือ แท็บเล็ต กล่อง Apple TV, Google Chromecast, เครื่อง PlayStation และเครื่องเล่น Blu-ray', 'ดาวน์โหลดเรื่องโปรดไว้ดูออฟไลน์ได้ในแอปมือถือและแท็บเล็ต']],
  ['วิธียกเลิก', ['ยกเลิกออนไลน์ได้ในไม่กี่คลิกจากหน้าบัญชี ไม่มีค่าปรับ และใช้งานต่อได้จนจบรอบบิลปัจจุบัน']],
  [`ความบันเทิงที่รับชมได้ทาง ${brand.name}`, ['คลังความบันเทิงหลากหลาย ทั้งภาพยนตร์ ซีรีส์ สารคดี รายการเด็ก และผลงานออริจินัลที่หาดูที่อื่นไม่ได้']],
  [`${brand.name} เหมาะสำหรับเด็กไหม`, ['โปรไฟล์สำหรับเด็กมีรายการที่เหมาะกับวัย และผู้ปกครองตั้งระดับความเหมาะสมหรือบล็อกบางเรื่องได้ด้วย PIN']],
];

function Faq() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div id="faq" className="gutter mx-auto mt-16 max-w-[1920px]">
      <h2 className="text-lg2 font-medium leading-6 md:text-2xl2 md:leading-[34px]">คำถามที่พบบ่อย</h2>
      <ul className="mt-4 md:mt-4">
        {FAQ.map(([q, a], i) => {
          const isOpen = open === i;
          return (
            <li key={q} className="mb-2">
              <h3 className="bg-faq text-lg2 transition-colors hover:bg-faq-hover md:text-2xl2">
                <button
                  id={`faq-btn-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex min-h-[72px] w-full items-center justify-between p-5 text-left md:min-h-[84px] md:p-6"
                >
                  <span>{q}</span>
                  <span className="ml-4 shrink-0 transition-transform duration-200">{isOpen ? <Close size={36} className="max-md:h-6 max-md:w-6" /> : <Plus size={36} className="max-md:h-6 max-md:w-6" />}</span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-btn-${i}`}
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden bg-faq"
                  >
                    <div className="border-t border-black p-5 text-lg2 leading-[1.4] md:p-6 md:text-2xl2">
                      {a.map((p, k) => (
                        <p key={k} className={k ? 'mt-6' : ''}>
                          {p}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PreviewModal({ t, onClose }: { t: Title; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        className="relative w-full max-w-[734px] overflow-hidden rounded-md bg-[#161616] shadow-2xl"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-video">
          <img src={t.backdrop} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-transparent to-transparent" />
          <h2 className="absolute bottom-6 left-8 font-display text-5xl">{t.title}</h2>
          <button onClick={onClose} aria-label="ปิด" className="absolute right-4 top-4 rounded-full bg-black/60 p-2">
            <Close size={20} />
          </button>
        </div>
        <div className="p-8 pt-2">
          <div className="flex flex-wrap gap-2 text-sm text-dim">
            {[t.year, t.maturity, t.kind === 'movie' ? 'ภาพยนตร์' : 'ซีรีส์', ...t.genres].map((x) => (
              <span key={String(x)} className="rounded-sm bg-[#414141] px-2 py-0.5">
                {x}
              </span>
            ))}
          </div>
          <p className="mt-4 text-base">{t.synopsis}</p>
          <Link to="/th/login" className="mt-6 inline-flex h-12 items-center gap-2 rounded-sm bg-accent px-6 text-xl2 font-medium hover:bg-accent-hover">
            เริ่มต้นใช้งาน <ChevronRight size={20} />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Landing() {
  const [preview, setPreview] = useState<Title | null>(null);
  return (
    <div className="min-h-screen bg-page">
      <div className="relative h-[600px] overflow-hidden sm:h-[606px] md:h-[720px] lg:h-[832px]">
        <PosterWall dim={0.45} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,.3) 45%, rgba(0,0,0,.6) 85%, #000 100%)' }} />
        <div className="gutter relative z-10 mx-auto max-w-[1920px]">
          <header className="flex h-20 items-center justify-between md:h-[88px]">
            <Logo height={24} className="md:hidden" />
            <Logo height={40} className="max-md:hidden" />
            <div className="flex items-center gap-3">
              <LangSelect compact />
              <Link to="/th/login" className="inline-flex h-8 items-center rounded-sm bg-accent px-3 text-sm font-medium hover:bg-accent-hover md:px-4">
                เข้าสู่ระบบ
              </Link>
            </div>
          </header>
        </div>
        <div className="gutter relative z-10 mx-auto flex max-w-[1920px] flex-col items-start pt-[45px] text-left sm:items-center sm:text-center sm:pt-[83px] md:pt-[100px] lg:pt-[133px]">
          <div className="flex w-full max-w-[456px] flex-col items-start sm:items-center md:max-w-hero">
            <h1 className="text-[32px] font-bold leading-[1.25] md:text-[48px] lg:text-hero">ภาพยนตร์ รายการทีวี และความบันเทิงอีกมากมายแบบไม่จำกัด</h1>
            <p className="mt-4 text-base font-medium md:text-xl2">ราคาเริ่มต้นที่ {brand.priceFrom} ยกเลิกได้ทุกเมื่อ</p>
            <div className="mt-6 w-full md:mt-8">
              <EmailForm id="email-hero" align="hero" />
            </div>
          </div>
        </div>
        <Curve />
      </div>
      <Trending onOpen={setPreview} />
      <Features />
      <Faq />
      <div className="gutter mx-auto mt-16 flex max-w-[1920px] justify-center">
        <EmailForm id="email-bottom" align="bottom" />
      </div>
      <div className="mt-12">
        <LandingFooter />
      </div>
      <AnimatePresence>{preview && <PreviewModal t={preview} onClose={() => setPreview(null)} />}</AnimatePresence>
    </div>
  );
}
