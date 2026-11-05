"use client";

import { Button, Input, Label } from "@empire/ui";
import { useActionState } from "react";
import { confirmMfa, type MfaState } from "./actions";

export function MfaForm({ factorId, next }: { factorId: string; next: string }) {
  const [state, action, pending] = useActionState(confirmMfa, {} satisfies MfaState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="factorId" value={factorId} />
      <input type="hidden" name="next" value={next} />
      <Label htmlFor="code">รหัส 6 หลักจากแอป Authenticator</Label>
      <Input
        id="code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        required
        autoFocus
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? "code-error" : undefined}
        className="h-12 text-center font-mono text-2xl tracking-[0.4em]"
      />
      {state.error && (
        <p id="code-error" role="alert" className="text-base text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-12 text-base">
        {pending ? "กำลังตรวจ…" : "ยืนยัน"}
      </Button>
    </form>
  );
}
