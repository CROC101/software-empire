'use client';

import { useState } from 'react';
import { CheckCircle2, Coins } from 'lucide-react';
import { Modal } from '@/components/common/Overlay';
import { useTikTok } from '@/context/TikTokContext';
import { baht } from '@/lib/format';

const PACKS = [70, 350, 700, 1400, 3500, 7000];

export default function CoinModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { coins, rechargeCoins } = useTikTok();
  const [pick, setPick] = useState(350);
  const [done, setDone] = useState(false);
  const close = () => { setDone(false); onClose(); };

  return (
    <Modal open={open} onClose={close} title="Get Coins" width={520}>
      <div className="px-6 pb-6">
        <p className="mb-4 flex items-center justify-center gap-2 text-15">Balance: <Coins size={18} className="text-gold" /><b>{coins.toLocaleString()}</b> Coins</p>
        {done ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 size={56} className="text-[#22c55e]" />
            <p className="text-17 font-semibold">Recharge successful</p>
            <p className="text-14 text-muted">{pick.toLocaleString()} Coins were added to your wallet.</p>
            <button onClick={close} className="mt-2 h-11 w-40 rounded-btn bg-brand text-15 font-semibold text-white">Done</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PACKS.map((n) => (
                <button key={n} onClick={() => setPick(n)} aria-pressed={pick === n}
                  className={`flex flex-col items-center gap-1 rounded-md border-2 p-3 ${pick === n ? 'border-brand bg-brand/5' : 'border-line hover:bg-pill'}`}>
                  <span className="flex items-center gap-1 text-17 font-bold"><Coins size={18} className="text-gold" />{n.toLocaleString()}</span>
                  <span className="text-13 text-muted">{baht(Math.round(n * 0.5))}</span>
                </button>
              ))}
            </div>
            <button onClick={() => { rechargeCoins(pick); setDone(true); }} className="mt-5 h-11 w-full rounded-btn bg-brand text-16 font-semibold text-white hover:brightness-95">
              Recharge {baht(Math.round(pick * 0.5))}
            </button>
            <p className="mt-3 text-center text-12 text-muted">Demo only: no real payment is made.</p>
          </>
        )}
      </div>
    </Modal>
  );
}
