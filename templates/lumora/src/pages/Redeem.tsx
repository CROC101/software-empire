import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { PosterWall } from '../components/PosterWall';
import { GiftFooter } from '../components/PublicFooter';

export default function Redeem() {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const nav = useNavigate();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setMsg(/^[A-Z0-9-]{8,}$/i.test(code.trim()) ? 'Code accepted. Sign in to apply it to your account.' : 'That code doesn’t look right. Please check and try again.');
  };
  return (
    <div className="min-h-screen bg-black">
      <div className="relative overflow-hidden bg-[#0c0c0c] pb-[70px] sm:pb-[57px] md:min-h-[900px] md:bg-transparent md:pb-0">
        {/* Below 960px the picture only fills the top and fades into the panel, like the original. */}
        <PosterWall dim={0.55} zoom className="max-md:bottom-auto max-md:h-[clamp(400px,72vw,560px)]" />
        <div className="absolute inset-x-0 top-0 h-[clamp(400px,72vw,560px)] bg-gradient-to-b from-transparent from-50% to-[#0c0c0c] md:hidden" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent max-md:hidden" />
        <div className="relative z-10 flex h-[90px] items-start justify-between px-[3%] md:px-[43px]">
          <Logo height={35} to="/th/" className="mt-[12px] sm:mt-[29px]" />
          <Link to="/th/login" className="mt-[10px] sm:mt-[18px] inline-flex h-[34px] items-center rounded-[3px] bg-accent px-4 text-base font-normal hover:bg-accent-hover">
            Sign In
          </Link>
        </div>
        <form onSubmit={submit} className="relative z-10 mx-[3%] mt-[188px] max-w-[855px] text-center sm:mt-[295px] md:mx-[43px] md:mt-[97px] md:text-left">
          <h1 className="text-[27px] font-medium leading-[1.1] sm:text-[49px] md:text-[51.84px]">Redeem your gift</h1>
          <h3 className="mt-5 text-base leading-[1.27] sm:text-[25px] md:text-[25.92px]">Enter your code below to get started.</h3>
          <ul className="mx-auto mt-2.5 w-full max-w-[304px] md:mx-0">
            <li className="pb-[5px]">
              <input
                aria-label="Code or Pin"
                placeholder="Code or Pin"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-12 w-full border border-[#8c8c8c] bg-[#000000cc] px-2.5 text-[23px] text-white placeholder:text-[18px] placeholder:text-[#8c8c8c] outline-none focus:border-white"
              />
            </li>
          </ul>
          {msg && <p className="mt-2 text-sm text-[#e87c03]">{msg}</p>}
          <button type="submit" className="mt-2.5 h-12 w-full rounded-xs sm:w-[157px] bg-accent text-xl2 hover:bg-accent-hover">
            Redeem
          </button>
          <div>
            <button type="button" onClick={() => nav('/gift-cards')} className="mt-5 inline-flex h-12 w-full sm:w-[214px] items-center justify-center rounded-xs bg-[#3a3a3a] text-xl2 hover:bg-[#4a4a4a]">
              Buy Gift Cards
            </button>
          </div>
          <a href="#help" className="mx-auto mt-[26px] sm:mt-[46px] block w-fit md:mx-0 text-base font-normal leading-5 text-[#a6a6a6] hover:underline">
            Need help with gift cards?
          </a>
          <p className="mx-auto mt-[21px] max-w-[364px] text-left text-sm md:mx-0 leading-[18px] text-[#8c8c8c]">This page is protected by automated bot checks to keep your account safe.</p>
        </form>
      </div>
      <div className="mt-[100px] md:mt-0">
        <GiftFooter />
      </div>
    </div>
  );
}
