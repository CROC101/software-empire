import Image from 'next/image';
import Link from 'next/link';
import { brand } from '@/config/brand.config';

export default function NotFound() {
  return (
    <div className="container-fw flex flex-col items-center py-20 text-center">
      <Image src={brand.mascots.empty} alt="" width={220} height={176} />
      <h1 className="mt-4 text-2xl font-semibold text-ink">ไม่พบหน้าที่คุณต้องการ</h1>
      <p className="mt-1 text-sm text-ink-3">หน้านี้อาจถูกย้ายหรือไม่มีอยู่แล้ว</p>
      <Link href="/" className="mt-5 rounded-sm bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">กลับหน้าแรก</Link>
    </div>
  );
}
