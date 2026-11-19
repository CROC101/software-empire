import { Caret, Translate } from './Icons';
import { useStore } from '../store';

/** Bordered language picker (124×32) used in public headers and footers. */
export function LangSelect({ compact = false, value, onChange }: { compact?: boolean; value?: 'th' | 'en'; onChange?: (v: 'th' | 'en') => void }) {
  const stored = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const v = value ?? stored;
  return (
    <div className={`relative inline-flex items-center rounded-sm border border-[#ffffff4d] bg-field text-white ${compact ? 'h-8 w-[66px] max-sm:w-[66px] sm:w-[124px]' : 'h-8 w-[124px]'}`}>
      <span className="sr-only">เลือกภาษา</span>
      <Translate className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
      <select
        name="LanguageSelect"
        aria-label="เลือกภาษา"
        value={v}
        onChange={(e) => (onChange ?? setLang)(e.target.value as 'th' | 'en')}
        className={`lang-select h-full w-full cursor-pointer bg-transparent pl-9 pr-7 text-base font-medium outline-none ${compact ? 'max-sm:text-transparent' : ''}`}
      >
        <option value="th" className="bg-white text-black">ไทย</option>
        <option value="en" className="bg-white text-black">English</option>
      </select>
      <Caret className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
    </div>
  );
}
