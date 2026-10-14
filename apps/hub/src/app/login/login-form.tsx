"use client";

import { Button, Input, Label } from "@empire/ui";
import { useActionState } from "react";
import { authenticate, type AuthState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(authenticate, {} satisfies AuthState);

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

      <Button type="submit" name="intent" value="signin" disabled={pending}>
        {pending ? "กำลังดำเนินการ…" : "เข้าสู่ระบบ"}
      </Button>
      <Button type="submit" name="intent" value="signup" variant="outline" disabled={pending}>
        สมัครสมาชิกใหม่
      </Button>
    </form>
  );
}
