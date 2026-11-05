import { safeNext } from "@/lib/apps";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getClaims } from "@/lib/supabase/server";
import { startMfa } from "./actions";
import { MfaForm } from "./mfa-form";

export const metadata: Metadata = { title: "ยืนยันตัวตน 2 ขั้น", robots: { index: false } };

/** Admins must pass a TOTP code (session aal2) before the CMS or any app before launch. */
export default async function MfaPage({ searchParams }: PageProps<"/mfa">) {
  const next = safeNext((await searchParams).next);
  const claims = await getClaims();
  if (!claims) redirect(`/login?next=${encodeURIComponent(`/mfa?next=${next}`)}`);
  if (claims.aal === "aal2") redirect(next);

  const setup = await startMfa();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <p className="flex items-center gap-2.5 font-heading font-bold">
        <Image src="/crocwork-logo.webp" alt="" width={28} height={32} className="h-8 w-auto" />
        crocwork.studio
      </p>
      <h1 className="font-heading text-3xl font-black">ยืนยันตัวตน 2 ขั้น</h1>

      {setup.mode === "error" && (
        <p role="alert" className="text-base text-destructive">
          เปิด 2FA ไม่สำเร็จ ลองรีเฟรชหน้านี้ หรือออกจากระบบแล้วเข้าใหม่
        </p>
      )}

      {setup.mode === "enroll" && (
        <>
          <p className="text-base text-muted-foreground">
            บัญชีแอดมินต้องใช้รหัสจากแอป Authenticator (Google Authenticator, 1Password, Authy) สแกน
            QR นี้ครั้งเดียว แล้วกรอกรหัส 6 หลักที่แอปแสดง
          </p>
          {/* Supabase returns the QR as an SVG data URI; next/image cannot optimise it */}
          {/* eslint-disable-next-line @next/next/no-img-element -- inline data URI */}
          <img
            src={setup.qr}
            alt="QR สำหรับเพิ่มบัญชีในแอป Authenticator"
            width={208}
            height={208}
            className="size-52 self-center rounded-md bg-[var(--em-ink-0)] p-2"
          />
          <details className="text-base">
            <summary className="min-h-11 cursor-pointer py-2">สแกนไม่ได้? ใส่รหัสเอง</summary>
            <code className="block break-all rounded-md bg-muted p-3 font-mono">
              {setup.secret}
            </code>
          </details>
          <MfaForm factorId={setup.factorId} next={next} />
        </>
      )}

      {setup.mode === "verify" && (
        <>
          <p className="text-base text-muted-foreground">
            เปิดแอป Authenticator แล้วกรอกรหัสของ crocwork
          </p>
          <MfaForm factorId={setup.factorId} next={next} />
        </>
      )}
    </main>
  );
}
