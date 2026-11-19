"use client";

import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useId, useState } from "react";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Centred headline over an underwater glow, an announcement chip and an email box that checks itself. */
export default function HeroCentered({
  title = "ทุกอย่างที่ทีมต้องใช้ ในที่เดียว",
  cta = "ขอเข้าใช้ก่อน",
}: {
  title?: string;
  cta?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "bad" | "ok">("idle");
  const id = useId();
  return (
    <section className="relative overflow-hidden bg-background text-foreground @container">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center @3xl:py-28">
        <a
          href="#news"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-sm"
        >
          <Sparkles aria-hidden className="size-3.5 text-primary" />
          ชิ้นส่วนใหม่ 70 แบบ
          <ArrowRight aria-hidden className="size-3.5" />
        </a>
        <h1 className="mt-6 font-heading text-4xl leading-tight font-black @3xl:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          แชท งาน ไฟล์ และการประชุม อยู่ในแอปเดียว ไม่ต้องสลับแท็บทั้งวัน
        </p>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setState(EMAIL.test(email.trim()) ? "ok" : "bad");
          }}
          className="mt-8 flex w-full max-w-md flex-col gap-2 @md:flex-row"
        >
          <label htmlFor={id} className="sr-only">
            อีเมล
          </label>
          <input
            id={id}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            aria-invalid={state === "bad"}
            aria-describedby={`${id}-msg`}
            onChange={(e) => {
              setEmail(e.target.value);
              setState("idle");
            }}
            className="min-w-0 flex-1 rounded-lg border border-input bg-card px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground"
          >
            {cta}
          </button>
        </form>
        <p id={`${id}-msg`} aria-live="polite" className="mt-2 h-5 text-sm">
          {state === "bad" && <span className="text-destructive">อีเมลไม่ถูกต้อง</span>}
          {state === "ok" && (
            <span className="inline-flex items-center gap-1 text-success">
              <Check aria-hidden className="size-4" />
              รับเรื่องแล้ว (ตัวอย่าง ไม่ได้ส่งจริง)
            </span>
          )}
        </p>
      </div>
    </section>
  );
}
