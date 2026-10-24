"use client";

import { Button, type ButtonProps } from "@empire/ui";
import { useActionState, type ReactNode } from "react";
import type { FormState } from "./actions";

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

/** A form bound to a server action: pending state on the button, the action's message under it. */
export function ActionForm({
  action,
  hidden = {},
  submit,
  variant = "default",
  children,
  className,
}: {
  action: Action;
  hidden?: Record<string, string>;
  submit: string;
  variant?: ButtonProps["variant"];
  children?: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className ?? "flex flex-col gap-3"}>
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
      <Button type="submit" variant={variant} disabled={pending}>
        {pending ? "กำลังดำเนินการ…" : submit}
      </Button>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-sm text-success">
          {state.ok}
        </p>
      )}
    </form>
  );
}
