"use client";

import { Mail } from "lucide-react";
import { useId, useState } from "react";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * A subscribe card: a CSS-drawn night lake on top, a muted inner panel with the pitch and an email
 * box below. The address is checked on submit; nothing is sent.
 */
export default function LetterCta({
  title = "จดหมายจากสตูดิโอ เดือนละฉบับ",
  cta = "สมัครรับ",
}: {
  title?: string;
  cta?: string;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const id = useId();

  return (
    <section className="@container bg-background px-4 py-16 text-foreground">
      <div className="mx-auto max-w-3xl overflow-clip rounded-xl border border-border bg-card">
        <div
          aria-hidden
          className="relative h-44 bg-linear-to-b from-(--em-blue-800) via-(--em-blue-600) to-(--em-sky-400) @lg:h-60"
        >
          <span className="absolute top-6 right-10 size-10 rounded-full bg-(--em-ink-50) @lg:size-14" />
          <span className="absolute inset-x-0 bottom-10 h-24 bg-(--em-ink-900)/70 [clip-path:polygon(0_100%,0_55%,14%_20%,27%_60%,41%_10%,56%_55%,70%_25%,85%_60%,100%_30%,100%_100%)]" />
          <span className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-b from-(--em-blue-900) to-(--em-ink-975)" />
        </div>

        <div className="m-3 rounded-lg bg-muted p-6 @lg:p-10">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Mail aria-hidden className="size-4" />
            ฉบับล่าสุดส่งเมื่อ 1 พ.ย.
          </p>
          <h2 className="mt-3 font-heading text-3xl font-black @lg:text-4xl">{title}</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            งานที่เพิ่งเสร็จ เครื่องมือที่เราใช้จริง และสิ่งที่ลองแล้วไม่เวิร์ก อ่านจบในห้านาที
          </p>

          {done ? (
            <p
              role="status"
              className="mt-6 rounded-lg border border-border bg-card px-4 py-3 text-sm"
            >
              สมัครแล้ว ตัวอย่างนี้ไม่ได้ส่งอีเมลจริง
            </p>
          ) : (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (!EMAIL.test(email.trim())) {
                  setError("กรอกอีเมลให้ถูกรูปแบบ เช่น you@example.com");
                  return;
                }
                setDone(true);
              }}
              className="mt-6"
            >
              <div className="flex flex-col gap-2 @md:flex-row">
                <label htmlFor={id} className="sr-only">
                  อีเมล
                </label>
                <input
                  id={id}
                  type="email"
                  autoComplete="email"
                  value={email}
                  aria-invalid={error !== ""}
                  aria-describedby={`${id}-err`}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="you@example.com"
                  className="min-w-0 flex-1 rounded-lg border border-input bg-background px-4 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {cta}
                </button>
              </div>
              <p
                id={`${id}-err`}
                aria-live="polite"
                className="mt-2 min-h-5 text-sm text-destructive"
              >
                {error}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
