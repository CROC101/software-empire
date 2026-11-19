import { Check, ClipboardList, Home, Package, Truck, Warehouse } from 'lucide-react';
import { STAGES } from '@/data/seed-tiktok';
import { fmtTime, orderStage } from '@/lib/format';
import type { Order } from '@/types/tiktok';

const ICONS = [ClipboardList, Package, Warehouse, Truck, Home];

/** 5-stage stepper plus the carrier's scan history (newest first). */
export default function LogisticsTimeline({ order }: { order: Order }) {
  const stage = orderStage(order);
  return (
    <div>
      <ol className="flex items-start">
        {STAGES.map((s, i) => {
          const Icon = ICONS[i];
          const done = i <= stage && !order.cancelled;
          return (
            <li key={s} className="relative flex flex-1 flex-col items-center text-center">
              {i > 0 && <span className={`absolute right-1/2 top-5 h-0.5 w-full -translate-y-1/2 ${i <= stage && !order.cancelled ? 'bg-[#00a87e]' : 'bg-line'}`} />}
              <span className={`relative flex h-10 w-10 items-center justify-center rounded-full ${done ? 'bg-[#00a87e] text-white' : 'bg-pill text-muted'}`}>
                {done && i < stage ? <Check size={18} /> : <Icon size={18} />}
              </span>
              <span className={`mt-2 px-1 text-11 leading-4 sm:text-12 ${done ? 'font-semibold' : 'text-muted'}`}>{s}</span>
            </li>
          );
        })}
      </ol>
      <ul className="mt-6 space-y-0">
        {[...order.events].reverse().map((e, i) => (
          <li key={e.scan} className="relative flex gap-3 pb-5 pl-1">
            <span className={`relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ${i === 0 ? 'bg-[#00a87e] ring-4 ring-[#00a87e]/20' : 'bg-muted-2'}`} />
            {i < order.events.length - 1 && <span className="absolute left-[9px] top-4 h-full w-px bg-line" />}
            <div className="min-w-0">
              <p className={`text-14 ${i === 0 ? 'font-semibold text-[#00a87e]' : ''}`}>{e.title}</p>
              <p className="text-12 text-muted">{e.location} · {fmtTime(e.at)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
