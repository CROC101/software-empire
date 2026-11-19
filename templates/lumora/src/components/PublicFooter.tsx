import { Link } from 'react-router-dom';
import { brand } from '../brand.config';
import { LangSelect } from './LangSelect';
import { Caret } from './Icons';

type L = [label: string, to: string];
const LANDING_LINKS: L[] = [
  ['คำถามที่พบบ่อย', '/th/#faq'],
  ['ศูนย์ช่วยเหลือ', '/th/#faq'],
  ['บัญชี', '/youraccount'],
  ['ศูนย์สื่อมวลชน', '/th/'],
  ['นักลงทุนสัมพันธ์', '/th/'],
  ['ตำแหน่งงาน', '/th/'],
  ['แลกบัตรของขวัญ', '/redeem'],
  ['ซื้อบัตรของขวัญ', '/gift-cards'],
  ['วิธีรับชม', '/browse'],
  ['ข้อกำหนดการใช้งาน', '/th/'],
  ['ความเป็นส่วนตัว', '/th/'],
  ['การตั้งค่าคุกกี้', '/th/'],
  ['ข้อมูลบริษัท', '/th/'],
  ['ติดต่อเรา', '/th/'],
  ['ทดสอบความเร็ว', '/th/'],
  ['ประกาศแจ้งทางกฎหมาย', '/th/'],
  [`ที่ ${brand.name} เท่านั้น`, '/browse'],
];

const linkCls = 'text-sm leading-[21px] text-dim underline underline-offset-2 hover:text-white';

/** Footer of the public home page: 4 / 2 / 1 columns. */
export function LandingFooter() {
  return (
    <div className="gutter mx-auto max-w-[1920px] pb-24 pt-10 text-dim">
      <footer>
      <p className="text-base leading-[23px]">
        หากมีคำถาม โทรติดต่อ{' '}
        <a href={`tel:${brand.phone}`} className="underline underline-offset-2">
          {brand.phone}
        </a>
      </p>
      <ul className="mt-[31px] grid grid-cols-1 gap-y-3 sm:grid-cols-2 md:grid-cols-4">
        {LANDING_LINKS.map(([l, to]) => (
          <li key={l} className="pl-1">
            <Link to={to} className={linkCls}>
              {l}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-[57px]">
        <LangSelect />
      </div>
      <p className="mt-[39px] text-sm text-dim">{brand.regionLabel}</p>
      <p className="mt-9 text-xs2 text-faint">หน้านี้มีระบบป้องกันบ็อตอัตโนมัติ เพื่อความปลอดภัยของบัญชีคุณ</p>
      </footer>
    </div>
  );
}

/** Footer of the sign-in page (#161616 band). */
export function LoginFooter({ lang }: { lang: 'th' | 'en' }) {
  const t = lang === 'en';
  const links: string[] = t
    ? ['FAQ', 'Help Center', 'Terms of Use', 'Privacy', 'Cookie Preferences', 'Corporate Information']
    : ['คำถามที่พบบ่อย', 'ศูนย์ช่วยเหลือ', 'ข้อกำหนดการใช้งาน', 'ความเป็นส่วนตัว', 'การตั้งค่าคุกกี้', 'ข้อมูลบริษัท'];
  return (
    <footer className="w-full border-t border-[#ffffff1a] bg-footer text-dim">
      <div className="mx-auto max-w-[1188px] px-6 pb-8 pt-8 sm:px-8 md:px-12 md:pb-16 md:pt-[72px]">
        <p className="text-base leading-6">
          {t ? 'Questions? Call ' : 'หากมีข้อสงสัย โทรติดต่อ '}
          <a href={`tel:${brand.phone}`} className="hover:underline">
            {brand.phone} <span className={t ? '' : 'max-sm:block'}>{t ? '(Toll-Free)' : '(บริการฟรี)'}</span>
          </a>
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-y-4 text-sm leading-5 md:grid-cols-4">
          {links.map((l) => (
            <li key={l}>
              <Link to="/th/" className="text-sm leading-5 underline underline-offset-2 hover:text-white">
                {l}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <LangSelect value={lang} onChange={() => {}} />
        </div>
      </div>
    </footer>
  );
}

const GIFT_LINKS: L[] = [
  ['FAQ', '/th/#faq'],
  ['Help Center', '/th/'],
  ['Account', '/youraccount'],
  [`${brand.name} House`, '/th/'],
  ['Media Center', '/th/'],
  ['Investor Relations', '/th/'],
  ['Jobs', '/th/'],
  [`${brand.name} Shop`, '/th/'],
  ['Redeem Gift Cards', '/redeem'],
  ['Buy Gift Cards', '/gift-cards'],
  ['Ways to Watch', '/browse'],
  ['Terms of Use', '/th/'],
  ['Privacy', '/th/'],
  ['Cookie Preferences', '/th/'],
  ['Corporate Information', '/th/'],
  ['Contact Us', '/th/'],
  ['Speed Test', '/th/'],
  ['Legal Notices', '/th/'],
  [`Only on ${brand.name}`, '/browse'],
  ['Do Not Sell or Share My Personal Information', '/th/'],
  ['Ad Choices', '/th/'],
];

/** Footer of redeem / gift-card pages: 1000px column, grey 13px links. */
export function GiftFooter({ topLine = false }: { topLine?: boolean }) {
  return (
    <div className={`w-full bg-black text-muted ${topLine ? 'border-t-2 border-accent' : ''}`}>
      <div className="mx-auto max-w-[1000px] px-[5%] pb-5 pt-5 md:px-0">
        <p className="text-base leading-5">
          <a href={`tel:${brand.phone}`} className="inline-block hover:underline">
            Questions? Contact us.
          </a>
        </p>
        <ul className="mt-[30px] grid grid-cols-2 gap-y-4 pb-4 text-xs2 leading-4 sm:grid-cols-4">
          {GIFT_LINKS.map(([l, to]) => (
            <li key={l} className="pr-6">
              <Link to={to} className="inline-block hover:underline">
                {l}
              </Link>
            </li>
          ))}
        </ul>
        <div className="relative mt-5 inline-flex items-center text-xs2">
          <svg className="absolute left-3.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M2.5 12h19M12 2.5c3 3.5 3 15.5 0 19M12 2.5c-3 3.5-3 15.5 0 19" />
          </svg>
          <select aria-label="Language" defaultValue="en" className="lang-select h-12 w-[126px] border border-[#333] bg-black pl-[50px] pr-6 outline-none">
            <option value="en">English</option>
            <option value="th">ไทย</option>
          </select>
          <Caret className="pointer-events-none absolute right-2 h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
