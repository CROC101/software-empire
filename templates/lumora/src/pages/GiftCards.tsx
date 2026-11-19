import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { brand } from '../brand.config';
import { Logo } from '../components/Logo';
import { PosterWall } from '../components/PosterWall';
import { GiftFooter } from '../components/PublicFooter';

/** The brand's own gift card, drawn in CSS. */
function Card({ w, rot = 0, hanger = true, className = '' }: { w: number; rot?: number; hanger?: boolean; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-white shadow-[0_20px_60px_rgba(0,0,0,.6)] ${className}`} style={{ width: w, height: w * 1.55, transform: `rotate(${rot}deg)` }}>
      {hanger && <div className="absolute left-1/2 top-[6%] h-[4%] w-[22%] -translate-x-1/2 rounded-full bg-[#222]" />}
      <div className="absolute inset-x-0 top-[17%] text-center font-display text-accent" style={{ fontSize: w * 0.24 }}>
        {brand.wordmark}
      </div>
      <div className="absolute inset-x-[12%] bottom-0 top-[40%] bg-gradient-to-br from-accent via-[#b00710] to-[#5a0005]" style={{ clipPath: 'polygon(0 0,34% 0,100% 100%,0 100%)' }} />
      <div className="absolute inset-x-[12%] bottom-0 top-[40%] bg-gradient-to-b from-accent to-[#8d050c]" style={{ clipPath: 'polygon(66% 0,100% 0,100% 100%,66% 100%)' }} />
    </div>
  );
}

const STORES = ['Store One', 'Corner Mart', 'Big Market', 'Daily Shop', 'Mega Mall', 'City Books'];

export default function GiftCards() {
  const [more, setMore] = useState(false);
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-black">
      <div className="relative h-[620px] overflow-hidden" aria-hidden="true">
        <PosterWall dim={0.5} bg />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black" />
      </div>
      <div className="absolute inset-x-0 top-0 z-10 flex h-[90px] items-start justify-between px-[3%] md:px-[43px]">
        <Logo height={35} className="mt-[29px]" />
        <Link to="/redeem" className="mt-[18px] inline-flex h-[34px] items-center rounded-[3px] bg-accent px-4 text-base font-normal hover:bg-accent-hover">
          Redeem your gift card
        </Link>
      </div>
      <div className="absolute inset-x-0 top-[70px] z-10 flex justify-center">
        <Card w={180} rot={28} className="max-sm:scale-75" />
      </div>
      <section aria-labelledby="gift-h1" className="relative z-10 mx-[5px] -mt-[170px] text-center">
        <h1 id="gift-h1" className="mx-auto max-w-[960px] px-1 text-[38px] font-medium leading-[1.15] md:px-5 sm:text-[63px]">Access unlimited {brand.name} with one card.</h1>
        <p className="mt-2.5 min-h-[50px] px-1 text-sm leading-5 md:px-5 sm:text-base">Pay for your membership or give one to someone special.</p>
        <button onClick={() => setMore(false)} className="mt-2.5 h-9 px-2 text-base font-medium">
          Buy in store
        </button>

      <section className="relative z-20 mx-auto mt-[60px] max-w-[960px] sm:mt-[84px] bg-[#1a1a1a] px-[10px] py-[100px] text-left sm:px-[25px]">
        <div className="-mt-[157px] mx-auto grid grid-cols-3 gap-3.5 md:max-w-[646px]">
          {(more ? STORES : STORES.slice(0, 3)).map((s, i) => (
            <a key={s} href="#stores" className="flex aspect-[206/210] items-center justify-center bg-[#202020]">
              <span
                className="inline-flex h-16 min-w-[80px] items-center justify-center rounded-md px-3 text-sm font-bold"
                style={{ background: ['#0b6b3a', '#1460aa', '#c8102e', '#f2a900', '#5b2a86', '#00838f'][i], color: '#fff' }}
              >
                {s}
              </span>
            </a>
          ))}
        </div>
        <div className="mt-[21px] text-center">
          <button onClick={() => setMore((m) => !m)} className="text-xl2 leading-[27px]">
            {more ? 'See less' : 'See more'}
          </button>
        </div>
        <h2 className="mt-[94px] pb-6 text-center text-[27px] font-medium sm:text-[45px]">How does it work?</h2>
        <div className="mt-[9px] grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-10">
          {[
            ['It’s easy.', 'Add it to an existing account or start a fresh one. Keep it or pass it on.', 'check'],
            ['Works like cash.', 'Card value becomes account balance. We’ll remind you before it runs out.', 'cards'],
            ['Need more help?', 'Having trouble with your card? Our Help Center has answers to every gift card question.', 'help'],
          ].map(([h, p, icon]) => (
            <div key={h} className="text-center">
              <svg className="mx-auto" width="55" height="55" viewBox="0 0 48 48" fill="none" stroke="#e50914" strokeWidth="2.2" aria-hidden="true">
                {icon === 'check' && (
                  <>
                    <circle cx="22" cy="26" r="16" />
                    <path d="M14 25l7 7 19-21" />
                  </>
                )}
                {icon === 'cards' && (
                  <>
                    <rect x="6" y="14" width="30" height="22" />
                    <path d="M10 10h30v22M24 20v10M19 25h10" />
                  </>
                )}
                {icon === 'help' && (
                  <>
                    <circle cx="24" cy="24" r="17" />
                    <path d="M19 19a5 5 0 119 3c-2 2-4 3-4 6M24 33v1" />
                  </>
                )}
              </svg>
              <h3 className="mt-[18px] text-[18.72px] leading-6 text-accent">{h}</h3>
              <p className="mt-4 text-base leading-5">{p}</p>
            </div>
          ))}
        </div>
        <h2 className="mt-[130px] pb-6 text-center text-[27px] font-medium sm:text-[45px]">Redeem Your Gift Card</h2>
        <div className="mt-2.5 text-center">
          <button type="button" onClick={() => nav('/redeem')} className="inline-flex h-12 w-full items-center sm:w-[120px] justify-center rounded-xs bg-accent text-base font-medium hover:bg-accent-hover">
            I’m Ready
          </button>
        </div>
        <div className="relative mx-auto mt-8 flex h-[200px] origin-bottom max-sm:scale-[0.6] sm:h-[260px] md:h-[321px] max-w-[700px] items-end justify-center">
          <Card w={135} className="z-10" />
          <div className="-ml-2 mb-0 h-[125px] w-[155px] overflow-hidden rounded-md bg-gradient-to-r from-[#b00710] via-[#e50914] to-white shadow-xl">
            <div className="mt-[90px] pr-3 text-right font-display text-2xl text-accent">{brand.wordmark}</div>
          </div>
          <div className="absolute inset-x-0 bottom-[-10px] h-px bg-gradient-to-r from-transparent via-[#5ac8fa] to-transparent" />
        </div>
      </section>
      </section>
      <div className="mt-[110px]">
        <GiftFooter topLine />
      </div>
    </div>
  );
}
