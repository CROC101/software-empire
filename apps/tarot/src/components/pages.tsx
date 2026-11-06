import { MeshMascot } from "@empire/ui";
import { LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { useTarotData } from "@/lib/data";
import { bangkokDay, dailyCard, interpret } from "@/lib/reading";
import { signInUrl, signOut, useSession } from "@/lib/session";
import { Announcement, Help } from "./announce";
import { CheckIn } from "./check-in";
import { ProfileForm } from "./profile-form";
import { Reminder } from "./reminder";
import { CardMeaning, TarotCard } from "./tarot-card";

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** The card of the day: one per person per Bangkok day, turned over by a tap. */
export function DailyPage() {
  const { user } = useSession();
  const { profile } = useTarotData();
  const day = bangkokDay();
  const drawn = useMemo(() => dailyCard(user?.id ?? "guest", day), [user?.id, day]);
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-28 pt-4">
      <header className="flex flex-col items-center text-center">
        <MeshMascot kind="owl" label="นกฮูกหมอดูของ crocwork" className="size-24" />
        <p className="mt-1 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--em-blue-300)]">
          ไพ่ประจำวัน
        </p>
        <h1 className="text-2xl font-black text-[var(--em-ink-0)]">
          {profile ? `สวัสดี ${profile.nickname}` : "ไพ่ของคุณวันนี้"}
        </h1>
        <p className="text-sm text-[var(--em-ink-300)]">{thaiDate.format(new Date())}</p>
      </header>

      <Announcement />
      <TarotCard
        drawn={drawn}
        open={open}
        onOpen={() => setOpen(true)}
        label="แตะเพื่อเปิดไพ่ประจำวัน"
        className="mx-auto w-48 sm:w-56"
      />
      {open ? (
        <CardMeaning drawn={drawn} text={interpret(drawn, "general")} />
      ) : (
        <p className="text-center text-sm text-[var(--em-ink-200)]">ตั้งสมาธิ แล้วแตะที่ไพ่</p>
      )}
      <CheckIn />
    </div>
  );
}

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
