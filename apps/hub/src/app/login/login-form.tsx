"use client";

import { Button, Input, Label } from "@empire/ui";
import { useActionState, useState } from "react";
import { authenticate, type AuthState } from "./actions";
import { VerifyCode } from "./verify-code";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(authenticate, {} satisfies AuthState);
  // "เปลี่ยนอีเมล" leaves the code screen without throwing away the typed address
  const [left, setLeft] = useState<AuthState | null>(null);

  if (state.verify && state.email && left !== state)
    return (
      <VerifyCode
        email={state.email}
        purpose={state.verify}
        next={next}
        onBack={() => setLeft(state)}
      />
    );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">อีเมล</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.email}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">รหัสผ่าน</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          maxLength={72}
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "auth-error" : undefined}
        />
      </div>

      <p id="auth-error" role="alert" className="min-h-5 text-sm text-destructive">
        {state.error}
      </p>
      {state.notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {state.notice}
        </p>
      )}

      <Button type="submit" name="intent" value="signin" variant="aurora" disabled={pending}>
        {pending ? "กำลังดำเนินการ…" : "เข้าสู่ระบบ"}
      </Button>
      <Button type="submit" name="intent" value="signup" variant="outline" disabled={pending}>
        สมัครสมาชิกใหม่
      </Button>
      {/* formNoValidate: a code login needs only the email, not the password field */}
      <Button
        type="submit"
        name="intent"
        value="code"
        variant="ghost"
        formNoValidate
        disabled={pending}
      >
        เข้าสู่ระบบด้วยรหัสทางอีเมล
      </Button>
    </form>
  );
}
