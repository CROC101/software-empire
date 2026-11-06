import { MeshMascot } from "@empire/ui";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { useTarotData } from "@/lib/data";
import { signInUrl, signOut, useSession } from "@/lib/session";
import { Help } from "./announce";
import { ProfileForm } from "./profile-form";
import { Reminder } from "./reminder";

/** Profile, coins and sign-out; signed-out readers get a way in. */
export function MePage() {
  const { user, ready } = useSession();
  const { status, loaded } = useTarotData();
  const [saved, setSaved] = useState(false);

  if (!ready) return null;
  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 pb-28 pt-10 text-center text-[var(--em-ink-50)]">
        <MeshMascot kind="owl" label="นกฮูกหมอดูของ crocwork" className="size-28" />
        <h1 className="text-2xl font-black text-[var(--em-ink-0)]">เข้าสู่ระบบ crocwork</h1>
        <p className="text-sm text-[var(--em-ink-200)]">
          บัญชีเดียวใช้ได้ทุกระบบของ crocwork เก็บเหรียญและโปรไฟล์ของคุณไว้
        </p>
        <a
          href={signInUrl(window.location.href)}
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-6 font-bold text-primary-foreground"
        >
          เข้าสู่ระบบ
        </a>
        <div className="w-full space-y-4 text-left">
          <Help />
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-28 pt-6 text-[var(--em-ink-50)]">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--em-ink-0)]">โปรไฟล์ของฉัน</h1>
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-[var(--em-ink-200)] hover:bg-[color-mix(in_oklab,var(--em-ink-0)_8%,transparent)]"
        >
          <LogOut className="size-4" aria-hidden /> ออกจากระบบ
        </button>
      </header>
      <dl className="grid grid-cols-2 gap-3">
        <div className="tt-panel p-4">
          <dt className="text-xs text-[var(--em-ink-300)]">เหรียญ</dt>
          <dd className="font-heading text-2xl font-bold tabular-nums text-[var(--em-gold-300)]">
            {status?.coins ?? 0}
          </dd>
        </div>
        <div className="tt-panel p-4">
          <dt className="text-xs text-[var(--em-ink-300)]">เช็กอินติดกัน</dt>
          <dd className="font-heading text-2xl font-bold tabular-nums">
            {status?.streak ?? 0} วัน
          </dd>
        </div>
      </dl>
      {loaded && (
        <div className="tt-panel p-4">
          <ProfileForm onSaved={() => setSaved(true)} />
          {saved && (
            <p role="status" className="mt-3 text-center text-sm text-[var(--em-gold-300)]">
              บันทึกแล้ว
            </p>
          )}
        </div>
      )}
      <Reminder />
      <Help />
    </div>
  );
}
