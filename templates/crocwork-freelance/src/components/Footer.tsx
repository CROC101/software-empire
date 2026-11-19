import Link from 'next/link';
import { brand } from '@/config/brand.config';
import { categories } from '@/data/categories';
import { Logo } from './Logo';

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'สำหรับผู้ว่าจ้าง',
    links: [
      { label: 'ค้นหาบริการ', href: '/search/' },
      { label: 'รายการโปรด', href: '/favorites/' },
      { label: 'คำสั่งซื้อของฉัน', href: '/orders/' },
      { label: 'ข้อความ', href: '/messages/' },
    ],
  },
  {
    title: 'สำหรับฟรีแลนซ์',
    links: [
      { label: 'เริ่มรับงาน', href: '/seller/dashboard/' },
      { label: 'สร้างบริการใหม่', href: '/seller/dashboard/' },
      { label: 'ระดับผู้ขาย', href: '/search/' },
    ],
  },
  {
    title: 'เกี่ยวกับเรา',
    links: [
      { label: 'ระบบชำระเงินปลอดภัย', href: '/' },
      { label: 'ศูนย์ช่วยเหลือ', href: '/' },
      { label: 'นโยบายความเป็นส่วนตัว', href: '/' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 text-white">
      <div className="bg-brand-deep">
        <div className="container-fw grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Logo light />
            <p className="mt-3 text-sm text-white/80">{brand.tagline}</p>
            <p className="mt-4 text-sm text-white/80">โทร {brand.supportPhone}</p>
            <p className="text-sm text-white/80">{brand.supportEmail}</p>
          </div>
          <div>
            <h3 className="mb-3 text-base font-semibold">หมวดหมู่</h3>
            <ul className="space-y-2 text-sm text-white/80">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/categories/${c.slug}/`} className="hover:text-white">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-base font-semibold">{col.title}</h3>
              <ul className="space-y-2 text-sm text-white/80">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-ink">
        <div className="container-fw py-4 text-xs text-white/70">
          © {brand.copyrightYear} {brand.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
