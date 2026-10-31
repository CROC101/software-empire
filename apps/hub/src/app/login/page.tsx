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

/** The systems one account opens, as chips on the brand band. */
const OPENS = ["Community", "Commerce", "Toolboxes", "Empire Canvas", "หลังบ้าน CMS"];

const GRID = {
  backgroundImage:
    "linear-gradient(to right, oklch(1 0 0 / 0.06) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.06) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getClaims()) redirect(next);

  return (
    <main className="min-h-dvh bg-background lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* brand band: on top on phones (torn into the form), a full column on desktop */}
      <div className="relative bg-[var(--em-ink-975)] text-[var(--em-ink-0)] lg:sticky lg:top-0 lg:h-dvh">
        <aside
          aria-label="crocwork.studio"
          className="relative flex h-full flex-col gap-6 overflow-hidden px-5 pb-8 pt-5 sm:px-8 lg:justify-between lg:p-12"
          style={GRID}
        >
          <Link
            href="/"
            className="flex w-fit items-center gap-2.5 font-heading font-bold text-[var(--em-ink-0)]"
          >
            <Image src="/crocwork-logo.webp" alt="" width={28} height={32} className="h-8 w-auto" />
            crocwork.studio
          </Link>

          {/* the logo in liquid chrome; desktop only, phones skip the WebGL entirely */}
          <div aria-hidden className="hidden lg:block">
            <BrandMetal />
          </div>

          <div className="flex flex-col gap-3 lg:gap-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--em-ink-300)]">
              $ crocwork auth
            </p>
            <p className="font-heading text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              บัญชีเดียว
              <br />
              <span className="text-[var(--em-sky-500)]">เปิดได้ทุกระบบ</span>
            </p>
            <p className="max-w-md text-sm text-[var(--em-ink-300)] sm:text-base">
              สมัครครั้งเดียว ใช้ได้ทุกระบบย่อยของ crocwork session อยู่ใน cookie ที่ปลอดภัย ไม่มี
              token ใน localStorage
            </p>
            <ul className="mt-1 flex flex-wrap gap-2" aria-label="ระบบที่ใช้บัญชีนี้ได้">
              {OPENS.map((name) => (
                <li
                  key={name}
                  className="rounded-full border border-[oklch(1_0_0/0.15)] px-3 py-1 text-xs text-[var(--em-ink-100)]"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <div className="absolute inset-x-0 top-full lg:hidden">
          <TornEdge color="var(--em-ink-975)" flip />
        </div>
      </div>

      <section className="flex items-start justify-center px-4 pb-16 pt-12 sm:px-8 lg:items-center lg:py-12">
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
