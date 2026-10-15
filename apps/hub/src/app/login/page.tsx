import { safeNext } from "@/lib/apps";
import { BrandMark } from "@empire/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getClaims } from "@/lib/supabase/server";
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
        className="relative hidden flex-col justify-between overflow-hidden bg-rail p-12 text-white lg:flex"
      >
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-aurora opacity-40 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-aurora opacity-30 blur-3xl" />
        <div className="relative flex items-center gap-2.5 font-heading font-bold">
          <BrandMark />
          Software Empire
        </div>
        <div className="relative flex flex-col gap-4">
          <p className="font-heading text-4xl font-extrabold leading-tight tracking-tight">
            บัญชีเดียว
            <br />
            เปิดได้ทุกระบบย่อย
          </p>
          <p className="max-w-sm text-white/75">
            Community · Toolboxes · Empire Canvas และอีกหลายระบบ ใช้ session เดียวกันผ่าน cookie
            ที่ปลอดภัย ไม่มี token ใน localStorage
          </p>
        </div>
        <p className="relative text-sm text-white/60">Core Hub · Software Empire</p>
      </aside>

      <section className="hub-aurora-backdrop flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 flex items-center gap-2.5 font-heading font-bold lg:hidden"
          >
            <BrandMark />
            Software Empire
          </Link>
          <div className="rounded-2xl border bg-card p-8 shadow-sm">
            <h1 className="font-heading text-2xl font-bold tracking-tight">เข้าสู่ระบบ</h1>
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
