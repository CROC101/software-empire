"use client";

import { Mail, PartyPopper } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** A newsletter box that checks the address before sending, then swaps itself for a thank-you note. */
export default function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const id = useId();
  return (
    <section className="bg-background px-6 py-16 text-foreground @container">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-border bg-card p-8">
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              role="status"
              className="text-center"
            >
              <PartyPopper aria-hidden className="mx-auto size-8 text-primary" />
              <p className="mt-3 font-heading text-2xl font-black">ขอบคุณที่สมัคร</p>
              <p className="mt-1 text-sm text-muted-foreground">
                ตัวอย่างเท่านั้น ไม่ได้ส่งอีเมลจริง
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              exit={{ opacity: 0, y: -12 }}
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (!EMAIL.test(email.trim())) {
                  setError("กรอกอีเมลให้ถูกรูปแบบ เช่น you@example.com");
                  return;
                }
                setDone(true);
              }}
            >
              <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                <Mail aria-hidden className="size-5" />
              </span>
              <h2 className="mt-4 font-heading text-2xl font-black">รับเทคนิคใหม่ทุกเดือน</h2>
              <p className="mt-1 text-sm text-muted-foreground">เดือนละฉบับ ยกเลิกได้ทุกเมื่อ</p>
              <div className="mt-5 flex flex-col gap-2 @md:flex-row">
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
                  className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
                >
                  สมัคร
                </button>
              </div>
              <p
                id={`${id}-err`}
                aria-live="polite"
                className="mt-2 min-h-5 text-sm text-destructive"
              >
                {error}
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
