"use client";

import { PASSWORD_RULES, passedRules } from "@empire/core/auth";
import { Button, Input, Label } from "@empire/ui";
import { ArrowRight, Check, Eye, EyeOff, Mail } from "lucide-react";
import { useActionState, useId, useState, type ComponentProps, type ReactNode } from "react";
import { authenticate, type AuthState } from "./actions";
import { VerifyCode } from "./verify-code";

export type AuthMode = "signin" | "signup";

const TABS: { id: AuthMode; label: string }[] = [
  { id: "signin", label: "เข้าสู่ระบบ" },
  { id: "signup", label: "สมัครสมาชิก" },
];

const PRIMARY = "h-11 w-full cw-btn-blue font-bold";

const HEADING: Record<AuthMode, [string, string]> = {
  signin: ["ยินดีต้อนรับกลับมา", "เข้าสู่ระบบด้วยรหัสผ่าน หรือรับรหัสทางอีเมล"],
  signup: ["สร้างบัญชีใหม่", "กรอกข้อมูลด้านล่าง แล้วยืนยันด้วยรหัสที่ส่งไปทางอีเมล"],
};

/** Sign in and sign up on one card; both end on the 6-digit code screen when email is needed. */
export function AuthPanel({
  next,
  mode: initial,
  alert,
}: {
  next: string;
  mode: AuthMode;
  /** a problem from before this page (an expired email link) */
  alert?: string;
}) {
  const [mode, setMode] = useState(initial);
  const id = useId();
  const [title, lead] = HEADING[mode];
  return (
    <>
      <h1 className="font-heading text-2xl font-black sm:text-3xl">{title}</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">{lead}</p>
      {alert && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {alert}
        </p>
      )}
      <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-7">
        <div
          role="tablist"
          aria-label="เลือกวิธีเข้าใช้"
          className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`${id}-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={mode === tab.id}
              aria-controls={`${id}-panel`}
              onClick={() => setMode(tab.id)}
              className={
                mode === tab.id
                  ? "rounded-md bg-background py-2 text-sm font-bold shadow-sm"
                  : "rounded-md py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${mode}`}>
          {/* key: switching tabs starts the other form fresh, errors included */}
          {mode === "signin" ? (
            <SignInForm key="signin" next={next} onSignUp={() => setMode("signup")} />
          ) : (
            <SignUpForm key="signup" next={next} onSignIn={() => setMode("signin")} />
          )}
        </div>
      </div>
    </>
  );
}

/** Once the server asks for a code, show the code screen; "เปลี่ยนอีเมล" comes back here. */
function useCodeStep(state: AuthState, next: string) {
  const [left, setLeft] = useState<AuthState | null>(null);
  if (!state.verify || !state.email || left === state) return null;
  return (
    <VerifyCode
      email={state.email}
      purpose={state.verify}
      next={next}
      onBack={() => setLeft(state)}
    />
  );
}

function SignInForm({ next, onSignUp }: { next: string; onSignUp: () => void }) {
  const [state, action, pending] = useActionState(authenticate, {} satisfies AuthState);
  const code = useCodeStep(state, next);
  if (code) return code;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="อีเมล" htmlFor="signin-email">
        <Input
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          defaultValue={state.email}
          className="h-11"
          required
        />
      </Field>
      <Field label="รหัสผ่าน" htmlFor="signin-password">
        <PasswordInput
          id="signin-password"
          autoComplete="current-password"
          minLength={8}
          aria-invalid={state.error ? true : undefined}
          aria-describedby="signin-error"
        />
      </Field>
      <FormMessage id="signin-error" state={state} />

      <Button type="submit" name="intent" value="signin" className={PRIMARY} disabled={pending}>
        {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
        {!pending && <ArrowRight aria-hidden className="size-4" />}
      </Button>

      <Divider>หรือ</Divider>
      {/* formNoValidate: a code login needs only the email, not the password */}
      <Button
        type="submit"
        name="intent"
        value="code"
        variant="outline"
        formNoValidate
        className="h-11 w-full"
        disabled={pending}
      >
        <Mail aria-hidden className="size-4" />
        รับรหัส 6 หลักทางอีเมล ไม่ต้องใช้รหัสผ่าน
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ยังไม่มีบัญชี?{" "}
        <button type="button" onClick={onSignUp} className="font-bold cw-blue hover:underline">
          สมัครสมาชิก
        </button>
      </p>
    </form>
  );
}

function SignUpForm({ next, onSignIn }: { next: string; onSignIn: () => void }) {
  const [state, action, pending] = useActionState(authenticate, {} satisfies AuthState);
  // controlled: React empties uncontrolled fields after every action, and retyping a long
  // password because the name was too long is the kind of thing that makes people leave
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const code = useCodeStep(state, next);
  if (code) return code;

  const strength = passedRules(password);
  const mismatch = confirm.length > 0 && confirm !== password;
  const invalid = (name: AuthState["field"]) => (state.field === name ? true : undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="intent" value="signup" />
      <Field label="ชื่อที่แสดง" htmlFor="signup-name">
        <Input
          id="signup-name"
          name="name"
          autoComplete="nickname"
          placeholder="เช่น จระเข้น้ำจืด"
          maxLength={40}
          defaultValue={state.name}
          className="h-11"
          aria-invalid={invalid("name")}
          required
        />
      </Field>
      <Field label="อีเมล" htmlFor="signup-email" hint="เราจะส่งรหัสยืนยัน 6 หลักไปที่อีเมลนี้">
        <Input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          defaultValue={state.email}
          className="h-11"
          aria-invalid={invalid("email")}
          required
        />
      </Field>
      <Field label="รหัสผ่าน" htmlFor="signup-password">
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={invalid("password")}
          aria-describedby="signup-rules"
        />
        <Strength id="signup-rules" password={password} passed={strength} />
      </Field>
      <Field label="ยืนยันรหัสผ่าน" htmlFor="signup-confirm">
        <PasswordInput
          id="signup-confirm"
          name="confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          aria-invalid={mismatch || invalid("confirm")}
          aria-describedby="signup-confirm-note"
        />
        <p
          id="signup-confirm-note"
          className={`min-h-4 text-xs ${mismatch ? "text-destructive" : "text-muted-foreground"}`}
        >
          {mismatch ? "ยังไม่ตรงกับรหัสผ่านด้านบน" : confirm && "ตรงกันแล้ว"}
        </p>
      </Field>
      <FormMessage id="signup-error" state={state} />

      <Button
        type="submit"
        className={PRIMARY}
        disabled={pending || mismatch || strength < PASSWORD_RULES.length}
      >
        {pending ? "กำลังส่งรหัสยืนยัน…" : "สมัครสมาชิก"}
        {!pending && <ArrowRight aria-hidden className="size-4" />}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        มีบัญชีอยู่แล้ว?{" "}
        <button type="button" onClick={onSignIn} className="font-bold cw-blue hover:underline">
          เข้าสู่ระบบ
        </button>
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="font-semibold">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Password with a show/hide eye; name defaults to "password". */
function PasswordInput(props: ComponentProps<typeof Input>) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input
        name="password"
        type={shown ? "text" : "password"}
        maxLength={72}
        required
        className="h-11 pr-11"
        {...props}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground"
      >
        {shown ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
      </button>
    </div>
  );
}

/** Three bars + the rules, ticking off as they pass (same rules the server enforces). */
function Strength({ id, password, passed }: { id: string; password: string; passed: number }) {
  const tone = ["bg-border", "bg-destructive", "bg-[var(--em-sky-500)]", "bg-[var(--em-blue-600)]"];
  return (
    <div id={id}>
      <div aria-hidden className="mt-1 grid grid-cols-3 gap-1">
        {PASSWORD_RULES.map((rule, i) => (
          <span
            key={rule.id}
            className={`h-1 rounded-full transition-colors ${i < passed ? tone[passed] : "bg-border"}`}
          />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li
              key={rule.id}
              className={`flex items-center gap-1 ${ok ? "text-foreground" : "text-muted-foreground"}`}
            >
              <Check
                aria-hidden
                className={`size-3.5 ${ok ? "text-[var(--em-blue-600)]" : "opacity-30"}`}
                strokeWidth={3}
              />
              {rule.label}
              <span className="sr-only">{ok ? "(ผ่าน)" : "(ยังไม่ผ่าน)"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FormMessage({ id, state }: { id: string; state: AuthState }) {
  return (
    <>
      <p id={id} role="alert" className="text-sm text-destructive empty:hidden">
        {state.error}
      </p>
      {state.notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {state.notice}
        </p>
      )}
    </>
  );
}

function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span aria-hidden className="h-px flex-1 bg-border" />
      {children}
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );
}
