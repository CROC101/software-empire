"use client";

import { Button, OtpInput, type OtpInputHandle, type OtpStatus } from "@empire/ui";
import { useActionState, useEffect, useRef, useState } from "react";
import { resendCode, verifyCode, type CodePurpose, type VerifyState } from "./actions";

/** Mirrors Supabase's resend window on hosted projects (auth.email.max_frequency = 60s). */
export const RESEND_SECONDS = 60;
/**
 * Wrong guesses allowed per emailed code before the screen insists on a fresh one.
 * shortcut: counted in the browser only, so a reload resets it — the server-side guard is
 * Supabase's verify rate limit (429). Move it to the DB if codes ever protect money.
 */
export const MAX_TRIES = 5;

const TITLE: Record<CodePurpose, string> = {
  signup: "ยืนยันอีเมล",
  login: "เข้าสู่ระบบด้วยรหัส",
};

export function VerifyCode({
  email,
  purpose,
  next,
  onBack,
}: {
  email: string;
  purpose: CodePurpose;
  next: string;
  onBack: () => void;
}) {
  const [verified, verify, checking] = useActionState(verifyCode, {} satisfies VerifyState);
  const [resent, resend, resending] = useActionState(resendCode, {} satisfies VerifyState);
  const form = useRef<HTMLFormElement>(null);
  const field = useRef<OtpInputHandle>(null);

  const [shownError, setShownError] = useState(false);
  const [wait, setWait] = useState(RESEND_SECONDS);
  // every server answer is a new object, so a repeat of the same wrong code still counts
  const [tries, setTries] = useState(0);
  const [seenError, setSeenError] = useState<VerifyState>(verified);
  if (verified !== seenError) {
    setSeenError(verified);
    if (verified.error) {
      setTries((n) => n + 1);
      setShownError(true);
    }
  }
  const [seenResend, setSeenResend] = useState<VerifyState>(resent);
  if (resent !== seenResend) {
    setSeenResend(resent);
    if (resent.sentAt) {
      setTries(0);
      setWait(RESEND_SECONDS);
    }
  }
  const locked = tries >= MAX_TRIES;

  useEffect(() => {
    if (!verified.error) return;
    // let the shake play, then empty the boxes for the next attempt
    const reset = setTimeout(() => {
      setShownError(false);
      field.current?.clear();
    }, 900);
    return () => clearTimeout(reset);
  }, [verified]);

  useEffect(() => {
    const tick = setInterval(() => setWait((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(tick);
  }, [resent.sentAt]);

  const status: OtpStatus = shownError ? "error" : "idle";
  const message = locked
    ? "ลองผิดครบ 5 ครั้ง ขอรหัสใหม่เพื่อลองอีกครั้ง"
    : (verified.error ?? resent.error ?? "");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">{TITLE[purpose]}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ใส่รหัส 6 หลักที่ส่งไปที่ <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <form ref={form} action={verify} className="flex flex-col items-center gap-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="purpose" value={purpose} />
        <input type="hidden" name="next" value={next} />
        <OtpInput
          ref={field}
          name="token"
          autoFocus
          disabled={checking || locked}
          status={status}
          errorMessage={message}
          hint={
            locked
              ? message
              : checking
                ? "กำลังตรวจรหัส…"
                : (resent.notice ?? `ลองผิดได้อีก ${String(MAX_TRIES - tries)} ครั้ง`)
          }
          // the last digit submits — no extra click, like every banking app
          onComplete={() => form.current?.requestSubmit()}
        />
        <Button
          type="submit"
          variant="default"
          className="w-full bg-[var(--em-blue-600)] text-[var(--em-ink-0)] hover:bg-[var(--em-blue-700)]"
          disabled={checking || locked}
        >
          {checking ? "กำลังตรวจ…" : "ยืนยัน"}
        </Button>
      </form>

      <form action={resend} className="flex items-center justify-between gap-2 text-sm">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="purpose" value={purpose} />
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground underline-offset-4 hover:underline"
        >
          ← เปลี่ยนอีเมล
        </button>
        <Button type="submit" variant="ghost" size="sm" disabled={wait > 0 || resending}>
          {resending ? "กำลังส่ง…" : wait > 0 ? `ขอรหัสใหม่ใน ${String(wait)} วิ` : "ขอรหัสใหม่"}
        </Button>
      </form>
    </div>
  );
}
