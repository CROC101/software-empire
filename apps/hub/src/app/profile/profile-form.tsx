"use client";

import { Button } from "@empire/ui";
import { useActionState } from "react";
import { saveProfile, type ProfileState } from "./actions";

const input =
  "w-full rounded-lg border bg-background px-3 py-2.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ProfileForm({ name, bio }: { name: string; bio: string }) {
  const [state, save, saving] = useActionState<ProfileState, FormData>(saveProfile, null);
  return (
    <form action={save} className="grid gap-5">
      <label className="grid gap-1.5">
        <span className="text-sm font-semibold">ชื่อที่แสดง</span>
        <input
          name="display_name"
          defaultValue={name}
          required
          maxLength={60}
          autoComplete="nickname"
          className={input}
        />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-semibold">แนะนำตัว</span>
        <textarea name="bio" defaultValue={bio} maxLength={280} rows={4} className={input} />
        <span className="text-xs text-muted-foreground">ไม่เกิน 280 ตัวอักษร</span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving} className="cw-btn-blue">
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
        <p
          role="status"
          className={
            state?.ok === false ? "text-sm text-destructive" : "text-sm text-muted-foreground"
          }
        >
          {state?.message}
        </p>
      </div>
    </form>
  );
}
