import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Pencil, Plus } from '../components/Icons';
import { AVATAR_COLORS, avatar } from '../lib/art';
import { useStore, type Profile } from '../store';

const MATURITY: Profile['maturity'][] = ['ทั่วไป', '7+', '13+', '16+', '18+'];

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-2 text-[#ccc]">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="h-6 w-6 accent-[#e50914]" />
      {label}
    </label>
  );
}

function EditProfile({ p, isNew, onDone }: { p: Profile; isNew: boolean; onDone: () => void }) {
  const upsert = useStore((s) => s.upsertProfile);
  const remove = useStore((s) => s.deleteProfile);
  const count = useStore((s) => s.profiles.length);
  const [d, setD] = useState(p);
  const [err, setErr] = useState('');
  const save = () => {
    if (!d.name.trim()) return setErr('กรุณาใส่ชื่อ');
    upsert({ ...d, name: d.name.trim(), maturity: d.kids ? '7+' : d.maturity });
    onDone();
  };
  return (
    <motion.div className="mx-auto w-full max-w-[640px] px-6" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.3 }}>
      <h1 className="text-[clamp(32px,5vw,64px)] font-normal">{isNew ? 'เพิ่มโปรไฟล์' : 'แก้ไขโปรไฟล์'}</h1>
      <div className="mt-4 flex gap-5 border-y border-[#333] py-6 max-sm:flex-col">
        <div>
          <img src={avatar(d.avatar)} alt="" className="h-28 w-28 rounded-md" />
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {AVATAR_COLORS.map((_, i) => (
              <button key={i} aria-label={`รูปโปรไฟล์ ${i + 1}`} onClick={() => setD({ ...d, avatar: i })} className={`overflow-hidden rounded-sm ring-2 ${d.avatar === i ? 'ring-white' : 'ring-transparent'}`}>
                <img src={avatar(i)} alt="" className="h-6 w-6" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <input
            value={d.name}
            maxLength={20}
            onChange={(e) => (setD({ ...d, name: e.target.value }), setErr(''))}
            placeholder="ชื่อ"
            aria-label="ชื่อโปรไฟล์"
            className="h-10 w-full bg-[#666] px-3 text-white outline-none placeholder:text-[#ccc] focus:ring-1 focus:ring-white"
          />
          {err && <p className="mt-1 text-sm text-[#e87c03]">{err}</p>}
          <Toggle on={d.kids} onChange={(kids) => setD({ ...d, kids })} label="โปรไฟล์เด็ก (เฉพาะเนื้อหาสำหรับอายุไม่เกิน 7 ปี)" />
          {!d.kids && (
            <div className="mt-3 border-t border-[#333] pt-4">
              <p className="text-lg text-[#ccc]">ระดับความเหมาะสม</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {MATURITY.map((m) => (
                  <button key={m} onClick={() => setD({ ...d, maturity: m })} className={`rounded-sm border px-3 py-1 text-sm ${d.maturity === m ? 'border-white bg-white text-black' : 'border-[#666] text-[#ccc]'}`}>
                    {m}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#999]">แสดงเฉพาะเรื่องที่มีระดับ {d.maturity} หรือต่ำกว่า</p>
            </div>
          )}
          <div className="mt-4 border-t border-[#333] pt-3">
            <p className="text-lg text-[#ccc]">การควบคุมการเล่นอัตโนมัติ</p>
            <Toggle on={d.autoplayNext} onChange={(autoplayNext) => setD({ ...d, autoplayNext })} label="เล่นตอนถัดไปอัตโนมัติ" />
            <Toggle on={d.autoplayPreviews} onChange={(autoplayPreviews) => setD({ ...d, autoplayPreviews })} label="เล่นตัวอย่างอัตโนมัติขณะเรียกดู" />
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-4">
        <button onClick={save} className="bg-white px-6 py-2 font-medium tracking-wide text-black hover:bg-accent hover:text-white">
          บันทึก
        </button>
        <button onClick={onDone} className="border border-[#808080] px-6 py-2 tracking-wide text-[#808080] hover:border-white hover:text-white">
          ยกเลิก
        </button>
        {!isNew && count > 1 && (
          <button onClick={() => (remove(p.id), onDone())} className="border border-[#808080] px-6 py-2 tracking-wide text-[#808080] hover:border-white hover:text-white">
            ลบโปรไฟล์
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function Profiles() {
  const signedIn = useStore((s) => s.signedIn);
  const profiles = useStore((s) => s.profiles);
  const select = useStore((s) => s.selectProfile);
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const manage = params.get('manage') === '1';
  const [editing, setEditing] = useState<{ p: Profile; isNew: boolean } | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);

  if (!signedIn) return <Navigate to="/th/login" replace />;

  const choose = (p: Profile) => {
    if (manage) return setEditing({ p, isNew: false });
    setLeaving(p.id);
    select(p.id);
    setTimeout(() => nav('/browse'), 450);
  };

  return (
    <div className="flex min-h-screen flex-col bg-app text-white">
      <header className="app-gutter flex h-[68px] items-center">
        <Logo height={28} to="/profiles" />
      </header>
      <main className="flex flex-1 items-center justify-center pb-[8vh]">
        <AnimatePresence mode="wait">
          {editing ? (
            <EditProfile key="edit" p={editing.p} isNew={editing.isNew} onDone={() => setEditing(null)} />
          ) : (
            <motion.div
              key="gate"
              className="text-center"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={leaving ? { opacity: 0, scale: 1.15 } : { opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.45, ease: [0.215, 0.61, 0.355, 1] }}
            >
              <h1 className="text-[clamp(28px,3.5vw,56px)] font-medium">{manage ? 'จัดการโปรไฟล์' : 'ใครกำลังดูอยู่'}</h1>
              <ul className="mx-auto mt-6 flex max-w-[90vw] flex-wrap justify-center gap-[2vw]">
                {profiles.map((p, i) => (
                  <motion.li key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i + 0.15 }}>
                    <button onClick={() => choose(p)} className="group flex w-[clamp(84px,10vw,200px)] flex-col items-center text-[#808080] outline-none hover:text-white focus-visible:text-white">
                      <span className="relative block w-full overflow-hidden rounded-md ring-white transition-shadow group-hover:ring-[3px] group-focus-visible:ring-[3px]">
                        <img src={avatar(p.avatar)} alt="" className="aspect-square w-full" />
                        {p.kids && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-sm bg-[#ffd400] px-1.5 text-xs font-bold text-black">KIDS</span>}
                        {manage && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/55">
                            <span className="flex h-[30%] w-[30%] items-center justify-center rounded-full border-2 border-white">
                              <Pencil size={22} className="text-white" />
                            </span>
                          </span>
                        )}
                      </span>
                      <span className="mt-3 truncate text-[clamp(13px,1.3vw,22px)]">{p.name}</span>
                    </button>
                  </motion.li>
                ))}
                {profiles.length < 5 && (
                  <motion.li initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * profiles.length + 0.15 }}>
                    <button
                      onClick={() => setEditing({ p: { id: `p${Date.now()}`, name: '', avatar: profiles.length % AVATAR_COLORS.length, kids: false, maturity: '18+', autoplayNext: true, autoplayPreviews: true }, isNew: true })}
                      className="group flex w-[clamp(84px,10vw,200px)] flex-col items-center text-[#808080] hover:text-white"
                    >
                      <span className="flex aspect-square w-full items-center justify-center rounded-md group-hover:bg-[#e5e5e5]">
                        <span className="flex h-1/2 w-1/2 items-center justify-center rounded-full bg-[#808080] text-[#141414] group-hover:bg-[#141414] group-hover:text-[#e5e5e5]">
                          <Plus size={40} />
                        </span>
                      </span>
                      <span className="mt-3 text-[clamp(13px,1.3vw,22px)]">เพิ่มโปรไฟล์</span>
                    </button>
                  </motion.li>
                )}
              </ul>
              <button
                onClick={() => setParams(manage ? {} : { manage: '1' })}
                className={`mt-[5vw] border px-6 py-2 text-[clamp(13px,1.2vw,18px)] tracking-[2px] ${manage ? 'border-white bg-white text-black hover:bg-accent hover:text-white hover:border-accent' : 'border-[#808080] text-[#808080] hover:border-white hover:text-white'}`}
              >
                {manage ? 'เสร็จสิ้น' : 'จัดการโปรไฟล์'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
