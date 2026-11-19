'use client';

import { Ticket } from 'lucide-react';
import { useTikTok } from '@/context/TikTokContext';
import { vouchers } from '@/data/seed-tiktok';
import { baht } from '@/lib/format';

/** Claimable/selectable vouchers; selected + claimed ones apply at checkout. */
export default function VoucherList({ subtotal }: { subtotal: number }) {
  const { claimed, selectedVouchers, claimVoucher, toggleVoucher } = useTikTok();
  return (
    <ul className="space-y-2">
      {vouchers.map((v) => {
        const got = claimed.includes(v.id);
        const on = got && selectedVouchers.includes(v.id);
        const short = subtotal < v.minSpend;
        return (
          <li key={v.id} className={`flex items-center gap-3 rounded-md border p-2.5 ${on ? 'border-brand bg-brand/5' : 'border-line'}`}>
            <Ticket size={20} className="shrink-0 text-brand" />
            <div className="min-w-0 flex-1">
              <p className="text-14 font-semibold">{v.label}</p>
              <p className="text-12 text-muted">{short ? `Spend ${baht(v.minSpend - subtotal)} more to use` : v.detail}</p>
            </div>
            {got
              ? <input type="checkbox" checked={on} onChange={() => toggleVoucher(v.id)} aria-label={`Use ${v.label}`} className="h-4 w-4 accent-[#fe2c55]" />
              : <button onClick={() => claimVoucher(v.id)} className="h-7 rounded-pill bg-brand px-3 text-12 font-bold text-white">Claim</button>}
          </li>
        );
      })}
    </ul>
  );
}
