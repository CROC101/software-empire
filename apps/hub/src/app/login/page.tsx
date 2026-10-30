import { safeNext } from "@/lib/apps";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getClaims } from "@/lib/supabase/server";
import { BrandMetal } from "./brand-metal";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getClaims()) redirect(next);

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* brand panel — decorative, so the form stays the first thing a screen reader meets */}
      <aside
        aria-hidden
        className="relative hidden flex-col justify-between overflow-hidden bg-[var(--em-ink-975)] p-12 text-[var(--em-ink-0)] lg:flex"
      >
        <div className="relative flex items-center gap-2.5 font-heading font-bold">
          crocwork.studio
        </div>
        {/* the logo in liquid chrome */}
        <BrandMetal />
        <div className="relative flex flex-col gap-4">
          <p className="font-heading text-4xl font-black leading-tight">
            บัญชีเดียว
            <br />
            <span className="text-[var(--em-sky-500)]">เปิดได้ทุกระบบย่อย</span>
          </p>
          <p className="max-w-sm text-[var(--em-ink-300)]">
            Community · Toolboxes · Empire Canvas และอีกหลายระบบ ใช้ session เดียวกันผ่าน cookie
            ที่ปลอดภัย ไม่มี token ใน localStorage
          </p>
        </div>
      </aside>

      <section className="flex items-center bg-background justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 flex items-center gap-2.5 font-heading font-bold lg:hidden"
          >
            <Image src="/crocwork-logo.webp" alt="" width={28} height={32} className="h-8 w-auto" />
            crocwork.studio
          </Link>
          <div className="rounded-2xl border bg-card p-8 shadow-sm">
            <h1 className="font-heading text-2xl font-bold">เข้าสู่ระบบ</h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">
              บัญชีเดียวใช้ได้กับทุกระบบย่อย
            </p>
            {params.error === "callback" && (
              <p role="alert" className="mb-4 text-sm text-destructive">
                ลิงก์ยืนยันใช้ไม่ได้หรือหมดอายุ ลองเข้าสู่ระบบอีกครั้ง
              </p>
            )}
            <LoginForm next={next} />
          </div>
        </div>
      </section>
    </main>
  );
}
