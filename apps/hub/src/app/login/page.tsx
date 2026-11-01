import { safeNext } from "@/lib/apps";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getClaims } from "@/lib/supabase/server";
import { BrandMetal } from "./brand-metal";
import { FloatingPaths } from "./floating-paths";
import { AuthPanel } from "./login-form";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5 font-heading text-xl font-bold">
      <Image src="/crocwork-logo.webp" alt="" width={28} height={32} className="h-8 w-auto" />
      crocwork.studio
    </span>
  );
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getClaims()) redirect(next);

  return (
    <main className="relative lg:grid lg:min-h-dvh lg:grid-cols-2">
      {/* brand panel, desktop: the logo in liquid chrome over slowly tracing curves */}
      <aside className="relative hidden flex-col overflow-hidden border-r bg-muted/60 p-10 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div aria-hidden className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 z-10 bg-gradient-to-t from-background to-transparent"
        />
        <div className="relative z-10">
          <Wordmark />
        </div>
        <div aria-hidden className="relative z-10 my-auto">
          <BrandMetal />
        </div>
        <blockquote className="relative z-10 space-y-2">
          <p className="font-heading text-2xl font-bold leading-snug">
            บัญชีเดียว เปิดได้ทุกระบบ
            <br />
            Community · Commerce · Toolboxes · Empire Canvas
          </p>
          <footer className="text-sm font-semibold text-muted-foreground">— crocwork.studio</footer>
        </blockquote>
      </aside>

      <section className="relative flex min-h-dvh flex-col justify-center px-4 py-24">
        {/* soft light in the corner, as on the brand panel */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-24 -top-40 h-[40rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--foreground)_6%,transparent),transparent)]" />
          <div className="absolute -top-24 right-24 h-[30rem] w-60 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--em-blue-600)_8%,transparent),transparent)]" />
        </div>
        <Link
          href="/"
          className="absolute left-5 top-7 inline-flex min-h-11 items-center gap-1 rounded-md px-3 text-sm font-medium hover:bg-accent"
        >
          <ChevronLeft aria-hidden className="size-4" />
          หน้าแรก
        </Link>
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            <Wordmark />
          </div>
          <AuthPanel
            next={next}
            mode={params.mode === "signup" ? "signup" : "signin"}
            alert={
              params.error === "callback"
                ? "ลิงก์ยืนยันใช้ไม่ได้หรือหมดอายุ ลองเข้าสู่ระบบอีกครั้ง"
                : undefined
            }
          />
        </div>
      </section>
    </main>
  );
}
