"use client";

import { useActionState, useState } from "react";
import { saveApp, saveSettings, type SystemState } from "./actions";

const field = "cw-glass w-full rounded-xl bg-background px-3 py-2 text-base";

function Status({ state }: { state: SystemState }) {
  return (
    <p
      role="status"
      className={state?.ok === false ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
    >
      {state?.message}
    </p>
  );
}

/** The launch time, the countdown's message and the banner on every hub page. */
export function SettingsForm(props: {
  launchAt: string;
  soonMessage: string;
  announcement: string;
  open: boolean;
}) {
  const [state, act, pending] = useActionState<SystemState, FormData>(saveSettings, null);
  const [armed, setArmed] = useState(false);
  return (
    <form action={act} className="cw-glass grid gap-4 rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-xl font-bold">เวลาเปิดเว็บ</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            props.open ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {props.open ? "เปิดแล้ว" : "ยังไม่เปิด · คนทั่วไปเห็นนับถอยหลัง"}
        </span>
      </div>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold">เปิดเมื่อ (เวลาไทย)</span>
        <input
          type="datetime-local"
          name="launch_at"
          required
          defaultValue={props.launchAt}
          className={`${field} sm:max-w-xs`}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold">ข้อความหน้านับถอยหลัง</span>
        <textarea
          name="soon_message"
          maxLength={500}
          rows={3}
          defaultValue={props.soonMessage}
          placeholder="ว่างไว้ = ข้อความเดิม"
          className={field}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold">แถบประกาศบนสุดของ hub</span>
        <input
          name="announcement"
          maxLength={300}
          defaultValue={props.announcement}
          placeholder="ว่างไว้ = ไม่แสดงแถบ"
          className={field}
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          name="quick"
          value=""
          disabled={pending}
          className="cw-btn-blue min-h-11 rounded-lg px-5 font-bold disabled:opacity-50"
        >
          บันทึก
        </button>
        {!props.open && (
          <button
            type="submit"
            name="quick"
            value="now"
            disabled={pending}
            onClick={(e) => {
              // opening the site to everyone asks once
              if (!armed) {
                e.preventDefault();
                setArmed(true);
              }
            }}
            onBlur={() => setArmed(false)}
            className="min-h-11 rounded-lg border px-4 font-semibold hover:bg-accent disabled:opacity-50"
          >
            {armed ? "กดอีกครั้งเพื่อเปิด" : "เปิดเว็บตอนนี้"}
          </button>
        )}
        <button
          type="submit"
          name="quick"
          value="year"
          disabled={pending}
          className="min-h-11 rounded-lg border px-4 font-semibold hover:bg-accent disabled:opacity-50"
        >
          เลื่อนไปอีก 1 ปี
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

const STATUS = [
  ["open", "เปิด"],
  ["maintenance", "ปรับปรุง"],
  ["off", "ปิด"],
] as const;

/** One subsystem's switch: open / maintenance / off, its message, and whether it needs an account. */
export function AppForm(props: {
  slug: string;
  name: string;
  status: "open" | "maintenance" | "off";
  message: string;
  login: boolean;
}) {
  const [state, act, pending] = useActionState<SystemState, FormData>(saveApp, null);
  return (
    <form action={act} className="cw-glass grid gap-3 rounded-2xl p-4">
      <input type="hidden" name="slug" value={props.slug} />
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading font-bold">{props.name}</h3>
        <span className="font-mono text-xs text-muted-foreground">{props.slug}</span>
      </div>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">สถานะ {props.name}</legend>
        {STATUS.filter(([value]) => props.slug !== "hub" || value !== "off").map(
          ([value, label]) => (
            <label
              key={value}
              className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:font-bold"
            >
              <input
                type="radio"
                name="status"
                value={value}
                defaultChecked={props.status === value}
              />
              {label}
            </label>
          ),
        )}
      </fieldset>
      <label className="grid gap-1 text-sm">
        <span className="sr-only">ข้อความตอนปรับปรุงหรือปิด</span>
        <textarea
          name="message"
          maxLength={500}
          rows={2}
          defaultValue={props.message}
          placeholder="ข้อความตอนปรับปรุง / ปิด"
          className={field}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input type="checkbox" name="login" defaultChecked={props.login} className="size-4" />
          ต้องล็อกอินก่อนเข้า
        </label>
        <button
          type="submit"
          disabled={pending}
          className="ml-auto min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-accent disabled:opacity-50"
        >
          บันทึก
        </button>
      </div>
      <Status state={state} />
    </form>
  );
}
