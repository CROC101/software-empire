import { Coins } from "lucide-react";
import { useState } from "react";
import { checkIn } from "@/lib/api";
import { CheckInCalendar } from "./calendar";
import { useTarotData } from "@/lib/data";
import { signInUrl, useSession } from "@/lib/session";

/** Seven days of a streak; the 7th pays 30 instead of 10 (tarot.check_in in SQL decides). */
export function CheckIn() {
  const { user } = useSession();
  const { status, setStatus } = useTarotData();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  // bumps after a check-in so the calendar re-reads this month
  const [refresh, setRefresh] = useState(0);

  if (!user) {
    return (
      <div className="tt-panel flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm">เข้าสู่ระบบเพื่อเช็กอินรับเหรียญทุกวัน</p>
        <a
          href={signInUrl(window.location.href)}
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground"
        >
          เข้าสู่ระบบ
        </a>
      </div>
    );
  }

  const streak = status?.streak ?? 0;
  const done = status?.checked_today ?? false;

  const onCheckIn = async () => {
    setBusy(true);
    setNote("");
    try {
      const r = await checkIn();
      setStatus(r);
      setRefresh((n) => n + 1);
      setNote(r.earned > 0 ? `ได้รับ ${String(r.earned)} เหรียญ` : "วันนี้เช็กอินไปแล้ว");
    } catch (error) {
      console.error(error);
      setNote("เช็กอินไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="checkin-title" className="tt-panel space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="checkin-title" className="font-bold">
            เช็กอินรายวัน
          </h2>
          <p className="text-sm text-[var(--em-ink-300)]">
            ติดกัน {streak} วัน · วันที่ 7 รับ 30 เหรียญ
          </p>
        </div>
        <p className="flex items-center gap-1.5 font-heading text-lg font-bold tabular-nums text-[var(--em-gold-300)]">
          <Coins className="size-5" aria-hidden />
          {status?.coins ?? 0}
        </p>
      </div>
      <CheckInCalendar refresh={refresh} />
      <button
        type="button"
        onClick={() => void onCheckIn()}
        disabled={busy || done || !status}
        className="min-h-11 w-full rounded-md bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        {done ? "เช็กอินวันนี้แล้ว" : busy ? "กำลังเช็กอิน…" : "เช็กอินวันนี้"}
      </button>
      <p role="status" className="min-h-5 text-center text-sm text-[var(--em-gold-300)]">
        {note}
      </p>
    </section>
  );
}
