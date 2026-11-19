import Link from 'next/link';

export function PromoBar() {
  return (
    <div className="promo-bar-bg text-white">
      <Link
        href="/categories/graphic-design/"
        className="container-fw flex h-10 items-center justify-center gap-2 text-center text-xs font-medium md:text-sm"
      >
        <span className="truncate">โปรโมชันพิเศษ! ลดสูงสุด 15% สำหรับการจ้างงานครั้งแรก</span>
        <span className="hidden shrink-0 rounded-pill bg-white/25 px-2.5 py-0.5 font-semibold sm:inline">ดูเลย</span>
      </Link>
    </div>
  );
}
