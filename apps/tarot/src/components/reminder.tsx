import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { disablePush, enablePush, pushState, type PushState } from "@/lib/push";

/** The morning reminder switch: one notification at 08:00 to open the day's card. */
export function Reminder() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    pushState()
      .then(setState)
      .catch(() => setState("unsupported"));
  }, []);

  const toggle = async () => {
    setBusy(true);
    setError("");
    try {
      setState(state === "on" ? await disablePush() : await enablePush());
    } catch (err) {
      console.error(err);
      setError("ตั้งค่าแจ้งเตือนไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  };

  if (state === null) return null;
  return (
    <section aria-labelledby="reminder-title" className="tt-panel space-y-2 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="reminder-title" className="font-bold text-[var(--em-ink-0)]">
            เตือนทุกเช้า 8 โมง
          </h2>
          <p className="text-sm text-[var(--em-ink-300)]">
            แจ้งเตือนให้มาเปิดไพ่ประจำวันและเช็กอิน
          </p>
        </div>
        {(state === "on" || state === "off") && (
          <button
            type="button"
            role="switch"
            aria-checked={state === "on"}
            aria-labelledby="reminder-title"
            onClick={() => void toggle()}
            disabled={busy}
            className={`flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-bold disabled:opacity-50 ${
              state === "on"
                ? "bg-primary text-primary-foreground"
                : "border border-[color-mix(in_oklab,var(--em-ink-0)_25%,transparent)]"
            }`}
          >
            {state === "on" ? (
              <Bell className="size-4" aria-hidden />
            ) : (
              <BellOff className="size-4" aria-hidden />
            )}
            {state === "on" ? "เปิดอยู่" : "ปิดอยู่"}
          </button>
        )}
      </div>
      {state === "unsupported" && (
        <p className="text-sm text-[var(--em-ink-300)]">
          เบราว์เซอร์นี้ยังรับแจ้งเตือนไม่ได้ บน iPhone ให้กดแชร์ แล้ว “เพิ่มไปยังหน้าจอโฮม” ก่อน
          แล้วเปิดจากไอคอนนั้น
        </p>
      )}
      {state === "denied" && (
        <p className="text-sm text-[var(--em-ink-300)]">
          คุณเคยปิดการแจ้งเตือนของเว็บนี้ไว้ เปิดได้ที่ตั้งค่าของเบราว์เซอร์
          (ไอคอนแม่กุญแจหน้าลิงก์)
        </p>
      )}
      <p role="alert" className="text-sm text-[var(--em-danger-dark)]">
        {error}
      </p>
    </section>
  );
}
