import { Crown } from 'lucide-react';

export function ProBadge({ label = 'PRO UNLOCKED', small = false }: { label?: string; small?: boolean }) {
  return (
    <span className={`pro-crown inline-flex items-center gap-1 rounded-full font-extrabold tracking-wide text-[#1a1030] shadow-[0_0_18px_rgba(168,85,247,0.35)] ${small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'}`}>
      <Crown size={small ? 11 : 13} strokeWidth={2.6} />
      {label}
    </span>
  );
}
