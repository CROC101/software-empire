import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Login from './Login';
import { Logo } from '../components/Logo';
import { LoginFooter } from '../components/PublicFooter';
import { ChevronDown, ChevronRight } from '../components/Icons';
import { avatar } from '../lib/art';
import { brand } from '../brand.config';
import { useActiveProfile, useStore } from '../store';

const PLANS = [
  ['พื้นฐาน', '99 บาท', 'HD (720p)'],
  ['มาตรฐาน', '279 บาท', 'Full HD (1080p)'],
  ['พรีเมียม', '419 บาท', '4K + HDR และเสียงสเปเชียล'],
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      <div className="divide-y divide-[#e6e6e6] rounded-lg border border-[#d6d6d6] bg-white">{children}</div>
    </section>
  );
}

function RowLink({ label, sub, onClick }: { label: string; sub?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-[#f5f5f5]">
      <span>
        <span className="block font-medium">{label}</span>
        {sub && <span className="text-sm text-[#666]">{sub}</span>}
      </span>
      <ChevronRight size={20} />
    </button>
  );
}

export default function Account() {
  const s = useStore();
  const active = useActiveProfile();
  const nav = useNavigate();
  const [open, setOpen] = useState<string | null>(null);
  const [plan, setPlan] = useState(2);
  const [choosingPlan, setChoosingPlan] = useState(false);
  const [toast, setToast] = useState('');

  if (!s.signedIn) return <Login lang="en" />;

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 2400);
  };
  const next = new Date(Date.now() + 18 * 864e5).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-[#141414]">
      <header className="flex h-[72px] items-center justify-between border-b border-[#d6d6d6] bg-white px-[4%]">
        <Logo height={30} to="/browse" />
        <div className="flex items-center gap-4">
          <Link to="/browse" className="text-sm font-medium hover:underline">
            กลับไปที่ {brand.name}
          </Link>
          <img src={avatar(active?.avatar ?? 0)} alt="" className="h-8 w-8 rounded-sm" />
        </div>
      </header>

      <main className="mx-auto max-w-[920px] px-5 pb-20 pt-8">
        <h1 className="text-[32px] font-bold">บัญชี</h1>
        <p className="mt-1 text-[#666]">รายละเอียดสมาชิก</p>

        <section className="mt-6 overflow-hidden rounded-lg border border-[#d6d6d6] bg-white">
          <div className="bg-gradient-to-r from-[#7b2ff7] via-[#e50914] to-[#f09819] px-5 py-2 text-sm font-semibold text-white">สมาชิกตั้งแต่ มกราคม 2025</div>
          <div className="px-5 py-4">
            <p className="text-lg font-semibold">แพ็กเกจ{PLANS[plan][0]}</p>
            <p className="text-[#666]">วันชำระเงินครั้งถัดไป: {next}</p>
            <p className="mt-1 flex items-center gap-2 text-[#666]">
              <span className="rounded-sm border border-[#ccc] px-1.5 text-xs font-bold">VISA</span> •••• •••• •••• 4242
            </p>
          </div>
          <RowLink label="จัดการสมาชิก" sub="เปลี่ยนแพ็กเกจ" onClick={() => setChoosingPlan((c) => !c)} />
          <AnimatePresence initial={false}>
            {choosingPlan && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-[#e6e6e6]">
                <div className="grid gap-3 p-5 sm:grid-cols-3">
                  {PLANS.map(([name, price, q], i) => (
                    <button
                      key={name}
                      onClick={() => (setPlan(i), setChoosingPlan(false), flash(`เปลี่ยนเป็นแพ็กเกจ${name}แล้ว`))}
                      className={`rounded-lg border-2 p-4 text-left ${i === plan ? 'border-accent' : 'border-[#ddd] hover:border-[#999]'}`}
                    >
                      <span className="block font-semibold">{name}</span>
                      <span className="block text-sm text-[#666]">{price}/เดือน</span>
                      <span className="mt-2 block text-sm">{q}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <Section title="ลิงก์ด่วน">
          <RowLink label="อัปเดตวิธีการชำระเงิน" onClick={() => flash('ตัวอย่างนี้ไม่มีการชำระเงินจริง')} />
          <RowLink label="แลกบัตรของขวัญหรือรหัสโปรโมชัน" onClick={() => nav('/redeem')} />
          <RowLink label="ประวัติการชำระเงิน" sub="รายการย้อนหลัง 12 เดือน" onClick={() => flash('ยังไม่มีประวัติในตัวอย่างนี้')} />
        </Section>

        <Section title="ความปลอดภัยและความเป็นส่วนตัว">
          <div className="px-5 py-4">
            <p className="text-sm text-[#666]">อีเมล</p>
            <p className="font-medium">{s.email || 'สมาชิก'}</p>
          </div>
          <RowLink label="เปลี่ยนรหัสผ่าน" onClick={() => flash('ส่งลิงก์เปลี่ยนรหัสผ่านแล้ว (ตัวอย่าง)')} />
          <RowLink
            label="ออกจากระบบทุกอุปกรณ์"
            onClick={() => {
              s.signOut();
              nav('/th/');
            }}
          />
        </Section>

        <Section title="โปรไฟล์และการควบคุมโดยผู้ปกครอง">
          {s.profiles.map((p) => (
            <div key={p.id}>
              <button onClick={() => setOpen((o) => (o === p.id ? null : p.id))} aria-expanded={open === p.id} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[#f5f5f5]">
                <img src={avatar(p.avatar)} alt="" className="h-12 w-12 rounded-md" />
                <span className="flex-1">
                  <span className="block font-medium">{p.name}</span>
                  <span className="text-sm text-[#666]">{p.kids ? 'โปรไฟล์เด็ก' : `ทุกระดับ ≤ ${p.maturity}`}</span>
                </span>
                <ChevronDown size={20} className={`transition-transform ${open === p.id ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {open === p.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-[#fafafa]">
                    <div className="space-y-3 px-5 py-4 pl-[84px] text-sm">
                      <label className="flex items-center justify-between gap-4">
                        <span>ภาษา</span>
                        <select value={s.lang} onChange={(e) => s.setLang(e.target.value as 'th' | 'en')} className="rounded border border-[#ccc] bg-white px-2 py-1">
                          <option value="th">ไทย</option>
                          <option value="en">English</option>
                        </select>
                      </label>
                      <label className="flex items-center justify-between gap-4">
                        <span>เล่นตอนถัดไปอัตโนมัติ</span>
                        <input type="checkbox" checked={p.autoplayNext} onChange={(e) => s.upsertProfile({ ...p, autoplayNext: e.target.checked })} className="h-5 w-5 accent-[#e50914]" />
                      </label>
                      <label className="flex items-center justify-between gap-4">
                        <span>เล่นตัวอย่างอัตโนมัติขณะเรียกดู</span>
                        <input type="checkbox" checked={p.autoplayPreviews} onChange={(e) => s.upsertProfile({ ...p, autoplayPreviews: e.target.checked })} className="h-5 w-5 accent-[#e50914]" />
                      </label>
                      <div className="flex items-center justify-between gap-4">
                        <span>ประวัติการรับชม</span>
                        <span className="text-[#666]">{Object.keys(s.data[p.id]?.progress ?? {}).length} เรื่อง</span>
                      </div>
                      <Link to="/profiles?manage=1" className="inline-block font-medium text-[#0071eb] hover:underline">
                        แก้ไขโปรไฟล์
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </Section>

        <Section title="การเล่น">
          <div className="space-y-3 px-5 py-4 text-sm">
            <div className="flex justify-between">
              <span>ความเร็วเริ่มต้น</span>
              <span className="text-[#666]">{s.settings.speed}x</span>
            </div>
            <div className="flex justify-between">
              <span>คำบรรยาย</span>
              <span className="text-[#666]">{s.settings.subtitles}</span>
            </div>
            <div className="flex justify-between">
              <span>เสียง</span>
              <span className="text-[#666]">{s.settings.audio}</span>
            </div>
          </div>
        </Section>
      </main>
      <div className="bg-[#161616] text-[#ffffffb3]">
        <LoginFooter lang="th" />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div role="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-md bg-[#141414] px-5 py-3 text-sm text-white shadow-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
