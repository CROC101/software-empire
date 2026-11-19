"use client";

import { Clock, Mail, MapPin } from "lucide-react";
import { useId, useState, type SyntheticEvent } from "react";

type Errors = Partial<Record<"name" | "email" | "msg", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Contact details on the left, a form on the right that checks each field before sending.
 * shortcut: checks by hand to stay dependency-free; a real page validates with a Zod schema on both sides.
 */
export default function ContactSplit() {
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const id = useId();
  const submit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const read = (k: string) => {
      const v = f.get(k);
      return typeof v === "string" ? v.trim() : "";
    };
    const name = read("name");
    const email = read("email");
    const msg = read("msg");
    const next: Errors = {};
    if (name.length < 2) next.name = "ใส่ชื่ออย่างน้อย 2 ตัวอักษร";
    if (!EMAIL.test(email)) next.email = "อีเมลไม่ถูกต้อง";
    if (msg.length < 10) next.msg = "เล่าโจทย์อย่างน้อย 10 ตัวอักษร";
    setErrors(next);
    setSent(Object.keys(next).length === 0);
  };
  const field =
    "w-full rounded-lg border border-input bg-background px-4 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive";
  return (
    <section className="bg-background text-foreground @container">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 @3xl:grid-cols-2 @3xl:py-24">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">contact</p>
          <h2 className="mt-3 font-heading text-3xl font-black @3xl:text-5xl">
            เล่าโจทย์ให้ฟังหน่อย
          </h2>
          <ul className="mt-8 space-y-4">
            {[
              { i: Mail, t: "hello@example.com" },
              { i: Clock, t: "ตอบภายใน 24 ชั่วโมง" },
              { i: MapPin, t: "เชียงใหม่ ทำงานทางไกลได้ทั่วประเทศ" },
            ].map(({ i: Icon, t }) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon aria-hidden className="size-5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <form
          noValidate
          onSubmit={submit}
          className="space-y-4 rounded-xl border border-border bg-card p-6"
        >
          {(
            [
              ["name", "ชื่อ", "text", "name"],
              ["email", "อีเมล", "email", "email"],
            ] as const
          ).map(([k, label, type, ac]) => (
            <div key={k}>
              <label htmlFor={`${id}-${k}`} className="mb-1 block text-sm font-semibold">
                {label}
              </label>
              <input
                id={`${id}-${k}`}
                name={k}
                type={type}
                autoComplete={ac}
                aria-invalid={Boolean(errors[k])}
                aria-describedby={`${id}-${k}-e`}
                className={field}
              />
              <p id={`${id}-${k}-e`} className="mt-1 min-h-5 text-sm text-destructive">
                {errors[k]}
              </p>
            </div>
          ))}
          <div>
            <label htmlFor={`${id}-msg`} className="mb-1 block text-sm font-semibold">
              รายละเอียด
            </label>
            <textarea
              id={`${id}-msg`}
              name="msg"
              rows={4}
              aria-invalid={Boolean(errors.msg)}
              aria-describedby={`${id}-msg-e`}
              className={field}
            />
            <p id={`${id}-msg-e`} className="mt-1 min-h-5 text-sm text-destructive">
              {errors.msg}
            </p>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground"
          >
            ส่งข้อความ
          </button>
          <p role="status" className="min-h-5 text-center text-sm text-success">
            {sent ? "ได้รับแล้ว (ตัวอย่าง ไม่ได้ส่งจริง)" : ""}
          </p>
        </form>
      </div>
    </section>
  );
}
