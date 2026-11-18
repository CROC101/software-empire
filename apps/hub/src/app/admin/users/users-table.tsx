"use client";

import { Search } from "lucide-react";
import { useActionState, useDeferredValue, useState } from "react";
import { changeUser, type UserActionState } from "./actions";

export type UserRow = {
  id: string;
  email: string | null;
  name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  last_seen: string | null;
  visits_30d: number;
  banned: boolean;
  admin: boolean;
};

type Sort = "last_seen" | "created_at" | "visits_30d" | "email";
const SORTS: [Sort, string][] = [
  ["last_seen", "เข้าใช้ล่าสุด"],
  ["created_at", "สมัครล่าสุด"],
  ["visits_30d", "เข้าใช้บ่อย"],
  ["email", "อีเมล A-Z"],
];

const when = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});
const show = (iso: string | null) => (iso ? when.format(new Date(iso)) : "–");

function compare(sort: Sort) {
  return (a: UserRow, b: UserRow) => {
    if (sort === "email") return (a.email ?? "").localeCompare(b.email ?? "");
    if (sort === "visits_30d") return b.visits_30d - a.visits_30d;
    return (b[sort] ?? "").localeCompare(a[sort] ?? "");
  };
}

/** Every account: search, sort, suspend for days, ban / unban, sign out everywhere, give or take admin. The SQL decides who may. */
export function UsersTable({ rows, me }: { rows: UserRow[]; me: string }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("last_seen");
  const [state, act, pending] = useActionState<UserActionState, FormData>(changeUser, null);
  const q = useDeferredValue(query.trim().toLowerCase());
  const shown = rows
    .filter((r) => !q || `${r.email ?? ""} ${r.name ?? ""}`.toLowerCase().includes(q))
    .sort(compare(sort));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="cw-glass flex min-h-11 flex-1 items-center gap-2 rounded-xl px-3 sm:max-w-sm">
          <Search aria-hidden className="size-4 text-muted-foreground" />
          <span className="sr-only">ค้นหาผู้ใช้</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาอีเมลหรือชื่อ"
            className="w-full bg-transparent py-2 text-base outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">เรียงตาม</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="cw-glass min-h-11 rounded-xl bg-background px-3 text-sm"
          >
            {SORTS.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <p
          role="status"
          className={
            state?.ok === false ? "text-sm text-destructive" : "text-sm text-muted-foreground"
          }
        >
          {state?.message ?? `${shown.length} จาก ${rows.length} บัญชี`}
        </p>
      </div>

      <div className="cw-glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-b text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                ผู้ใช้
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                สถานะ
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                เข้าใช้ล่าสุด
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                หน้า 30 วัน
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                สมัครเมื่อ
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {shown.map((r) => (
              <tr key={r.id} className={r.banned ? "opacity-60" : undefined}>
                <td className="max-w-64 px-4 py-3">
                  <span className="block truncate font-semibold">{r.name || "–"}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.email}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1">
                    {r.admin && <Tag tone="blue">แอดมิน</Tag>}
                    {r.banned ? <Tag tone="red">ระงับ</Tag> : <Tag>ปกติ</Tag>}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {show(r.last_seen ?? r.last_sign_in_at)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{r.visits_30d}</td>
                <td className="whitespace-nowrap px-4 py-3">{show(r.created_at)}</td>
                <td className="px-4 py-3">
                  {r.id === me ? (
                    <span className="block text-right text-xs text-muted-foreground">
                      บัญชีของคุณ
                    </span>
                  ) : (
                    <form action={act} className="flex flex-wrap justify-end gap-1">
                      <input type="hidden" name="target" value={r.id} />
                      {!r.banned && (
                        <>
                          <label className="sr-only" htmlFor={`days-${r.id}`}>
                            จำนวนวันที่พัก
                          </label>
                          <select
                            id={`days-${r.id}`}
                            name="days"
                            defaultValue="7"
                            className="min-h-9 rounded-lg border bg-background px-2 text-xs"
                          >
                            <option value="1">1 วัน</option>
                            <option value="7">7 วัน</option>
                            <option value="30">30 วัน</option>
                          </select>
                          <Action kind="suspend" pending={pending} />
                        </>
                      )}
                      <Action kind={r.banned ? "unban" : "ban"} pending={pending} />
                      <Action kind="sign_out" pending={pending} />
                      <Action kind={r.admin ? "remove_admin" : "make_admin"} pending={pending} />
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && (
          <p className="px-4 py-8 text-center text-muted-foreground">ไม่พบผู้ใช้</p>
        )}
      </div>
    </div>
  );
}

const LABEL = {
  ban: "ระงับ",
  unban: "ปลดระงับ",
  make_admin: "ตั้งแอดมิน",
  remove_admin: "ถอดแอดมิน",
  suspend: "พัก",
  sign_out: "ออกทุกเครื่อง",
} as const;

/** A ban ends their sessions and admin opens the whole back office, so those two ask once. */
function Action({ kind, pending }: { kind: keyof typeof LABEL; pending: boolean }) {
  const [armed, setArmed] = useState(false);
  const risky = kind === "ban" || kind === "make_admin" || kind === "suspend";
  return (
    <button
      type="submit"
      name="kind"
      value={kind}
      disabled={pending}
      onClick={(e) => {
        if (risky && !armed) {
          e.preventDefault();
          setArmed(true);
        }
      }}
      onBlur={() => setArmed(false)}
      className={`min-h-9 whitespace-nowrap rounded-lg border px-3 text-xs font-semibold hover:bg-accent disabled:opacity-50 ${
        kind === "ban" || kind === "suspend" ? "text-destructive" : ""
      }`}
    >
      {armed ? "กดยืนยัน" : LABEL[kind]}
    </button>
  );
}

function Tag({ tone, children }: { tone?: "blue" | "red"; children: string }) {
  const color =
    tone === "blue"
      ? "bg-primary/15 text-primary"
      : tone === "red"
        ? "bg-destructive/15 text-destructive"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{children}</span>
  );
}
