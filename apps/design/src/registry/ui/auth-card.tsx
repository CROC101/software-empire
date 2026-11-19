"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

/**
 * A sign-in card with a show-password button and a sign-up link.
 * shortcut: looks only, submit does nothing; a real page posts to the auth provider over HTTPS and never stores the password.
 */
export default function AuthCard() {
  const [show, setShow] = useState(false);
  const [note, setNote] = useState("");
  const id = useId();
  const field =
    "w-full rounded-lg border border-input bg-background px-4 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <section className="grid min-h-[36rem] place-items-center bg-muted/40 px-6 py-16 text-foreground">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setNote("ตัวอย่างเท่านั้น ไม่ได้ส่งข้อมูล");
        }}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-xl"
      >
        <p className="font-heading text-2xl font-black">ยินดีต้อนรับกลับ</p>
        <p className="mt-1 text-sm text-muted-foreground">เข้าสู่ระบบเพื่อไปต่อ</p>
        <label htmlFor={`${id}-e`} className="mt-6 mb-1 block text-sm font-semibold">
          อีเมล
        </label>
        <input id={`${id}-e`} type="email" autoComplete="email" required className={field} />
        <div className="mt-4 mb-1 flex items-center justify-between">
          <label htmlFor={`${id}-p`} className="text-sm font-semibold">
            รหัสผ่าน
          </label>
          <a href="#forgot" className="text-sm text-primary">
            ลืมรหัส
          </a>
        </div>
        <div className="relative">
          <input
            id={`${id}-p`}
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${field} pr-11`}
          />
          <button
            type="button"
            aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            aria-pressed={show}
            onClick={() => {
              setShow((s) => !s);
            }}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground"
          >
            {show ? (
              <EyeOff aria-hidden className="size-4" />
            ) : (
              <Eye aria-hidden className="size-4" />
            )}
          </button>
        </div>
        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground"
        >
          เข้าสู่ระบบ
        </button>
        <p role="status" className="mt-2 min-h-5 text-center text-sm text-muted-foreground">
          {note}
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          ยังไม่มีบัญชี?{" "}
          <a href="#signup" className="font-semibold text-primary">
            สมัครฟรี
          </a>
        </p>
      </form>
    </section>
  );
}
