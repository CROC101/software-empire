import { safeNext } from "@/lib/apps";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getClaims } from "@/lib/supabase/server";
import { TornEdge } from "../sections";
import { BrandMetal } from "./brand-metal";
import { AuthPanel } from "./login-form";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getClaims()) redirect(next);

  return (
    <main className="min-h-dvh bg-background lg:grid lg:grid-cols-[1fr_34rem]">
      {/* brand band: on top on phones (torn into the form), a full column on desktop */}
      <div className="relative bg-[var(--em-ink-975)] text-[var(--em-ink-0)] lg:min-h-dvh">
        <aside
          aria-label="crocwork.studio"
          className="relative mx-auto flex h-full w-full flex-col gap-6 overflow-hidden px-5 pb-8 pt-5 sm:max-w-md sm:px-0 lg:max-w-none lg:justify-between lg:p-12"
        >
          <Link
            href="/"
            className="flex w-fit items-center gap-2.5 font-heading font-bold text-[var(--em-ink-0)]"
          >
            <Image src="/crocwork-logo.webp" alt="" width={28} height={32} className="h-8 w-auto" />
            crocwork.studio
          </Link>

          <div className="flex max-w-xl flex-col gap-4">
            <h1 className="font-heading text-4xl font-black leading-[1.1] sm:text-5xl lg:text-[clamp(3.75rem,5.6vw,6rem)]">
              บัญชีเดียว
              <br />
              <span className="text-[var(--em-sky-500)]">เปิดได้ทุกระบบ</span>
            </h1>
            <p className="text-lg text-[var(--em-ink-100)]">
              เข้าสู่ระบบ crocwork.studio ด้วยบัญชีเดียว ใช้ได้ทั้ง Community, Commerce, Toolboxes,
              Empire Canvas และหลังบ้าน
            </p>
          </div>
          {/* the logo in liquid chrome; desktop only, phones skip the WebGL entirely */}
          <div aria-hidden className="hidden lg:block">
            <BrandMetal />
          </div>
        </aside>
        <div className="absolute inset-x-0 top-full lg:hidden">
          <TornEdge color="var(--em-ink-975)" flip />
        </div>
      </div>

      <section className="flex items-start justify-center px-5 pb-16 pt-12 sm:px-8 lg:items-center lg:p-12">
        <div className="w-full max-w-md">
          <AuthPanel
            next={next}
            mode={params.mode === "signup" ? "signup" : "signin"}
            alert={
              params.error === "callback"
                ? "ลิงก์ยืนยันใช้ไม่ได้หรือหมดอายุ ลองเข้าสู่ระบบอีกครั้ง"
                : undefined
            }
          />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:underline">
              ← กลับหน้าแรก
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
