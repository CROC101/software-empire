import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from '../components/Logo';
import { LoginFooter } from '../components/PublicFooter';
import { ChevronDown } from '../components/Icons';
import { useStore } from '../store';

const COPY = {
  th: {
    h1: 'กรอกข้อมูลเพื่อเข้าสู่ระบบ',
    h2: 'หรือเริ่มต้นโดยใช้บัญชีใหม่',
    email: 'อีเมลหรือหมายเลขโทรศัพท์มือถือ',
    pw: 'รหัสผ่าน',
    pwTitle: 'ป้อนรหัสผ่านของคุณ',
    cont: 'ดำเนินการต่อ',
    signIn: 'เข้าสู่ระบบ',
    help: 'ขอความช่วยเหลือ',
    helpItems: ['ลืมอีเมลหรือหมายเลขโทรศัพท์', 'ลืมรหัสผ่าน', 'ความช่วยเหลืออื่นๆ'],
    bot: 'หน้านี้มีระบบป้องกันบ็อตอัตโนมัติ เพื่อความปลอดภัยของบัญชีคุณ',
    err: 'โปรดป้อนอีเมลหรือหมายเลขโทรศัพท์ที่ถูกต้อง',
    pwErr: 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร',
    change: 'เปลี่ยน',
  },
  en: {
    h1: 'Enter your info to sign in',
    h2: 'Or get started with a new account.',
    email: 'Email or mobile number',
    pw: 'Password',
    pwTitle: 'Enter your password',
    cont: 'Continue',
    signIn: 'Sign In',
    help: 'Get Help',
    helpItems: ['Forgot email or phone number?', 'Forgot password?', 'Learn more about sign-in'],
    bot: 'This page is protected by automated bot checks to keep your account safe.',
    err: 'Please enter a valid email or mobile number.',
    pwErr: 'Your password must contain at least 4 characters.',
    change: 'Change',
  },
};

export default function Login({ lang = 'th' }: { lang?: 'th' | 'en' }) {
  const c = COPY[lang];
  const nav = useNavigate();
  const [params] = useSearchParams();
  const signIn = useStore((s) => s.signIn);
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [pw, setPw] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [err, setErr] = useState('');
  const [help, setHelp] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      const ok = /^\S+@\S+\.\S+$/.test(email) || /^\+?\d[\d\s-]{7,}$/.test(email);
      if (!ok) return setErr(c.err);
      setErr('');
      setStep(2);
      return;
    }
    if (pw.length < 4) return setErr(c.pwErr);
    signIn(email);
    nav('/profiles');
  };

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <div className="flex flex-1 flex-col" style={{ background: 'linear-gradient(180deg, #3d1313 0%, #2a0b0b 30%, #000 85%)' }}>
        <header className="h-[77px] w-full border-b border-[#ffffff1a] p-6 sm:px-8 md:h-[93px] md:px-12">
          <div className="mx-auto flex h-full max-w-[1188px] items-center">
            <Logo height={24} className="md:hidden" />
            <Logo height={40} className="max-md:hidden" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[488px] flex-1 px-5 pb-16 pt-8 min-h-[677px] sm:min-h-[725px] sm:px-6">
          <form onSubmit={submit} noValidate>
            <h1 className={`text-[32px] font-bold leading-[45px] max-sm:max-w-[300px] ${lang === 'en' ? 'max-sm:leading-10' : ''}`}>{step === 1 ? c.h1 : c.pwTitle}</h1>
            {step === 1 ? (
              <h2 className="mt-2 text-lg2 leading-[25px] text-dim">{c.h2}</h2>
            ) : (
              <p className="mt-2 text-lg2 text-dim">
                {email}{' '}
                <button type="button" onClick={() => setStep(1)} className="text-white underline">
                  {c.change}
                </button>
              </p>
            )}
            <div className="relative mt-6">
              {step === 1 ? (
                <input
                  type="text"
                  name="userLoginId"
                  autoComplete="email"
                  aria-label={c.email}
                  placeholder={c.email}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-14 w-full rounded-sm border bg-[#16161699] px-4 text-base text-white placeholder:text-dim outline-none focus:outline-2 focus:outline-offset-2 focus:outline-white ${err ? 'border-accent' : 'border-[#808080b3]'}`}
                />
              ) : (
                <input
                  type="password"
                  name="password"
                  autoFocus
                  autoComplete="current-password"
                  aria-label={c.pw}
                  placeholder={c.pw}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className={`h-14 w-full rounded-sm border bg-[#16161699] px-4 text-base text-white placeholder:text-dim outline-none focus:outline-2 focus:outline-offset-2 focus:outline-white ${err ? 'border-accent' : 'border-[#808080b3]'}`}
                />
              )}
              {err && (
                <p role="alert" className="mt-2 text-sm text-[#eb3942]">
                  ⊗ {err}
                </p>
              )}
            </div>
            <button type="submit" className="mt-3 h-12 w-full rounded-sm bg-accent text-lg2 font-bold transition-colors hover:bg-accent-hover">
              {step === 1 ? c.cont : c.signIn}
            </button>
            <div className="mt-12">
              <button type="button" onClick={() => setHelp((h) => !h)} aria-expanded={help} className={`inline-flex items-center gap-1 text-base text-white ${lang === 'en' ? 'font-normal' : 'font-bold'}`}>
                {c.help}
                <ChevronDown size={16} className={`transition-transform ${help ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {help && (
                  <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    {c.helpItems.map((h) => (
                      <li key={h} className="mt-3 text-base text-white underline">
                        {h}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
            <div className="mt-9 text-xs2 text-faint">{c.bot}</div>
          </form>
        </main>
      </div>
      <LoginFooter lang={lang} />
    </div>
  );
}
