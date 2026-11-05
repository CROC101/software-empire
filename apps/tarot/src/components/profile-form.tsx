import { useState } from "react";
import { GENDERS, profileSchema, saveProfile, type Profile } from "@/lib/api";
import { useTarotData } from "@/lib/data";
import { useSession } from "@/lib/session";

const MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];
const BE = 543;
const thisYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => thisYear - i);

const field =
  "min-h-11 w-full rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] bg-[color-mix(in_oklab,var(--em-ink-975)_60%,transparent)] px-3 text-[var(--em-ink-0)]";

/** Nickname, birthday (Buddhist-era year) and gender: what personal readings are tuned by. */
export function ProfileForm({ onSaved }: { onSaved?: () => void }) {
  const { user } = useSession();
  const { profile, setProfile } = useTarotData();
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [y, m, d] = (profile?.birth_date ?? "--").split("-");
  const [year, setYear] = useState(y ?? "");
  const [month, setMonth] = useState(m ?? "");
  const [day, setDay] = useState(d ?? "");
  const [gender, setGender] = useState<Profile["gender"]>(profile?.gender ?? "unspecified");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!user) return;
    // a birthday is optional, but half of one is a mistake
    const parts = [year, month, day].filter(Boolean).length;
    if (parts > 0 && parts < 3) {
      setError("กรอกวันเกิดให้ครบ หรือเว้นว่างทั้งหมด");
      return;
    }
    const birth = parts === 3 ? `${year}-${month}-${day}` : null;
    // 31 Feb rolls over to March in Date: compare the round trip, and no birthdays in the future
    const at = birth ? new Date(`${birth}T00:00:00Z`) : null;
    if (birth && at && (at.toISOString().slice(0, 10) !== birth || at > new Date())) {
      setError("วันเกิดไม่ถูกต้อง");
      return;
    }
    const parsed = profileSchema.safeParse({ nickname, birth_date: birth, gender });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveProfile(user.id, parsed.data, profile !== null);
      setProfile(parsed.data);
      onSaved?.();
    } catch (err) {
      console.error(err);
      setError("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-5" noValidate>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">ชื่อเล่น</span>
        <input
          className={field}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={30}
          autoComplete="nickname"
          placeholder="อย่างน้อย 2 ตัวอักษร"
          required
        />
      </label>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-semibold">วันเกิด (ไม่บังคับ)</legend>
        <div className="grid grid-cols-[1fr_1.4fr_1.4fr] gap-2">
          <select
            aria-label="วัน"
            className={field}
            value={day}
            onChange={(e) => setDay(e.target.value)}
          >
            <option value="">วัน</option>
            {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((v) => (
              <option key={v} value={v}>
                {Number(v)}
              </option>
            ))}
          </select>
          <select
            aria-label="เดือน"
            className={field}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="">เดือน</option>
            {MONTHS.map((label, i) => (
              <option key={label} value={String(i + 1).padStart(2, "0")}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="ปี พ.ศ."
            className={field}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">ปี พ.ศ.</option>
            {YEARS.map((ce) => (
              <option key={ce} value={String(ce)}>
                {ce + BE}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-semibold">เพศ</legend>
        <div className="grid grid-cols-2 gap-2">
          {GENDERS.map((g) => (
            <label
              key={g.id}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] px-3 has-[:checked]:border-[var(--em-blue-300)] has-[:checked]:bg-[color-mix(in_oklab,var(--em-blue-400)_20%,transparent)]"
            >
              <input
                type="radio"
                name="gender"
                value={g.id}
                checked={gender === g.id}
                onChange={() => setGender(g.id)}
                className="accent-[var(--em-blue-400)]"
              />
              {g.label}
            </label>
          ))}
        </div>
      </fieldset>

      <p role="alert" className="min-h-5 text-sm text-[var(--em-danger-dark)]">
        {error}
      </p>
      <button
        type="submit"
        disabled={busy}
        className="min-h-11 w-full rounded-md bg-primary font-bold text-primary-foreground disabled:opacity-50"
      >
        {busy ? "กำลังบันทึก…" : "บันทึก"}
      </button>
    </form>
  );
}
