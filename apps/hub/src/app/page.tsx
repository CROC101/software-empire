import { BrandMark, Button } from "@empire/ui";
import Link from "next/link";
import { getClaims } from "@/lib/supabase/server";
import { subsystems } from "@/lib/subsystems";
import { SubsystemGrid } from "./subsystem-grid";

const highlights = [
  { value: String(subsystems.length), label: "ระบบย่อย" },
  { value: "1", label: "บัญชีเดียว (SSO)" },
  { value: "0 ฿", label: "ค่าเซิร์ฟเวอร์" },
];

export default async function HomePage() {
  const claims = await getClaims();
  const cta = claims
    ? { href: "/dashboard", label: "ไปที่แดชบอร์ด" }
    : { href: "/login", label: "เริ่มใช้งาน" };

  return (
    <div className="hub-aurora-backdrop min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-heading font-bold tracking-tight">
          <BrandMark />
          <span>Software Empire</span>
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link href={cta.href}>{claims ? "แดชบอร์ด" : "เข้าสู่ระบบ"}</Link>
        </Button>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
        <section className="flex flex-col items-start gap-6">
          <p className="rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            Core Hub · ล็อกอินครั้งเดียว ใช้ได้ทุกระบบ
          </p>
          <h1 className="max-w-3xl font-heading text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
            อาณาจักรซอฟต์แวร์ <span className="text-aurora">ที่สร้างโดยคนเดียว</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            ระบบย่อย {subsystems.length} ตัวบน monorepo เดียว ทำงานฝั่งเบราว์เซอร์เป็นหลัก
            ทุกตารางคุมสิทธิ์ด้วย Row Level Security และไม่มีค่าเซิร์ฟเวอร์
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="aurora" size="lg">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <a href="#subsystems">ดูระบบย่อยทั้งหมด</a>
            </Button>
          </div>
          <dl className="mt-4 grid w-full max-w-xl grid-cols-3 gap-3">
            {highlights.map((h) => (
              <div key={h.label} className="rounded-2xl border bg-card/70 p-4 backdrop-blur">
                <dt className="text-xs text-muted-foreground">{h.label}</dt>
                <dd className="font-heading text-2xl font-bold">{h.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="subsystems" className="flex scroll-mt-8 flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 id="subsystems" className="font-heading text-2xl font-bold tracking-tight">
              ระบบย่อย
            </h2>
            <p className="text-muted-foreground">กดการ์ดเพื่อเปิดระบบที่พร้อมใช้งาน</p>
          </div>
          <SubsystemGrid />
        </section>
      </main>
    </div>
  );
}
